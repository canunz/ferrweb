// src/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error('Error capturado:', err);
  
    // Error de validación de MySQL
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un registro con estos datos',
        error: 'Entrada duplicada'
      });
    }
  
    // Error de clave foránea
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Referencia inválida en los datos proporcionados',
        error: 'Clave foránea inválida'
      });
    }
  
    // Error de conexión a base de datos
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR') {
      return res.status(503).json({
        success: false,
        message: 'Error de conexión a la base de datos',
        error: 'Servicio no disponible'
      });
    }
  
    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso inválido',
        error: 'Token malformado'
      });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso expirado',
        error: 'Token expirado'
      });
    }
  
    // Error de validación de esquema
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: err.message
      });
    }
  
    // Error de sintaxis JSON
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        success: false,
        message: 'Formato JSON inválido',
        error: 'Error de sintaxis'
      });
    }
  
    // Error por payload muy grande
    if (err.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        message: 'Payload demasiado grande',
        error: 'Límite de tamaño excedido'
      });
    }
  
    // Error personalizado con status
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message || 'Error del servidor',
        error: err.error || 'Error interno'
      });
    }
  
    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
  };
  
  module.exports = errorHandler;