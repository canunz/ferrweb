// src/routes/system.js - RUTAS DEL SISTEMA
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemInfo:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         version:
 *           type: string
 *         endpoints:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/system/endpoints:
 *   get:
 *     summary: Lista todos los endpoints disponibles en la API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Lista completa de endpoints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_endpoints:
 *                       type: integer
 *                     categories:
 *                       type: object
 */
router.get('/endpoints', (req, res) => {
  const endpoints = {
    authentication: [
      'GET /api/v1/auth/test',
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/login-simple',
      'POST /api/v1/auth/register',
      'GET /api/v1/auth/profile',
      'GET /api/v1/auth/verify'
    ],
    products: [
      'GET /api/v1/products',
      'GET /api/v1/products/{id}',
      'GET /api/v1/products/featured',
      'GET /api/v1/products/search',
      'GET /api/v1/products/category/{categoryId}',
      'GET /api/v1/products/brand/{brandId}'
    ],
    categories: [
      'GET /api/v1/products/categories'
    ],
    brands: [
      'GET /api/v1/products/brands'
    ],
    orders: [
      'GET /api/v1/orders',
      'GET /api/v1/orders/{id}',
      'POST /api/v1/orders',
      'PUT /api/v1/orders/{id}/status'
    ],
    payments: [
      'GET /api/v1/payments/methods',
      'GET /api/v1/payments',
      'GET /api/v1/payments/{id}',
      'POST /api/v1/payments/mercadopago/create',
      'POST /api/v1/payments/mercadopago/webhook',
      'GET /api/v1/payments/order/{orderId}',
      'GET /api/v1/payments/verify/{paymentId}'
    ],
    currency: [
      'GET /api/v1/currency/test',
      'GET /api/v1/currency/supported',
      'GET /api/v1/currency/rates',
      'GET /api/v1/currency/convert',
      'GET /api/v1/currency/history/{currency}'
    ],
    system: [
      'GET /health',
      'GET /api/v1/system/endpoints'
    ]
  };

  // Calcular total
  const totalEndpoints = Object.values(endpoints).reduce((total, group) => total + group.length, 0);

  res.json({
    success: true,
    message: 'Lista completa de endpoints FERREMAS API',
    data: {
      total_endpoints: totalEndpoints,
      version: '1.0.0',
      base_url: 'http://localhost:3000',
      documentation: '/api/v1/docs',
      categories: endpoints
    }
  });
});

/**
 * @swagger
 * /api/v1/system/stats:
 *   get:
 *     summary: Estadísticas del sistema
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Estadísticas generales
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      node_version: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;