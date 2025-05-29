const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Autenticación y gestión de usuarios
 */

/**
 * @swagger
 * /api/v1/auth/test:
 *   get:
 *     summary: Test del servicio de autenticación
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Servicio funcionando correctamente
 */
router.get('/test', authController.testAuth);

/**
 * @swagger
 * /api/v1/auth/login-simple:
 *   post:
 *     summary: Login simple (solo email)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 */
router.post('/login-simple', authController.loginSimple);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login normal (email + password)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario (REQUIERE TOKEN)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: Token requerido
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @swagger
 * /api/v1/auth/users:
 *   get:
 *     summary: Obtener lista de todos los usuarios (REQUIERE TOKEN)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nombre:
 *                             type: string
 *                           email:
 *                             type: string
 *                           telefono:
 *                             type: string
 *                           direccion:
 *                             type: string
 *                           rol:
 *                             type: string
 *                           fecha_registro:
 *                             type: string
 *       401:
 *         description: Token requerido
 */
router.get('/users', authenticateToken, authController.getAllUsers);

/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     summary: Verificar token (REQUIERE TOKEN)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido
 */
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;