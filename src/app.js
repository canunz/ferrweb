// src/app.js - CONFIGURACIÓN SWAGGER COMPLETA
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos de seguridad
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ferremas.cl'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Middlewares para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Configuración COMPLETA de Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FERREMAS API',
      version: '1.0.0',
      description: 'API completa para FERREMAS - Distribuidora de ferretería y construcción',
      contact: {
        name: 'FERREMAS Development Team',
        email: 'dev@ferremas.cl'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de Desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticación y gestión de usuarios'
      },
      {
        name: 'Products',
        description: 'Gestión del catálogo de productos'
      },
      {
        name: 'Categories',
        description: 'Categorías de productos'
      },
      {
        name: 'Brands',
        description: 'Marcas de productos'
      },
      {
        name: 'Orders',
        description: 'Gestión de pedidos y órdenes'
      },
      {
        name: 'Payments',
        description: 'Procesamiento de pagos y transacciones'
      },
      {
        name: 'Currency',
        description: 'Conversión de divisas y tasas de cambio'
      },
      {
        name: 'System',
        description: 'Endpoints del sistema y estadísticas'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Ruta de documentación
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'FERREMAS API Documentation',
  customCss: `
    .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMEMxNS41MjMgMCAyMCA0LjQ3NyAyMCAxMFMxNS41MjMgMjAgMTAgMjBTMCAyMCAwIDEwUzQuNDc3IDAgMTAgMFoiIGZpbGw9IiMzMTc5RkYiLz48L3N2Zz4='); }
    .swagger-ui .topbar { background-color: #1976d2; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Conexión a base de datos
const { testConnection } = require('./config/database');

// Health check mejorado
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FERREMAS API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products', 
      orders: '/api/v1/orders',
      payments: '/api/v1/payments',
      currency: '/api/v1/currency'
    }
  });
});

// Endpoint raíz mejorado
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a FERREMAS API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    health: '/health',
    endpoints: {
      authentication: '/api/v1/auth',
      products: '/api/v1/products',
      orders: '/api/v1/orders', 
      payments: '/api/v1/payments',
      currency: '/api/v1/currency'
    }
  });
});

// Importar y usar rutas con manejo de errores
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/v1/auth', authRoutes);
  console.log('✅ Rutas de auth cargadas');
} catch (error) {
  console.log('❌ Error cargando rutas de auth:', error.message);
}

try {
  const productRoutes = require('./routes/products');
  app.use('/api/v1/products', productRoutes);
  console.log('✅ Rutas de productos cargadas');
} catch (error) {
  console.log('❌ Error cargando rutas de productos:', error.message);
}

try {
  const orderRoutes = require('./routes/orders');
  app.use('/api/v1/orders', orderRoutes);
  console.log('✅ Rutas de pedidos cargadas');
} catch (error) {
  console.log('❌ Error cargando rutas de pedidos:', error.message);
}

try {
  const paymentRoutes = require('./routes/payments');
  app.use('/api/v1/payments', paymentRoutes);
  console.log('✅ Rutas de pagos cargadas');
} catch (error) {
  console.log('❌ Error cargando rutas de pagos:', error.message);
}

try {
  const currencyRoutes = require('./routes/currency');
  app.use('/api/v1/currency', currencyRoutes);
  console.log('✅ Rutas de divisas cargadas');
} catch (error) {
  console.log('❌ Error cargando rutas de divisas:', error.message);
}

try {
  const systemRoutes = require('./routes/system');
  app.use('/api/v1/system', systemRoutes);
  console.log('✅ Rutas del sistema cargadas');
} catch (error) {
  console.log('❌ Error cargando rutas del sistema:', error.message);
}

// Nuevas rutas de gestión
try {
  const categoriesRoutes = require('./routes/categories');
  app.use('/api/v1/categories', categoriesRoutes);
  console.log('✅ Rutas de categorías cargadas');
} catch (error) {
  console.log('❌ Error cargando rutas de categorías:', error.message);
}

try {
  const brandsRoutes = require('./routes/brands');
  app.use('/api/v1/brands', brandsRoutes);
  console.log('✅ Rutas de marcas cargadas');
} catch (error) {
  console.log('❌ Error cargando rutas de marcas:', error.message);
}

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.path,
    method: req.method,
    suggestion: 'Revisa la documentación en /api/v1/docs para ver los endpoints disponibles'
  });
});

// ==========================================
// INICIO DEL SERVIDOR (solo si no es test)
// ==========================================

// Función para inicializar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('🚀 ========================================');
      console.log('🔧 FERREMAS API v1 iniciado exitosamente');
      console.log(`📍 Servidor: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api/v1/docs`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('🚀 ========================================');
      console.log('📋 ENDPOINTS v1:');
      console.log(`🔐 Auth: http://localhost:${PORT}/api/v1/auth`);
      console.log(`📦 Products: http://localhost:${PORT}/api/v1/products`);
      console.log(`📋 Orders: http://localhost:${PORT}/api/v1/orders`);
      console.log(`💳 Payments: http://localhost:${PORT}/api/v1/payments`);
      console.log(`💱 Currency: http://localhost:${PORT}/api/v1/currency`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Solo iniciar servidor si no estamos en modo test
if (require.main === module && process.env.NODE_ENV !== 'test') {
  startServer();
}

// Exportar la app para los tests
module.exports = app;