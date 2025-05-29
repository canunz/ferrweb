// src/utils/logger.js
const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Niveles de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Colores para consola
const COLORS = {
  ERROR: '\x1b[31m', // Rojo
  WARN: '\x1b[33m',  // Amarillo
  INFO: '\x1b[36m',  // Cian
  DEBUG: '\x1b[37m', // Blanco
  RESET: '\x1b[0m'   // Reset
};

class Logger {
  constructor() {
    this.logLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;
  }

  // Formatear mensaje de log
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const formattedMessage = {
      timestamp,
      level,
      message,
      ...metadata
    };

    return JSON.stringify(formattedMessage);
  }

  // Escribir a archivo
  writeToFile(level, message) {
    const filename = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = message + '\n';

    fs.appendFile(filename, logEntry, (err) => {
      if (err) {
        console.error('Error escribiendo log:', err);
      }
    });
  }

  // Escribir a consola con colores
  writeToConsole(level, message, originalMessage) {
    if (this.logLevel >= LOG_LEVELS[level]) {
      const color = COLORS[level] || COLORS.RESET;
      const timestamp = new Date().toLocaleString('es-CL');
      console.log(`${color}[${timestamp}] ${level}: ${originalMessage}${COLORS.RESET}`);
    }
  }

  // Log de error
  error(message, metadata = {}) {
    const formattedMessage = this.formatMessage('ERROR', message, metadata);
    this.writeToFile('ERROR', formattedMessage);
    this.writeToConsole('ERROR', formattedMessage, message);
  }

  // Log de advertencia
  warn(message, metadata = {}) {
    const formattedMessage = this.formatMessage('WARN', message, metadata);
    this.writeToFile('WARN', formattedMessage);
    this.writeToConsole('WARN', formattedMessage, message);
  }

  // Log de información
  info(message, metadata = {}) {
    const formattedMessage = this.formatMessage('INFO', message, metadata);
    this.writeToFile('INFO', formattedMessage);
    this.writeToConsole('INFO', formattedMessage, message);
  }

  // Log de debug
  debug(message, metadata = {}) {
    const formattedMessage = this.formatMessage('DEBUG', message, metadata);
    this.writeToFile('DEBUG', formattedMessage);
    this.writeToConsole('DEBUG', formattedMessage, message);
  }

  // Log de request HTTP
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      user: req.user ? req.user.id : 'anonymous'
    };

    if (res.statusCode >= 400) {
      this.error(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
    } else {
      this.info(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
    }
  }

  // Log de error de base de datos
  logDatabaseError(error, query, params = []) {
    this.error('Database Error', {
      error: error.message,
      code: error.code,
      query: query.substring(0, 200), // Limitar longitud de query
      params: params.length > 0 ? params : undefined
    });
  }

  // Log de login de usuario
  logUserLogin(user, success = true, ip = '') {
    const message = success 
      ? `Usuario ${user.email} inició sesión exitosamente`
      : `Intento de login fallido para ${user.email || 'usuario desconocido'}`;

    this.info(message, {
      userId: user.id,
      email: user.email,
      ip,
      success
    });
  }

  // Log de operaciones importantes
  logBusinessOperation(operation, user, details = {}) {
    this.info(`Operación de negocio: ${operation}`, {
      operation,
      userId: user.id,
      userEmail: user.email,
      userRole: user.rol,
      details
    });
  }

  // Limpiar logs antiguos (más de 30 días)
  cleanOldLogs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    fs.readdir(logsDir, (err, files) => {
      if (err) {
        this.error('Error leyendo directorio de logs', { error: err.message });
        return;
      }

      files.forEach(file => {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const fileDate = file.replace('.log', '');
          
          if (new Date(fileDate) < thirtyDaysAgo) {
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                this.error('Error eliminando log antiguo', { 
                  file, 
                  error: unlinkErr.message 
                });
              } else {
                this.info('Log antiguo eliminado', { file });
              }
            });
          }
        }
      });
    });
  }
}

// Instancia singleton del logger
const logger = new Logger();

// Limpiar logs antiguos al inicializar (una vez al día)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logger.cleanOldLogs();
  }, 24 * 60 * 60 * 1000); // Cada 24 horas
}

module.exports = logger;