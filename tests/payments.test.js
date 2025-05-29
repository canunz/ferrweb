const request = require('supertest');
const app = require('../src/app');

describe('💳 FERREMAS API - Pagos', () => {
  let authToken = '';

  // Obtener token antes de los tests que lo necesiten
  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login-simple')
      .send({ email: 'admin@ferremas.cl' });
        
    if (loginResponse.body.data && loginResponse.body.data.token) {
      authToken = loginResponse.body.data.token;
    }
  });

  describe('GET /api/v1/payments/methods', () => {
    it('Debería retornar métodos de pago disponibles (PÚBLICO)', async () => {
      const response = await request(app)
        .get('/api/v1/payments/methods');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment_methods).toBeDefined();
      expect(Array.isArray(response.body.data.payment_methods)).toBe(true);
    });
  });

  describe('GET /api/v1/payments', () => {
    it('Debería retornar lista de pagos con token válido', async () => {
      const response = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeDefined();
    });

    it('Debería fallar sin token de autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/payments');

      // CORREGIDO: Ahora esperamos 401 porque el endpoint está protegido
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de acceso requerido');
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    it('Debería retornar pago específico (PÚBLICO)', async () => {
      const response = await request(app)
        .get('/api/v1/payments/1');

      // Este endpoint es público
      expect([200, 404]).toContain(response.status);
      expect(response.body.success).toBeDefined();
    });
  });

  describe('POST /api/v1/payments/mercadopago/create', () => {
    it('Debería crear pago MercadoPago con token válido', async () => {
      const paymentData = {
        pedido_id: 1
      };

      const response = await request(app)
        .post('/api/v1/payments/mercadopago/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      // Puede ser 200 (éxito) o 400 (pedido no existe)
      expect([200, 201, 400]).toContain(response.status);
      expect(response.body.success).toBeDefined();
    });

    it('Debería fallar sin token', async () => {
      const paymentData = {
        pedido_id: 1
      };

      const response = await request(app)
        .post('/api/v1/payments/mercadopago/create')
        .send(paymentData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de acceso requerido');
    });
  });

  describe('GET /api/v1/payments/order/:orderId', () => {
    it('Debería retornar pagos por pedido (PÚBLICO)', async () => {
      const response = await request(app)
        .get('/api/v1/payments/order/1');

      expect([200, 404]).toContain(response.status);
      expect(response.body.success).toBeDefined();
    });
  });

  describe('GET /api/v1/payments/verify/:paymentId', () => {
    it('Debería verificar estado de pago (PÚBLICO)', async () => {
      const response = await request(app)
        .get('/api/v1/payments/verify/1');

      expect([200, 404]).toContain(response.status);
      expect(response.body.success).toBeDefined();
    });
  });
});