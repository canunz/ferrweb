const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestión de pagos
 */

/**
 * @swagger
 * /api/v1/payments/methods:
 *   get:
 *     summary: Métodos de pago disponibles (PÚBLICO)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Lista de métodos de pago
 */
router.get('/methods', paymentController.getPaymentMethods);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Lista todos los pagos (REQUIERE TOKEN)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pagos
 *       401:
 *         description: Token requerido
 */
router.get('/', authenticateToken, paymentController.getAllPayments);

/**
 * @swagger
 * /api/v1/payments/mercadopago/create:
 *   post:
 *     summary: Crear pago MercadoPago (REQUIERE TOKEN)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pedido_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Pago creado
 *       401:
 *         description: Token requerido
 */
router.post('/mercadopago/create', authenticateToken, paymentController.createMercadoPagoPayment);

/**
 * @swagger
 * /api/v1/payments/mercadopago/webhook:
 *   post:
 *     summary: Webhook MercadoPago (PÚBLICO)
 *     tags: [Payments]
 *     description: Endpoint para recibir notificaciones de MercadoPago
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: "payment"
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "12345678"
 *     responses:
 *       200:
 *         description: Webhook procesado correctamente
 */
router.post('/mercadopago/webhook', paymentController.mercadoPagoWebhook);

/**
 * @swagger
 * /api/v1/payments/mercadopago/webhook/test:
 *   post:
 *     summary: Test del webhook MercadoPago (PÚBLICO)
 *     tags: [Payments]
 *     description: Endpoint para probar el webhook con datos simulados
 *     responses:
 *       200:
 *         description: Test ejecutado correctamente
 */
router.post('/mercadopago/webhook/test', paymentController.testWebhook);

/**
 * @swagger
 * /api/v1/payments/order/{orderId}:
 *   get:
 *     summary: Pagos por pedido (PÚBLICO)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Lista de pagos del pedido
 */
router.get('/order/:orderId', paymentController.getPaymentsByOrder);

/**
 * @swagger
 * /api/v1/payments/verify/{paymentId}:
 *   get:
 *     summary: Verificar pago (PÚBLICO)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago
 *     responses:
 *       200:
 *         description: Estado del pago
 */
router.get('/verify/:paymentId', paymentController.verifyPayment);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Obtener pago por ID (PÚBLICO)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del pago
 */
router.get('/:id', paymentController.getPaymentById);

module.exports = router;