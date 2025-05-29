// tests/setup.js - CONFIGURACIÓN GLOBAL DE PRUEBAS

// Configurar timeout para las pruebas (APIs pueden ser lentas)
jest.setTimeout(30000);

// Configuración global antes de todos los tests
beforeAll(async () => {
  console.log('🚀 Iniciando suite de pruebas FERREMAS...');
  
  // Verificar que el servidor esté disponible
  try {
    const request = require('supertest');
    const response = await request('http://localhost:3000')
      .get('/health')
      .timeout(5000);
    
    if (response.status === 200) {
      console.log('✅ Servidor FERREMAS disponible para pruebas');
    } else {
      console.log('⚠️ Servidor respondió con código:', response.status);
    }
  } catch (error) {
    console.log('⚠️ No se pudo verificar el servidor, continuando con las pruebas...');
  }
  
  // Esperar un momento para que todo se estabilice
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Limpieza después de todos los tests
afterAll(async () => {
  console.log('✅ Suite de pruebas FERREMAS completada');
  
  // Limpiar recursos o conexiones abiertas
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Forzar limpieza de handles abiertos
  if (global.gc) {
    global.gc();
  }
});

// Manejar errores no capturados durante las pruebas
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// Variables globales para las pruebas
global.testConfig = {
  // URLs base
  baseURL: 'http://localhost:3000',
  apiVersion: '/api/v1',
  
  // Timeouts
  timeout: 10000,
  shortTimeout: 5000,
  longTimeout: 30000,
  
  // Credenciales de prueba
  adminEmail: 'admin@ferremas.cl',
  adminPassword: '123456',
  testUserEmail: 'test@ferremas.cl',
  
  // IDs de prueba
  testProductId: 1,
  testOrderId: 1,
  testPaymentId: 1,
  testCategoryId: 1,
  
  // Datos de prueba para productos
  testProduct: {
    nombre: 'Producto de Prueba',
    precio: 99990,
    categoria_id: 1,
    stock: 100
  },
  
  // Datos de prueba para pedidos
  testOrder: {
    items: [
      {
        producto_id: 1,
        cantidad: 2
      }
    ],
    tipo_entrega: 'retiro_tienda',
    notas: 'Pedido de prueba automatizada'
  },
  
  // Datos de prueba para pagos
  testPayment: {
    pedido_id: 1,
    metodo_pago: 'mercadopago',
    monto: 89990.99
  },
  
  // Configuración de divisas
  currencies: {
    base: 'CLP',
    test: ['USD', 'EUR', 'BRL'],
    amounts: {
      small: 100,
      medium: 10000,
      large: 1000000
    }
  },
  
  // Headers comunes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'FERREMAS-Test-Suite/1.0'
  },
  
  // Códigos de respuesta esperados
  statusCodes: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
  },
  
  // Mensajes de prueba
  messages: {
    LOGIN_SUCCESS: 'Login exitoso',
    TOKEN_REQUIRED: 'Token de acceso requerido',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    PRODUCT_NOT_FOUND: 'Producto no encontrado',
    ORDER_CREATED: 'Pedido creado exitosamente'
  }
};

// Funciones helper globales para las pruebas
global.testHelpers = {
  // Función para obtener token de autenticación
  async getAuthToken(email = global.testConfig.adminEmail) {
    const request = require('supertest');
    const response = await request(global.testConfig.baseURL)
      .post('/api/v1/auth/login-simple')
      .send({ email });
    
    if (response.body.data && response.body.data.token) {
      return response.body.data.token;
    }
    throw new Error('No se pudo obtener token de autenticación');
  },
  
  // Función para hacer request con token
  async authenticatedRequest(method, url, data = null) {
    const request = require('supertest');
    const token = await this.getAuthToken();
    
    let req = request(global.testConfig.baseURL)[method.toLowerCase()](url)
      .set('Authorization', `Bearer ${token}`)
      .set(global.testConfig.headers);
    
    if (data) {
      req = req.send(data);
    }
    
    return req;
  },
  
  // Función para validar estructura de respuesta
  validateApiResponse(response, expectedSuccess = true) {
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(expectedSuccess);
    
    if (expectedSuccess) {
      expect(response.body).toHaveProperty('data');
    } else {
      expect(response.body).toHaveProperty('message');
    }
  },
  
  // Función para esperar un tiempo determinado
  async wait(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // Función para generar datos aleatorios
  generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Función para generar email de prueba
  generateTestEmail() {
    return `test-${this.generateRandomString(8)}@ferremas.cl`;
  }
};

// Configurar variables de entorno para pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_ferremas_2024';

// Configurar console.log para pruebas (opcional - descomenta si quieres logs más limpios)
// const originalConsoleLog = console.log;
// console.log = (...args) => {
//   if (process.env.VERBOSE_TESTS === 'true') {
//     originalConsoleLog(...args);
//   }
// };

console.log('🔧 Configuración de pruebas FERREMAS cargada correctamente');
console.log(`📍 Base URL: ${global.testConfig.baseURL}`);
console.log(`⏱️ Timeout: ${global.testConfig.timeout}ms`);
console.log(`👤 Usuario de prueba: ${global.testConfig.adminEmail}`);