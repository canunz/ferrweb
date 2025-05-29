// src/routes/currency.js - RUTAS COMPLETAS DE DIVISAS
const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CurrencyConversion:
 *       type: object
 *       properties:
 *         from:
 *           type: string
 *         to:
 *           type: string
 *         amount:
 *           type: number
 *         converted_amount:
 *           type: number
 *         exchange_rate:
 *           type: number
 *         date:
 *           type: string
 *           format: date-time
 */

// ✅ RUTAS ESPECÍFICAS PRIMERO

/**
 * @swagger
 * /api/v1/currency/supported:
 *   get:
 *     summary: Obtiene monedas soportadas para conversión
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Lista de monedas soportadas
 */
router.get('/supported', currencyController.getSupportedCurrencies);

/**
 * @swagger
 * /api/v1/currency/rates:
 *   get:
 *     summary: Obtiene tasas de cambio actuales
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Tasas de cambio del día
 */
router.get('/rates', currencyController.getExchangeRates);

/**
 * @swagger
 * /api/v1/currency/convert:
 *   get:
 *     summary: Convierte entre monedas
 *     tags: [Currency]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         required: true
 *         description: Moneda origen (ej. USD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         required: true
 *         description: Moneda destino (ej. CLP)
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *         required: true
 *         description: Cantidad a convertir
 *     responses:
 *       200:
 *         description: Conversión exitosa
 */
router.get('/convert', currencyController.convertCurrency);

/**
 * @swagger
 * /api/v1/currency/history/{currency}:
 *   get:
 *     summary: Obtiene historial de una moneda específica
 *     tags: [Currency]
 *     parameters:
 *       - in: path
 *         name: currency
 *         schema:
 *           type: string
 *         required: true
 *         description: Código de moneda (ej. USD)
 *     responses:
 *       200:
 *         description: Historial de la moneda
 */
router.get('/history/:currency', currencyController.getCurrencyHistory);

// ✅ RUTA DE TEST
/**
 * @swagger
 * /api/v1/currency/test:
 *   get:
 *     summary: Test del servicio de divisas
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Servicio funcionando
 */
router.get('/test', currencyController.testCurrencyService);

module.exports = router;