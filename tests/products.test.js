// tests/products.test.js - PRUEBAS AUTOMATIZADAS DE PRODUCTOS
const request = require('supertest');

const baseURL = 'http://localhost:3000';

describe('📦 FERREMAS API - Productos', () => {

  // Test 1: Listar todos los productos
  describe('GET /api/v1/products', () => {
    it('Debería retornar lista de productos', async () => {
      const response = await request(baseURL).get('/api/v1/products');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);
    });
  });

  // Test 2: Obtener producto específico
  describe('GET /api/v1/products/:id', () => {
    it('Debería retornar producto específico por ID', async () => {
      const response = await request(baseURL).get('/api/v1/products/1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.nombre).toBeDefined();
      expect(response.body.data.precio).toBeDefined();
    });

    it('Debería retornar 404 para producto inexistente', async () => {
      const response = await request(baseURL).get('/api/v1/products/99999');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // Test 3: Obtener categorías
  describe('GET /api/v1/products/categories', () => {
    it('Debería retornar lista de categorías', async () => {
      const response = await request(baseURL).get('/api/v1/products/categories');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });
  });

  // Test 4: Obtener marcas
  describe('GET /api/v1/products/brands', () => {
    it('Debería retornar lista de marcas', async () => {
      const response = await request(baseURL).get('/api/v1/products/brands');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.brands).toBeDefined();
      expect(Array.isArray(response.body.data.brands)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });
  });

  // Test 5: Productos destacados
  describe('GET /api/v1/products/featured', () => {
    it('Debería retornar productos destacados', async () => {
      const response = await request(baseURL).get('/api/v1/products/featured');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.featured_products).toBeDefined();
      expect(Array.isArray(response.body.data.featured_products)).toBe(true);
    });
  });

  // Test 6: Búsqueda de productos
  describe('GET /api/v1/products/search', () => {
    it('Debería buscar productos por término', async () => {
      const response = await request(baseURL)
        .get('/api/v1/products/search')
        .query({ q: 'taladro' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(response.body.data.search_term).toBe('taladro');
    });

    it('Debería fallar sin parámetro de búsqueda', async () => {
      const response = await request(baseURL).get('/api/v1/products/search');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

});