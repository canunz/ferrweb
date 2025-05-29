const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de productos
 */

/**
 * @swagger
 * /api/v1/products/test:
 *   get:
 *     summary: Test del servicio de productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Servicio funcionando
 */
router.get('/test', productController.testProducts);

/**
 * @swagger
 * /api/v1/products/categories:
 *   get:
 *     summary: Obtener todas las categorías (PÚBLICO)
 *     tags: [Categories]  
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/categories', productController.getCategories);

/**
 * @swagger
 * /api/v1/products/brands:
 *   get:
 *     summary: Obtener todas las marcas (PÚBLICO)
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Lista de marcas
 */
router.get('/brands', productController.getBrands);

/**
 * @swagger
 * /api/v1/products/featured:
 *   get:
 *     summary: Obtener productos destacados (PÚBLICO)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Productos destacados
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * @swagger
 * /api/v1/products/search:
 *   get:
 *     summary: Buscar productos (PÚBLICO)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
router.get('/search', productController.searchProducts);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Obtener todos los productos (PÚBLICO)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Productos por página
 *     responses:
 *       200:
 *         description: Lista de productos
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Crear nuevo producto (REQUIERE TOKEN - ADMIN)
 *     tags: [Products]
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
 *               - precio  
 *               - categoria_id
 *             properties:
 *               nombre:
 *                 type: string
 *               precio:
 *                 type: number
 *               categoria_id:
 *                 type: integer
 *               marca_id:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               codigo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               destacado:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Producto creado
 *       401:
 *         description: Token requerido
 */
router.post('/', authenticateToken, productController.createProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Obtener producto por ID (PÚBLICO)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del producto
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Actualizar producto (REQUIERE TOKEN - ADMIN)
 *     tags: [Products]
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
 *               precio:
 *                 type: number
 *               categoria_id:
 *                 type: integer
 *               marca_id:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               destacado:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       401:
 *         description: Token requerido
 */
router.put('/:id', authenticateToken, productController.updateProduct);

/**
 * @swagger
 * /api/v1/products/{id}/stock:
 *   put:
 *     summary: Actualizar stock del producto (REQUIERE TOKEN - ADMIN/BODEGUERO)
 *     tags: [Products]
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
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: integer
 *               operacion:
 *                 type: string
 *                 enum: [set, add, subtract]
 *                 description: Tipo de operación (set=establecer, add=sumar, subtract=restar)
 *     responses:
 *       200:
 *         description: Stock actualizado
 *       401:
 *         description: Token requerido
 */
router.put('/:id/stock', authenticateToken, productController.updateStock);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Eliminar producto (REQUIERE TOKEN - ADMIN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       401:
 *         description: Token requerido
 */
router.delete('/:id', authenticateToken, productController.deleteProduct);

module.exports = router;