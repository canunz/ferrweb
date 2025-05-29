const { executeQuery } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'ferremas_secret_key_2024';

// Test del servicio
const testAuth = (req, res) => {
  res.json({
    success: true,
    message: "✅ Servicio de autenticación funcionando correctamente",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /api/v1/auth/login-simple - Login sin password",
      "POST /api/v1/auth/login - Login con password",
      "POST /api/v1/auth/register - Registrar usuario",
      "GET /api/v1/auth/profile - Perfil (requiere token)",
      "GET /api/v1/auth/verify - Verificar token",
      "GET /api/v1/auth/users - Listar todos los usuarios (requiere token)"
    ]
  });
};

// Login simple (solo email)
const loginSimple = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email es requerido"
      });
    }

    console.log('🔐 Login simple para:', email);

    // Buscar usuario en la base de datos
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const users = await executeQuery(query, [email]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const user = users[0];

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol || 'cliente'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Token generado para:', email);

    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol || 'cliente'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en login simple:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Login normal (email + password)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y password son requeridos"
      });
    }

    console.log('🔐 Login normal para:', email);

    // Buscar usuario
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const users = await executeQuery(query, [email]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    const user = users[0];

    // Verificar password (si existe hash)
    if (user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas"
        });
      }
    }

    // Generar token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol || 'cliente'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login exitoso para:', email);

    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol || 'cliente'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Registrar nuevo usuario
const register = async (req, res) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email y password son requeridos"
      });
    }

    console.log('📝 Registrando usuario:', email);

    // Verificar si el usuario ya existe
    const checkQuery = 'SELECT * FROM usuarios WHERE email = ?';
    const existingUsers = await executeQuery(checkQuery, [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El usuario ya existe"
      });
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const insertQuery = `
      INSERT INTO usuarios (nombre, email, password, telefono, direccion, rol, fecha_registro)
      VALUES (?, ?, ?, ?, ?, 'cliente', NOW())
    `;

    const result = await executeQuery(insertQuery, [
      nombre,
      email,
      hashedPassword,
      telefono || null,
      direccion || null
    ]);

    console.log('✅ Usuario registrado con ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        user_id: result.insertId,
        email: email,
        nombre: nombre
      }
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Obtener perfil del usuario (requiere token)
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('👤 Obteniendo perfil para usuario ID:', userId);

    const query = 'SELECT id, nombre, email, telefono, direccion, rol, fecha_registro FROM usuarios WHERE id = ?';
    const users = await executeQuery(query, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        user: user
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Obtener todos los usuarios (requiere token)
const getAllUsers = async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de todos los usuarios');

    // Query para obtener todos los usuarios (sin incluir el password por seguridad)
    const query = `
      SELECT 
        id, 
        nombre, 
        email, 
        telefono, 
        direccion, 
        rol, 
        fecha_registro 
      FROM usuarios 
      ORDER BY fecha_registro DESC
    `;

    const users = await executeQuery(query);

    console.log(`✅ Se encontraron ${users.length} usuarios`);

    res.json({
      success: true,
      message: `Se encontraron ${users.length} usuarios`,
      data: {
        total: users.length,
        users: users
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Verificar token
const verifyToken = (req, res) => {
  try {
    // Si llegamos aquí, el token es válido (pasó por el middleware)
    res.json({
      success: true,
      message: "Token válido",
      data: {
        user: req.user,
        expires_in: "24h"
      }
    });

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

module.exports = {
  testAuth,
  loginSimple,
  login,
  register,
  getProfile,
  getAllUsers,
  verifyToken
};