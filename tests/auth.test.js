const request = require('supertest');
const app = require('../src/app');

describe('🔐 FERREMAS API - Autenticación', () => {
  let authToken = '';

  describe('GET /api/v1/auth/test', () => {
    it('Debería retornar información del servicio de auth', async () => {
      const response = await request(app)
        .get('/api/v1/auth/test');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('funcionando');
    });
  });

  describe('POST /api/v1/auth/login-simple', () => {
    it('Debería hacer login exitoso con email válido', async () => {
      const loginData = {
        email: 'admin@ferremas.cl'
      };

      const response = await request(app)
        .post('/api/v1/auth/login-simple')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);

      // Guardar token para otros tests
      authToken = response.body.data.token;
    });

    it('Debería fallar con email inválido', async () => {
      const loginData = {
        email: 'usuario_inexistente@test.com'
      };

      const response = await request(app)
        .post('/api/v1/auth/login-simple')
        .send(loginData);

      // CORREGIDO: Esperamos 401 (no autorizado) en lugar de 404
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('no encontrado');
    });

    it('Debería fallar sin email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login-simple')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('requerido');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('Debería hacer login con email y password', async () => {
      const loginData = {
        email: 'admin@ferremas.cl',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/verify', () => {
    it('Debería verificar token válido', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('válido');
    });

    it('Debería fallar sin token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de acceso requerido');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('Debería obtener perfil con token válido', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    it('Debería fallar sin token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});