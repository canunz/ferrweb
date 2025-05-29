// tests/currency.test.js - PRUEBAS AUTOMATIZADAS DE DIVISAS
const request = require('supertest');

const baseURL = 'http://localhost:3000';

describe('💱 FERREMAS API - Divisas', () => {

  // Test 1: Test del servicio
  describe('GET /api/v1/currency/test', () => {
    it('Debería confirmar que el servicio de divisas funciona', async () => {
      const response = await request(baseURL).get('/api/v1/currency/test');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('funcionando');
      expect(response.body.available_endpoints).toBeDefined();
    });
  });

  // Test 2: Monedas soportadas
  describe('GET /api/v1/currency/supported', () => {
    it('Debería retornar lista de monedas soportadas', async () => {
      const response = await request(baseURL).get('/api/v1/currency/supported');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currencies).toBeDefined();
      expect(Array.isArray(response.body.data.currencies)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.base_currency).toBe('CLP');
    });
  });

  // Test 3: Tasas de cambio
  describe('GET /api/v1/currency/rates', () => {
    it('Debería retornar tasas de cambio actuales', async () => {
      const response = await request(baseURL).get('/api/v1/currency/rates');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rates).toBeDefined();
      expect(Array.isArray(response.body.data.rates)).toBe(true);
      expect(response.body.data.base_currency).toBe('CLP');
      expect(response.body.data.total_currencies).toBeGreaterThan(0);
    });
  });

  // Test 4: Conversión de moneda
  describe('GET /api/v1/currency/convert', () => {
    it('Debería convertir USD a CLP correctamente', async () => {
      const response = await request(baseURL)
        .get('/api/v1/currency/convert')
        .query({ from: 'USD', to: 'CLP', amount: 100 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.from_currency).toBe('USD');
      expect(response.body.data.to_currency).toBe('CLP');
      expect(response.body.data.original_amount).toBe(100);
      expect(response.body.data.converted_amount).toBeGreaterThan(0);
      expect(response.body.data.exchange_rate).toBeGreaterThan(0);
    });

    it('Debería convertir CLP a USD correctamente', async () => {
      const response = await request(baseURL)
        .get('/api/v1/currency/convert')
        .query({ from: 'CLP', to: 'USD', amount: 90000 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.from_currency).toBe('CLP');
      expect(response.body.data.to_currency).toBe('USD');
      expect(response.body.data.original_amount).toBe(90000);
    });

    it('Debería fallar con parámetros faltantes', async () => {
      const response = await request(baseURL)
        .get('/api/v1/currency/convert')
        .query({ from: 'USD', to: 'CLP' }); // Sin amount
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('Debería fallar con moneda no soportada', async () => {
      const response = await request(baseURL)
        .get('/api/v1/currency/convert')
        .query({ from: 'XXX', to: 'CLP', amount: 100 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // Test 5: Historial de moneda
  describe('GET /api/v1/currency/history/:currency', () => {
    it('Debería retornar historial de USD', async () => {
      const response = await request(baseURL).get('/api/v1/currency/history/USD');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe('USD');
      expect(response.body.data.history).toBeDefined();
      expect(Array.isArray(response.body.data.history)).toBe(true);
      expect(response.body.data.history.length).toBe(7); // 7 días
    });

    it('Debería fallar con moneda inexistente', async () => {
      const response = await request(baseURL).get('/api/v1/currency/history/XXX');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

});