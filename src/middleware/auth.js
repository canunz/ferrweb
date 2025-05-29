// ==========================================
// ARCHIVO: src/middleware/auth.js
// ==========================================

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    console.log('🔍 Verificando autenticación...');
    
    // Obtener el header de autorización
    const authHeader = req.headers['authorization'];
    console.log('📋 Auth header:', authHeader ? 'Presente' : 'Ausente');
    
    // Verificar que existe el header
    if (!authHeader) {
      console.log('❌ No se proporcionó header de autorización');
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
        error: "No se proporcionó header de autorización"
      });
    }
    
    // Extraer el token del header (formato: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ Token no encontrado en el header');
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
        error: "Formato de token inválido. Use: Bearer <token>"
      });
    }
    
    console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
    
    // Verificar el token
    const JWT_SECRET = process.env.JWT_SECRET || 'ferremas_secret_key_2024';
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('❌ Token inválido:', err.message);
        return res.status(403).json({
          success: false,
          message: "Token inválido o expirado",
          error: err.message
        });
      }
      
      console.log('✅ Token válido para usuario:', decoded.email);
      
      // Agregar información del usuario al request
      req.user = decoded;
      next();
    });
    
  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    res.status(500).json({
      success: false,
      message: "Error interno de autenticación",
      error: error.message
    });
  }
};

// Middleware opcional - para endpoints que pueden funcionar con o sin token
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    // No hay token, continuar sin usuario
    req.user = null;
    return next();
  }
  
  // Hay token, intentar verificarlo
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  const JWT_SECRET = process.env.JWT_SECRET || 'ferremas_secret_key_2024';
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = decoded;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth
};