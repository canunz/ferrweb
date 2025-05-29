const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de pedidos
 */

/**
 * @swagger
 * /api/v1/orders/test:
 *   get:
 *     summary: Test del servicio (PÚBLICO)
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Servicio funcionando
 */
router.get('/test', orderController.testOrders);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Lista pedidos (REQUIERE TOKEN)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: Token requerido
 */
router.get('/', authenticateToken, orderController.getAllOrders);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Crear pedido (REQUIERE TOKEN)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Pedido creado
 *       401:
 *         description: Token requerido
 */
router.post('/', authenticateToken, orderController.createOrder);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Obtener pedido por ID (PÚBLICO)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del pedido
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   put:
 *     summary: Actualizar estado (REQUIERE TOKEN)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       401:
 *         description: Token requerido
 */
router.put('/:id/status', authenticateToken, orderController.updateOrderStatus);

module.exports = router;