// tests/env.setup.js - Variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';  // Puerto diferente para evitar conflictos
process.env.JWT_SECRET = 'test_jwt_secret_ferremas_2024';

// Configuración de base de datos (misma que desarrollo)
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'emma2004';
process.env.DB_NAME = 'ferreinve';

// Suprimir algunos logs para output más limpio
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Solo mostrar logs importantes durante tests
  const message = args.join(' ');
  if (message.includes('✅') || message.includes('❌') || message.includes('🚀')) {
    originalConsoleLog(...args);
  }
};