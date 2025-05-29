// src/controllers/paymentController.js - CONTROLADOR COMPLETO DE PAGOS
const { executeQuery } = require('../config/database');

// Obtener todos los pagos
const getAllPayments = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        pe.numero_pedido
      FROM pagos p
      LEFT JOIN pedidos pe ON p.pedido_id = pe.id
      ORDER BY p.fecha_pago DESC
      LIMIT 20
    `;

    const results = await executeQuery(query);

    res.json({
      success: true,
      data: {
        payments: results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener pago por ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        pe.numero_pedido
      FROM pagos p
      LEFT JOIN pedidos pe ON p.pedido_id = pe.id
      WHERE p.id = ?
    `;

    const results = await executeQuery(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: results[0]
    });

  } catch (error) {
    console.error('Error obteniendo pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener métodos de pago disponibles
const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 1,
        name: 'MercadoPago',
        type: 'mercadopago',
        description: 'Pago con tarjetas de crédito y débito via MercadoPago',
        enabled: true,
        icon: 'mercadopago.png',
        fees: '2.9% + $30'
      },
      {
        id: 2,
        name: 'Tarjeta de Débito',
        type: 'debito',
        description: 'Pago directo con tarjeta de débito',
        enabled: true,
        icon: 'debit.png',
        fees: 'Sin costo adicional'
      },
      {
        id: 3,
        name: 'Tarjeta de Crédito',
        type: 'credito',
        description: 'Pago con tarjeta de crédito',
        enabled: true,
        icon: 'credit.png',
        fees: '2.5%'
      },
      {
        id: 4,
        name: 'Transferencia Bancaria',
        type: 'transferencia',
        description: 'Transferencia electrónica directa',
        enabled: true,
        icon: 'bank.png',
        fees: 'Sin costo adicional'
      }
    ];

    res.json({
      success: true,
      data: {
        payment_methods: paymentMethods,
        total: paymentMethods.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear pago con MercadoPago
const createMercadoPagoPayment = async (req, res) => {
  try {
    const { pedido_id } = req.body;

    if (!pedido_id) {
      return res.status(400).json({
        success: false,
        message: 'ID del pedido es requerido'
      });
    }

    // Verificar que el pedido existe
    const orderQuery = 'SELECT * FROM pedidos WHERE id = ?';
    const orderResults = await executeQuery(orderQuery, [pedido_id]);

    if (orderResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const order = orderResults[0];

    // Simular creación de preferencia de MercadoPago
    const preference = {
      id: `MP_${Date.now()}`,
      init_point: `https://www.mercadopago.cl/checkout/v1/redirect?pref_id=MP_${Date.now()}`,
      sandbox_init_point: `https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=MP_${Date.now()}`,
      auto_return: 'approved',
      back_urls: {
        success: 'http://localhost:3000/payment/success',
        failure: 'http://localhost:3000/payment/failure',
        pending: 'http://localhost:3000/payment/pending'
      }
    };

    // Crear registro de pago en la base de datos
    const insertQuery = `
      INSERT INTO pagos (pedido_id, metodo_pago, estado, monto, moneda, referencia_externa, fecha_pago)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await executeQuery(insertQuery, [
      pedido_id,
      'mercadopago',
      'pendiente',
      order.total,
      'CLP',
      preference.id
    ]);

    res.json({
      success: true,
      message: 'Pago MercadoPago creado exitosamente',
      data: {
        payment_id: result.insertId,
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        order_id: pedido_id,
        amount: order.total
      }
    });

  } catch (error) {
    console.error('Error creando pago MercadoPago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Webhook de MercadoPago - CORREGIDO
const mercadoPagoWebhook = async (req, res) => {
  try {
    console.log('🔔 Webhook MercadoPago recibido');
    console.log('Headers:', req.headers);
    console.log('Body completo:', req.body);
    console.log('Query params:', req.query);

    // MercadoPago puede enviar datos de diferentes formas
    let eventType, eventData;

    // Opción 1: En el body (formato típico de webhook)
    if (req.body && req.body.type) {
      eventType = req.body.type;
      eventData = req.body.data;
    }
    // Opción 2: En query parameters
    else if (req.query && req.query.type) {
      eventType = req.query.type;
      eventData = req.query.data_id ? { id: req.query.data_id } : req.query.data;
    }
    // Opción 3: Formato alternativo
    else if (req.body && req.body.action) {
      eventType = req.body.action;
      eventData = req.body.data;
    }

    console.log('📝 Datos procesados:', { 
      eventType, 
      eventData,
      originalBody: req.body,
      queryParams: req.query 
    });

    // Manejar diferentes tipos de eventos
    if (eventType === 'payment' || eventType === 'payment.updated') {
      if (eventData && eventData.id) {
        console.log('💳 Procesando actualización de pago:', eventData.id);
        
        // Actualizar estado del pago en la base de datos
        const updateQuery = `
          UPDATE pagos 
          SET estado = ?, fecha_aprobacion = NOW(), notas = ?
          WHERE referencia_externa LIKE ?
        `;

        const result = await executeQuery(updateQuery, [
          'aprobado', 
          `Webhook recibido: ${JSON.stringify(eventData)}`,
          `%${eventData.id}%`
        ]);

        console.log('✅ Pago actualizado, filas afectadas:', result.affectedRows);
      } else {
        console.log('⚠️ No se encontró ID del pago en los datos del webhook');
      }
    } else {
      console.log('ℹ️ Tipo de evento no manejado:', eventType);
    }

    // Responder siempre con 200 para confirmar recepción
    res.status(200).json({
      success: true,
      message: 'Webhook procesado correctamente',
      received: {
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error procesando webhook MercadoPago:', error);
    
    // Incluso con error, responder 200 para evitar reenvíos
    res.status(200).json({
      success: false,
      message: 'Error procesando webhook',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Obtener pagos por pedido
const getPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('🔍 Buscando pagos para pedido:', orderId);

    const query = `
      SELECT * FROM pagos 
      WHERE pedido_id = ?
      ORDER BY fecha_pago DESC
    `;

    const results = await executeQuery(query, [orderId]);

    res.json({
      success: true,
      data: {
        payments: results,
        total: results.length,
        order_id: orderId
      }
    });

  } catch (error) {
    console.error('Error obteniendo pagos del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar estado de pago
const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.log('🔍 Verificando pago:', paymentId);

    const query = `
      SELECT 
        p.*,
        pe.numero_pedido,
        pe.estado as pedido_estado
      FROM pagos p
      LEFT JOIN pedidos pe ON p.pedido_id = pe.id
      WHERE p.id = ?
    `;

    const results = await executeQuery(query, [paymentId]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    const payment = results[0];

    res.json({
      success: true,
      data: {
        payment_id: payment.id,
        status: payment.estado,
        amount: payment.monto,
        currency: payment.moneda,
        payment_method: payment.metodo_pago,
        order_number: payment.numero_pedido,
        order_status: payment.pedido_estado,
        payment_date: payment.fecha_pago,
        approval_date: payment.fecha_aprobacion,
        external_reference: payment.referencia_externa,
        internal_reference: payment.referencia_interna,
        notes: payment.notas
      }
    });

  } catch (error) {
    console.error('Error verificando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Test del webhook (para pruebas manuales)
const testWebhook = async (req, res) => {
  try {
    console.log('🧪 Test del webhook');
    
    // Simular datos de MercadoPago
    const mockData = {
      type: 'payment',
      data: {
        id: 'TEST_' + Date.now()
      },
      action: 'payment.updated',
      date_created: new Date().toISOString()
    };

    // Llamar al webhook con datos simulados
    req.body = mockData;
    await mercadoPagoWebhook(req, res);

  } catch (error) {
    console.error('Error en test webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test del webhook'
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentMethods,
  createMercadoPagoPayment,
  mercadoPagoWebhook,
  getPaymentsByOrder,
  verifyPayment,
  testWebhook
};