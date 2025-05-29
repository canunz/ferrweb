// src/models/Payment.js
const { executeQuery } = require('../config/database');

class Payment {
  constructor(paymentData) {
    this.id = paymentData.id;
    this.pedido_id = paymentData.pedido_id;
    this.metodo_pago = paymentData.metodo_pago;
    this.estado = paymentData.estado;
    this.monto = paymentData.monto;
    this.moneda = paymentData.moneda;
    this.referencia_externa = paymentData.referencia_externa;
    this.fecha_pago = paymentData.fecha_pago;
  }

  // Crear nuevo pago
  static async create(paymentData) {
    const {
      pedido_id,
      metodo_pago,
      estado = 'pendiente',
      monto,
      moneda = 'CLP',
      referencia_externa
    } = paymentData;

    const query = `
      INSERT INTO pagos (pedido_id, metodo_pago, estado, monto, moneda, referencia_externa)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      pedido_id, metodo_pago, estado, monto, moneda, referencia_externa || null
    ]);

    return result.insertId;
  }

  // Buscar pago por ID
  static async findById(id) {
    const query = `
      SELECT p.*, pe.numero_pedido, pe.total as pedido_total,
             u.nombre as cliente_nombre, u.email as cliente_email
      FROM pagos p
      INNER JOIN pedidos pe ON p.pedido_id = pe.id
      INNER JOIN usuarios u ON pe.cliente_id = u.id
      WHERE p.id = ?
    `;

    const payments = await executeQuery(query, [id]);

    if (payments.length === 0) return null;

    const payment = new Payment(payments[0]);
    payment.numero_pedido = payments[0].numero_pedido;
    payment.pedido_total = payments[0].pedido_total;
    payment.cliente_nombre = payments[0].cliente_nombre;
    payment.cliente_email = payments[0].cliente_email;

    return payment;
  }

  // Buscar pagos por pedido
  static async findByOrder(pedido_id) {
    const query = 'SELECT * FROM pagos WHERE pedido_id = ? ORDER BY fecha_pago DESC';
    const payments = await executeQuery(query, [pedido_id]);

    return payments.map(paymentData => new Payment(paymentData));
  }

  // Buscar pago por referencia externa
  static async findByExternalReference(referencia_externa) {
    const query = 'SELECT * FROM pagos WHERE referencia_externa = ?';
    const payments = await executeQuery(query, [referencia_externa]);

    if (payments.length === 0) return null;

    return new Payment(payments[0]);
  }

  // Obtener todos los pagos con filtros
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, pe.numero_pedido, pe.total as pedido_total,
             u.nombre as cliente_nombre, u.email as cliente_email
      FROM pagos p
      INNER JOIN pedidos pe ON p.pedido_id = pe.id
      INNER JOIN usuarios u ON pe.cliente_id = u.id
      WHERE 1 = 1
    `;
    const params = [];

    if (filters.pedido_id) {
      query += ' AND p.pedido_id = ?';
      params.push(filters.pedido_id);
    }

    if (filters.estado) {
      query += ' AND p.estado = ?';
      params.push(filters.estado);
    }

    if (filters.metodo_pago) {
      query += ' AND p.metodo_pago = ?';
      params.push(filters.metodo_pago);
    }

    if (filters.cliente_id) {
      query += ' AND pe.cliente_id = ?';
      params.push(filters.cliente_id);
    }

    if (filters.fecha_desde) {
      query += ' AND p.fecha_pago >= ?';
      params.push(filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      query += ' AND p.fecha_pago <= ?';
      params.push(filters.fecha_hasta);
    }

    query += ' ORDER BY p.fecha_pago DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    const payments = await executeQuery(query, params);
    return payments.map(paymentData => {
      const payment = new Payment(paymentData);
      payment.numero_pedido = paymentData.numero_pedido;
      payment.pedido_total = paymentData.pedido_total;
      payment.cliente_nombre = paymentData.cliente_nombre;
      payment.cliente_email = paymentData.cliente_email;
      return payment;
    });
  }

  // Actualizar estado del pago
  async updateStatus(estado, referencia_externa = null) {
    let query = 'UPDATE pagos SET estado = ?';
    const params = [estado];

    if (referencia_externa) {
      query += ', referencia_externa = ?';
      params.push(referencia_externa);
    }

    query += ' WHERE id = ?';
    params.push(this.id);

    await executeQuery(query, params);

    this.estado = estado;
    if (referencia_externa) {
      this.referencia_externa = referencia_externa;
    }
  }

  // Verificar si ya existe un pago aprobado para el pedido
  static async hasApprovedPayment(pedido_id) {
    const query = 'SELECT id FROM pagos WHERE pedido_id = ? AND estado = "aprobado"';
    const result = await executeQuery(query, [pedido_id]);
    return result.length > 0;
  }

  // Obtener último pago de un pedido
  static async getLatestByOrder(pedido_id) {
    const query = 'SELECT * FROM pagos WHERE pedido_id = ? ORDER BY fecha_pago DESC LIMIT 1';
    const payments = await executeQuery(query, [pedido_id]);

    if (payments.length === 0) return null;

    return new Payment(payments[0]);
  }

  // Obtener estadísticas de pagos
  static async getStats(filters = {}) {
    let query = `
      SELECT 
        metodo_pago,
        estado,
        COUNT(*) as total_transacciones,
        SUM(monto) as monto_total,
        AVG(monto) as monto_promedio
      FROM pagos p
      INNER JOIN pedidos pe ON p.pedido_id = pe.id
      WHERE 1 = 1
    `;
    const params = [];

    if (filters.fecha_desde) {
      query += ' AND p.fecha_pago >= ?';
      params.push(filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      query += ' AND p.fecha_pago <= ?';
      params.push(filters.fecha_hasta);
    }

    if (filters.sucursal_id) {
      query += ' AND pe.sucursal_id = ?';
      params.push(filters.sucursal_id);
    }

    query += ' GROUP BY metodo_pago, estado';

    return await executeQuery(query, params);
  }

  // Obtener pagos pendientes de confirmación
  static async getPendingConfirmation(metodo_pago = null) {
    let query = `
      SELECT p.*, pe.numero_pedido, u.nombre as cliente_nombre
      FROM pagos p
      INNER JOIN pedidos pe ON p.pedido_id = pe.id
      INNER JOIN usuarios u ON pe.cliente_id = u.id
      WHERE p.estado = 'pendiente'
    `;
    const params = [];

    if (metodo_pago) {
      query += ' AND p.metodo_pago = ?';
      params.push(metodo_pago);
    }

    query += ' ORDER BY p.fecha_pago ASC';

    const payments = await executeQuery(query, params);
    return payments.map(paymentData => {
      const payment = new Payment(paymentData);
      payment.numero_pedido = paymentData.numero_pedido;
      payment.cliente_nombre = paymentData.cliente_nombre;
      return payment;
    });
  }

  // Obtener resumen diario de pagos
  static async getDailySummary(fecha = null) {
    const targetDate = fecha || new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        metodo_pago,
        estado,
        COUNT(*) as total_transacciones,
        SUM(monto) as monto_total
      FROM pagos 
      WHERE DATE(fecha_pago) = ?
      GROUP BY metodo_pago, estado
      ORDER BY metodo_pago, estado
    `;

    return await executeQuery(query, [targetDate]);
  }

  // Obtener pagos por rango de fechas
  static async getByDateRange(fecha_inicio, fecha_fin, filters = {}) {
    let query = `
      SELECT p.*, pe.numero_pedido, u.nombre as cliente_nombre, s.nombre as sucursal_nombre
      FROM pagos p
      INNER JOIN pedidos pe ON p.pedido_id = pe.id
      INNER JOIN usuarios u ON pe.cliente_id = u.id
      INNER JOIN sucursales s ON pe.sucursal_id = s.id
      WHERE p.fecha_pago BETWEEN ? AND ?
    `;
    const params = [fecha_inicio, fecha_fin];

    if (filters.estado) {
      query += ' AND p.estado = ?';
      params.push(filters.estado);
    }

    if (filters.metodo_pago) {
      query += ' AND p.metodo_pago = ?';
      params.push(filters.metodo_pago);
    }

    if (filters.sucursal_id) {
      query += ' AND pe.sucursal_id = ?';
      params.push(filters.sucursal_id);
    }

    query += ' ORDER BY p.fecha_pago DESC';

    const payments = await executeQuery(query, params);
    return payments.map(paymentData => {
      const payment = new Payment(paymentData);
      payment.numero_pedido = paymentData.numero_pedido;
      payment.cliente_nombre = paymentData.cliente_nombre;
      payment.sucursal_nombre = paymentData.sucursal_nombre;
      return payment;
    });
  }

  // Contar pagos por estado
  static async countByStatus() {
    const query = `
      SELECT estado, COUNT(*) as total
      FROM pagos
      GROUP BY estado
    `;

    return await executeQuery(query);
  }

  // Verificar si el pago pertenece al cliente
  async belongsToClient(cliente_id) {
    const query = `
      SELECT pe.cliente_id
      FROM pagos p
      INNER JOIN pedidos pe ON p.pedido_id = pe.id
      WHERE p.id = ?
    `;

    const result = await executeQuery(query, [this.id]);
    return result.length > 0 && result[0].cliente_id === cliente_id;
  }

  // Obtener monto total de pagos aprobados por período
  static async getTotalApprovedByPeriod(fecha_inicio, fecha_fin) {
    const query = `
      SELECT 
        SUM(monto) as total_aprobado,
        COUNT(*) as total_transacciones,
        AVG(monto) as monto_promedio
      FROM pagos
      WHERE estado = 'aprobado' AND fecha_pago BETWEEN ? AND ?
    `;

    const result = await executeQuery(query, [fecha_inicio, fecha_fin]);
    return result[0];
  }
}

module.exports = Payment;