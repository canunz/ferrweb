const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Gestión de categorías de productos
 */

/**
 * @swagger
 * /api/v1/categories/test:
 *   get:
 *     summary: Test del servicio de categorías
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Servicio funcionando correctamente
 */
router.get('/test', categoriesController.testCategories);

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Lista todas las categorías
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de categorías
 *   post:
 *     summary: Crear nueva categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la categoría
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la categoría
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       409:
 *         description: Ya existe una categoría con ese nombre
 */
router.get('/', categoriesController.getAllCategories);
router.post('/', authenticateToken, categoriesController.createCategory);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Obtener categoría específica
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Datos de la categoría
 *       404:
 *         description: Categoría no encontrada
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       404:
 *         description: Categoría no encontrada
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Forzar eliminación aunque tenga productos
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       409:
 *         description: Categoría tiene productos asociados
 */
router.get('/:id', categoriesController.getCategoryById);
router.put('/:id', authenticateToken, categoriesController.updateCategory);
router.delete('/:id', authenticateToken, categoriesController.deleteCategory);

/**
 * @swagger
 * /api/v1/categories/{id}/products:
 *   get:
 *     summary: Obtener productos de una categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Productos de la categoría
 */
router.get('/:id/products', categoriesController.getCategoryProducts);

module.exports = router;