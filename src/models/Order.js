// src/models/Order.js
const { executeQuery, executeTransaction } = require('../config/database');

class Order {
  constructor(orderData) {
    this.id = orderData.id;
    this.cliente_id = orderData.cliente_id;
    this.vendedor_id = orderData.vendedor_id;
    this.sucursal_id = orderData.sucursal_id;
    this.numero_pedido = orderData.numero_pedido;
    this.estado = orderData.estado;
    this.tipo_entrega = orderData.tipo_entrega;
    this.direccion_entrega = orderData.direccion_entrega;
    this.subtotal = orderData.subtotal;
    this.descuento = orderData.descuento;
    this.total = orderData.total;
    this.moneda = orderData.moneda;
    this.tasa_cambio = orderData.tasa_cambio;
    this.fecha_pedido = orderData.fecha_pedido;
    this.fecha_actualizacion = orderData.fecha_actualizacion;
  }

  // Generar número de pedido único
  static generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}${random}`;
  }

  // Crear nuevo pedido
  static async create(orderData) {
    const {
      cliente_id,
      sucursal_id,
      productos,
      tipo_entrega,
      direccion_entrega,
      subtotal,
      descuento = 0,
      total,
      moneda = 'CLP',
      tasa_cambio = 1
    } = orderData;

    const numero_pedido = this.generateOrderNumber();

    const queries = [
      // Insertar pedido
      {
        query: `
          INSERT INTO pedidos (cliente_id, sucursal_id, numero_pedido, estado, tipo_entrega, 
          direccion_entrega, subtotal, descuento, total, moneda, tasa_cambio)
          VALUES (?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          cliente_id, sucursal_id, numero_pedido, tipo_entrega,
          direccion_entrega || null, subtotal, descuento, total, moneda, tasa_cambio
        ]
      }
    ];

    const results = await executeTransaction(queries);
    const pedidoId = results[0].insertId;

    // Insertar detalles del pedido
    const detalleQueries = productos.map(item => ({
      query: `
        INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `,
      params: [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
    }));

    await executeTransaction(detalleQueries);

    return pedidoId;
  }

  // Buscar pedido por ID
  static async findById(id) {
    const query = `
      SELECT p.*, 
             u.nombre as cliente_nombre, u.email as cliente_email,
             s.nombre as sucursal_nombre, s.direccion as sucursal_direccion,
             v.nombre as vendedor_nombre
      FROM pedidos p
      INNER JOIN usuarios u ON p.cliente_id = u.id
      INNER JOIN sucursales s ON p.sucursal_id = s.id
      LEFT JOIN usuarios v ON p.vendedor_id = v.id
      WHERE p.id = ?
    `;

    const orders = await executeQuery(query, [id]);

    if (orders.length === 0) return null;

    const order = new Order(orders[0]);
    order.cliente_nombre = orders[0].cliente_nombre;
    order.cliente_email = orders[0].cliente_email;
    order.sucursal_nombre = orders[0].sucursal_nombre;
    order.sucursal_direccion = orders[0].sucursal_direccion;
    order.vendedor_nombre = orders[0].vendedor_nombre;

    return order;
  }

  // Buscar pedido por número
  static async findByNumber(numero_pedido) {
    const query = 'SELECT * FROM pedidos WHERE numero_pedido = ?';
    const orders = await executeQuery(query, [numero_pedido]);

    if (orders.length === 0) return null;

    return new Order(orders[0]);
  }

  // Obtener detalles de productos del pedido
  async getProductDetails() {
    const query = `
      SELECT dp.cantidad, dp.precio_unitario, dp.subtotal,
             pr.id as producto_id, pr.codigo, pr.nombre as producto_nombre,
             c.nombre as categoria, m.nombre as marca
      FROM detalle_pedidos dp
      INNER JOIN productos pr ON dp.producto_id = pr.id
      INNER JOIN categorias c ON pr.categoria_id = c.id
      INNER JOIN marcas m ON pr.marca_id = m.id
      WHERE dp.pedido_id = ?
    `;

    return await executeQuery(query, [this.id]);
  }

  // Obtener pedidos por cliente
  static async findByCliente(cliente_id, filters = {}) {
    let query = `
      SELECT p.*, s.nombre as sucursal_nombre, s.direccion as sucursal_direccion
      FROM pedidos p
      INNER JOIN sucursales s ON p.sucursal_id = s.id
      WHERE p.cliente_id = ?
    `;
    const params = [cliente_id];

    if (filters.estado) {
      query += ' AND p.estado = ?';
      params.push(filters.estado);
    }

    if (filters.fecha_desde) {
      query += ' AND p.fecha_pedido >= ?';
      params.push(filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      query += ' AND p.fecha_pedido <= ?';
      params.push(filters.fecha_hasta);
    }

    query += ' ORDER BY p.fecha_pedido DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    const orders = await executeQuery(query, params);
    return orders.map(orderData => new Order(orderData));
  }

  // Obtener todos los pedidos con filtros
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*,
             u.nombre as cliente_nombre, u.email as cliente_email,
             s.nombre as sucursal_nombre,
             v.nombre as vendedor_nombre
      FROM pedidos p
      INNER JOIN usuarios u ON p.cliente_id = u.id
      INNER JOIN sucursales s ON p.sucursal_id = s.id
      LEFT JOIN usuarios v ON p.vendedor_id = v.id
      WHERE 1 = 1
    `;
    const params = [];

    if (filters.estado) {
      query += ' AND p.estado = ?';
      params.push(filters.estado);
    }

    if (filters.sucursal_id) {
      query += ' AND p.sucursal_id = ?';
      params.push(filters.sucursal_id);
    }

    if (filters.cliente_id) {
      query += ' AND p.cliente_id = ?';
      params.push(filters.cliente_id);
    }

    if (filters.fecha_desde) {
      query += ' AND p.fecha_pedido >= ?';
      params.push(filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      query += ' AND p.fecha_pedido <= ?';
      params.push(filters.fecha_hasta);
    }

    query += ' ORDER BY p.fecha_pedido DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    const orders = await executeQuery(query, params);
    return orders.map(orderData => {
      const order = new Order(orderData);
      order.cliente_nombre = orderData.cliente_nombre;
      order.cliente_email = orderData.cliente_email;
      order.sucursal_nombre = orderData.sucursal_nombre;
      order.vendedor_nombre = orderData.vendedor_nombre;
      return order;
    });
  }

  // Actualizar estado del pedido
  async updateStatus(estado, vendedor_id = null) {
    const query = 'UPDATE pedidos SET estado = ?, vendedor_id = ? WHERE id = ?';
    await executeQuery(query, [estado, vendedor_id, this.id]);

    this.estado = estado;
    if (vendedor_id) {
      this.vendedor_id = vendedor_id;
    }
  }

  // Obtener estadísticas de pedidos
  static async getStats(filters = {}) {
    let query = `
      SELECT 
        estado,
        COUNT(*) as total,
        SUM(total) as monto_total
      FROM pedidos
      WHERE 1 = 1
    `;
    const params = [];

    if (filters.sucursal_id) {
      query += ' AND sucursal_id = ?';
      params.push(filters.sucursal_id);
    }

    if (filters.fecha_desde) {
      query += ' AND fecha_pedido >= ?';
      params.push(filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      query += ' AND fecha_pedido <= ?';
      params.push(filters.fecha_hasta);
    }

    query += ' GROUP BY estado';

    return await executeQuery(query, params);
  }

  // Obtener pedidos pendientes de aprobación
  static async getPendingApproval(sucursal_id = null) {
    let query = `
      SELECT p.*, u.nombre as cliente_nombre, s.nombre as sucursal_nombre
      FROM pedidos p
      INNER JOIN usuarios u ON p.cliente_id = u.id
      INNER JOIN sucursales s ON p.sucursal_id = s.id
      WHERE p.estado = 'pendiente'
    `;
    const params = [];

    if (sucursal_id) {
      query += ' AND p.sucursal_id = ?';
      params.push(sucursal_id);
    }

    query += ' ORDER BY p.fecha_pedido ASC';

    const orders = await executeQuery(query, params);
    return orders.map(orderData => {
      const order = new Order(orderData);
      order.cliente_nombre = orderData.cliente_nombre;
      order.sucursal_nombre = orderData.sucursal_nombre;
      return order;
    });
  }

  // Verificar si el pedido pertenece al cliente
  async belongsToClient(cliente_id) {
    return this.cliente_id === cliente_id;
  }

  // Calcular totales del pedido
  static calculateTotals(productos) {
    const subtotal = productos.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
    const totalCantidad = productos.reduce((sum, item) => sum + item.cantidad, 0);
    const descuento = totalCantidad > 4 ? subtotal * 0.05 : 0; // 5% descuento por más de 4 artículos
    const total = subtotal - descuento;

    return { subtotal, descuento, total };
  }
}

module.exports = Order;