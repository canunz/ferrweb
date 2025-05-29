const express = require('express');
const router = express.Router();
const brandsController = require('../controllers/brandsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Gestión completa de marcas de productos
 */

/**
 * @swagger
 * /api/v1/brands/test:
 *   get:
 *     summary: Test del servicio de marcas
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Servicio funcionando correctamente
 */
router.get('/test', brandsController.testBrands);

/**
 * @swagger
 * /api/v1/brands/featured:
 *   get:
 *     summary: Obtener marcas destacadas
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de marcas destacadas
 *     responses:
 *       200:
 *         description: Lista de marcas destacadas
 */
router.get('/featured', brandsController.getFeaturedBrands);

/**
 * @swagger
 * /api/v1/brands/search:
 *   get:
 *     summary: Buscar marcas
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *       400:
 *         description: Parámetro de búsqueda requerido
 */
router.get('/search', brandsController.searchBrands);

/**
 * @swagger
 * /api/v1/brands/stats:
 *   get:
 *     summary: Estadísticas de marcas
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas completas de marcas
 *       401:
 *         description: No autorizado
 */
router.get('/stats', authenticateToken, brandsController.getBrandsStats);

/**
 * @swagger
 * /api/v1/brands:
 *   get:
 *     summary: Lista todas las marcas
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Marcas por página
 *       - in: query
 *         name: activo
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [nombre, fecha_creacion, total_productos]
 *           default: nombre
 *         description: Campo para ordenar
 *     responses:
 *       200:
 *         description: Lista de marcas con estadísticas
 *   post:
 *     summary: Crear nueva marca
 *     tags: [Brands]
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
 *                 description: Nombre de la marca
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la marca
 *               activo:
 *                 type: boolean
 *                 default: true
 *                 description: Estado de la marca
 *     responses:
 *       201:
 *         description: Marca creada exitosamente
 *       409:
 *         description: Ya existe una marca con ese nombre
 */
router.get('/', brandsController.getAllBrands);
router.post('/', authenticateToken, brandsController.createBrand);

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   get:
 *     summary: Obtener marca específica con estadísticas
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la marca
 *     responses:
 *       200:
 *         description: Datos de la marca con estadísticas detalladas
 *       404:
 *         description: Marca no encontrada
 *   put:
 *     summary: Actualizar marca
 *     tags: [Brands]
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
 *         description: Marca actualizada
 *       404:
 *         description: Marca no encontrada
 *       409:
 *         description: Nombre duplicado
 *   delete:
 *     summary: Eliminar marca
 *     tags: [Brands]
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
 *         description: Marca eliminada
 *       409:
 *         description: Marca tiene productos asociados
 */
router.get('/:id', brandsController.getBrandById);
router.put('/:id', authenticateToken, brandsController.updateBrand);
router.delete('/:id', authenticateToken, brandsController.deleteBrand);

/**
 * @swagger
 * /api/v1/brands/{id}/products:
 *   get:
 *     summary: Obtener productos de una marca con filtros
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la marca
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Productos por página
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: integer
 *         description: Filtrar por categoría
 *       - in: query
 *         name: precio_min
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: precio_max
 *         schema:
 *           type: number
 *         description: Precio máximo
 *     responses:
 *       200:
 *         description: Productos de la marca con filtros aplicados
 *       404:
 *         description: Marca no encontrada
 */
router.get('/:id/products', brandsController.getBrandProducts);

module.exports = router;