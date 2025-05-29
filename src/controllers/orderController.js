const { executeQuery } = require('../config/database');

const testOrders = (req, res) => {
  res.json({
    success: true,
    message: "✅ Servicio de pedidos funcionando correctamente",
    timestamp: new Date().toISOString(),
    endpoints: [
      "GET /api/v1/orders/test - Test del servicio",
      "GET /api/v1/orders - Lista todos los pedidos",
      "POST /api/v1/orders - Crear nuevo pedido", 
      "GET /api/v1/orders/{id} - Obtener pedido específico",
      "PUT /api/v1/orders/{id}/status - Actualizar estado"
    ]
  });
};

const getAllOrders = async (req, res) => {
  try {
    console.log('📋 Obteniendo pedidos...');
    
    const query = `
      SELECT 
        id,
        numero_pedido,
        cliente_id,
        vendedor_id,
        sucursal_id,
        estado,
        tipo_entrega,
        subtotal,
        descuento,
        impuestos,
        total,
        moneda,
        fecha_pedido,
        fecha_aprobacion,
        fecha_entrega
      FROM pedidos
      ORDER BY fecha_pedido DESC 
      LIMIT 10
    `;

    const orders = await executeQuery(query);
    console.log('✅ Pedidos obtenidos:', orders.length);

    res.json({
      success: true,
      data: { 
        orders,
        total_found: orders.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pedidos",
      error: error.message
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const { 
      items, 
      cliente_id, 
      vendedor_id, 
      sucursal_id, 
      tipo_entrega, 
      direccion_entrega, 
      notas 
    } = req.body;

    // Validaciones básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe incluir items en el pedido"
      });
    }

    // Generar número de pedido único
    const numeroOrden = `ORD-${Date.now()}`;
    
    // Valores calculados (simplificados para prueba)
    const subtotal = 89990.99;
    const descuento = 0.00;
    const impuestos = 17098.29; // 19% IVA sobre neto
    const total = subtotal - descuento + impuestos;
    
    // Valores por defecto
    const clienteId = cliente_id || 1;
    const vendedorId = vendedor_id || 1;
    const sucursalId = sucursal_id || 1;
    const tipoEntrega = tipo_entrega || 'retiro_tienda';
    const moneda = 'CLP';

    console.log('📝 Creando pedido:', {
      numero: numeroOrden,
      cliente: clienteId,
      vendedor: vendedorId,
      sucursal: sucursalId,
      tipo: tipoEntrega,
      total: total
    });

    const insertQuery = `
      INSERT INTO pedidos (
        numero_pedido, 
        cliente_id, 
        vendedor_id, 
        sucursal_id, 
        estado, 
        tipo_entrega, 
        direccion_entrega, 
        subtotal, 
        descuento, 
        impuestos, 
        total, 
        moneda, 
        notas, 
        fecha_pedido
      ) VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await executeQuery(insertQuery, [
      numeroOrden,
      clienteId,
      vendedorId,
      sucursalId,
      tipoEntrega,
      direccion_entrega || null,
      subtotal,
      descuento,
      impuestos,
      total,
      moneda,
      notas || null
    ]);

    console.log('✅ Pedido creado con ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: "Pedido creado exitosamente",
      data: {
        pedido_id: result.insertId,
        numero_pedido: numeroOrden,
        cliente_id: clienteId,
        vendedor_id: vendedorId,
        sucursal_id: sucursalId,
        estado: 'pendiente',
        tipo_entrega: tipoEntrega,
        subtotal: subtotal,
        descuento: descuento,
        impuestos: impuestos,
        total: total,
        moneda: moneda,
        fecha_pedido: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    res.status(500).json({
      success: false,
      message: "Error al crear pedido",
      error: error.message
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando pedido ID:', id);

    const query = `
      SELECT 
        id,
        numero_pedido,
        cliente_id,
        vendedor_id,
        sucursal_id,
        estado,
        tipo_entrega,
        direccion_entrega,
        subtotal,
        descuento,
        impuestos,
        total,
        moneda,
        notas,
        fecha_pedido,
        fecha_aprobacion,
        fecha_entrega
      FROM pedidos 
      WHERE id = ?
    `;

    const result = await executeQuery(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    console.log('✅ Pedido encontrado');

    res.json({
      success: true,
      data: { order: result[0] }
    });

  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pedido",
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    console.log('🔄 Actualizando pedido', id, 'a estado:', estado);

    const validStates = ['pendiente', 'aprobado', 'preparando', 'listo', 'entregado', 'cancelado'];
    
    if (!estado || !validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Estados válidos: ${validStates.join(', ')}`
      });
    }

    let updateQuery = `UPDATE pedidos SET estado = ?`;
    let params = [estado];

    // Agregar fecha específica según el estado
    if (estado === 'aprobado') {
      updateQuery += `, fecha_aprobacion = NOW()`;
    } else if (estado === 'entregado') {
      updateQuery += `, fecha_entrega = NOW()`;
    }

    // Agregar notas si se proporcionan
    if (notas) {
      updateQuery += `, notas = ?`;
      params.push(notas);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    const result = await executeQuery(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    console.log('✅ Estado actualizado exitosamente');

    res.json({
      success: true,
      message: `Estado del pedido actualizado a: ${estado}`,
      data: {
        pedido_id: parseInt(id),
        nuevo_estado: estado,
        fecha_actualizacion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado del pedido",
      error: error.message
    });
  }
};

module.exports = {
  testOrders,
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrderStatus
};