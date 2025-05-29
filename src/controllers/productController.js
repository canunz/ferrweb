const { executeQuery } = require('../config/database');

const productController = {
  // Test del servicio
  testProducts: async (req, res) => {
    try {
      res.json({
        success: true,
        message: "✅ Servicio de productos funcionando correctamente",
        timestamp: new Date().toISOString(),
        endpoints: [
          "GET /products - Lista todos los productos",
          "POST /products - Crear nuevo producto (ADMIN)",
          "GET /products/{id} - Producto específico",
          "PUT /products/{id} - Actualizar producto (ADMIN)",
          "DELETE /products/{id} - Eliminar producto (ADMIN)",
          "PUT /products/{id}/stock - Actualizar stock (ADMIN)",
          "GET /products/categories - Todas las categorías",
          "GET /products/brands - Todas las marcas",
          "GET /products/featured - Productos destacados",
          "GET /products/search - Buscar productos"
        ]
      });
    } catch (error) {
      console.error('Error en test de productos:', error);
      res.status(500).json({
        success: false,
        message: "Error en el servicio de productos",
        error: error.message
      });
    }
  },

  // Obtener todos los productos
  getProducts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          p.id,
          p.codigo,
          p.nombre,
          p.precio,
          p.stock,
          p.destacado,
          c.nombre as categoria_nombre,
          m.nombre as marca_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN marcas m ON p.marca_id = m.id
        ORDER BY p.destacado DESC, p.fecha_creacion DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const products = await executeQuery(query);

      // Contar total
      const countQuery = 'SELECT COUNT(*) as total FROM productos';
      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(total / limit),
            total_products: total,
            products_per_page: limit
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo productos:', error);
      res.status(500).json({
        success: false,
        message: "Error al obtener productos",
        error: error.message
      });
    }
  },

  // Crear nuevo producto (ADMIN ONLY)
  createProduct: async (req, res) => {
    try {
      const { nombre, precio, categoria_id, marca_id, stock, codigo, descripcion, destacado } = req.body;

      // Validaciones básicas
      if (!nombre || !precio || !categoria_id) {
        return res.status(400).json({
          success: false,
          message: "Nombre, precio y categoría son requeridos"
        });
      }

      console.log('📦 Creando producto:', nombre);

      // Generar código automático si no se proporciona
      const productCode = codigo || `FER-${Date.now()}`;

      // Verificar que no exista el código
      const checkCodeQuery = 'SELECT * FROM productos WHERE codigo = ?';
      const existingProducts = await executeQuery(checkCodeQuery, [productCode]);

      if (existingProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un producto con ese código"
        });
      }

      // Verificar que la categoría existe
      const categoryQuery = 'SELECT * FROM categorias WHERE id = ?';
      const categories = await executeQuery(categoryQuery, [categoria_id]);

      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: "La categoría especificada no existe"
        });
      }

      // Verificar marca si se proporciona
      if (marca_id) {
        const brandQuery = 'SELECT * FROM marcas WHERE id = ?';
        const brands = await executeQuery(brandQuery, [marca_id]);

        if (brands.length === 0) {
          return res.status(400).json({
            success: false,
            message: "La marca especificada no existe"
          });
        }
      }

      // Insertar producto
      const insertQuery = `
        INSERT INTO productos (
          codigo, nombre, precio, categoria_id, marca_id, stock, 
          descripcion, destacado, fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await executeQuery(insertQuery, [
        productCode,
        nombre,
        parseFloat(precio),
        categoria_id,
        marca_id || null,
        parseInt(stock) || 0,
        descripcion || null,
        destacado ? 1 : 0
      ]);

      console.log('✅ Producto creado con ID:', result.insertId);

      // Obtener el producto creado con información completa
      const getProductQuery = `
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          m.nombre as marca_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN marcas m ON p.marca_id = m.id
        WHERE p.id = ?
      `;

      const newProduct = await executeQuery(getProductQuery, [result.insertId]);

      res.status(201).json({
        success: true,
        message: "Producto creado exitosamente",
        data: {
          product: newProduct[0]
        }
      });

    } catch (error) {
      console.error('Error creando producto:', error);
      res.status(500).json({
        success: false,
        message: "Error al crear el producto",
        error: error.message
      });
    }
  },

  // Actualizar producto (ADMIN ONLY)
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, precio, categoria_id, marca_id, stock, descripcion, destacado } = req.body;

      console.log('📝 Actualizando producto ID:', id);

      // Verificar que el producto existe
      const checkQuery = 'SELECT * FROM productos WHERE id = ?';
      const existingProducts = await executeQuery(checkQuery, [id]);

      if (existingProducts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado"
        });
      }

      // Construir query dinámico
      const updates = [];
      const values = [];

      if (nombre) {
        updates.push('nombre = ?');
        values.push(nombre);
      }
      if (precio) {
        updates.push('precio = ?');
        values.push(parseFloat(precio));
      }
      if (categoria_id) {
        updates.push('categoria_id = ?');
        values.push(categoria_id);
      }
      if (marca_id) {
        updates.push('marca_id = ?');
        values.push(marca_id);
      }
      if (stock !== undefined) {
        updates.push('stock = ?');
        values.push(parseInt(stock));
      }
      if (descripcion) {
        updates.push('descripcion = ?');
        values.push(descripcion);
      }
      if (destacado !== undefined) {
        updates.push('destacado = ?');
        values.push(destacado ? 1 : 0);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No se proporcionaron campos para actualizar"
        });
      }

      updates.push('fecha_actualizacion = NOW()');
      values.push(id);

      const updateQuery = `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(updateQuery, values);

      // Obtener producto actualizado
      const getUpdatedQuery = `
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          m.nombre as marca_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN marcas m ON p.marca_id = m.id
        WHERE p.id = ?
      `;

      const updatedProduct = await executeQuery(getUpdatedQuery, [id]);

      console.log('✅ Producto actualizado exitosamente');

      res.json({
        success: true,
        message: "Producto actualizado exitosamente",
        data: {
          product: updatedProduct[0]
        }
      });

    } catch (error) {
      console.error('Error actualizando producto:', error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el producto",
        error: error.message
      });
    }
  },

  // Actualizar solo el stock (ADMIN/BODEGUERO)
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { stock, operacion } = req.body;

      if (stock === undefined) {
        return res.status(400).json({
          success: false,
          message: "Stock es requerido"
        });
      }

      console.log('📊 Actualizando stock del producto ID:', id);

      // Obtener stock actual
      const getCurrentStockQuery = 'SELECT stock, nombre FROM productos WHERE id = ?';
      const currentProduct = await executeQuery(getCurrentStockQuery, [id]);

      if (currentProduct.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado"
        });
      }

      const currentStock = currentProduct[0].stock;
      let newStock;

      // Determinar nuevo stock según operación
      switch (operacion) {
        case 'set':
          newStock = parseInt(stock);
          break;
        case 'add':
          newStock = currentStock + parseInt(stock);
          break;
        case 'subtract':
          newStock = currentStock - parseInt(stock);
          if (newStock < 0) {
            return res.status(400).json({
              success: false,
              message: "Stock no puede ser negativo"
            });
          }
          break;
        default:
          newStock = parseInt(stock);
      }

      // Actualizar stock
      const updateQuery = 'UPDATE productos SET stock = ?, fecha_actualizacion = NOW() WHERE id = ?';
      await executeQuery(updateQuery, [newStock, id]);

      console.log(`✅ Stock actualizado: ${currentStock} → ${newStock}`);

      res.json({
        success: true,
        message: "Stock actualizado exitosamente",
        data: {
          product_id: parseInt(id),
          product_name: currentProduct[0].nombre,
          previous_stock: currentStock,
          new_stock: newStock,
          operation: operacion || 'set'
        }
      });

    } catch (error) {
      console.error('Error actualizando stock:', error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el stock",
        error: error.message
      });
    }
  },

  // Eliminar producto (ADMIN ONLY)
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🗑️ Eliminando producto ID:', id);

      // Verificar que el producto existe
      const checkQuery = 'SELECT nombre FROM productos WHERE id = ?';
      const existingProducts = await executeQuery(checkQuery, [id]);

      if (existingProducts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado"
        });
      }

      // Eliminar producto (soft delete sería mejor)
      const deleteQuery = 'DELETE FROM productos WHERE id = ?';
      await executeQuery(deleteQuery, [id]);

      console.log('✅ Producto eliminado:', existingProducts[0].nombre);

      res.json({
        success: true,
        message: "Producto eliminado exitosamente",
        data: {
          deleted_product: existingProducts[0].nombre
        }
      });

    } catch (error) {
      console.error('Error eliminando producto:', error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar el producto",
        error: error.message
      });
    }
  },

  // Obtener producto por ID
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          m.nombre as marca_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN marcas m ON p.marca_id = m.id
        WHERE p.id = ?
      `;

      const products = await executeQuery(query, [id]);

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado"
        });
      }

      res.json({
        success: true,
        data: {
          product: products[0]
        }
      });

    } catch (error) {
      console.error('Error obteniendo producto:', error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el producto",
        error: error.message
      });
    }
  },

  // Obtener categorías
  getCategories: async (req, res) => {
    try {
      const query = 'SELECT * FROM categorias ORDER BY nombre';
      const categories = await executeQuery(query);

      res.json({
        success: true,
        data: {
          categories,
          total: categories.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      res.status(500).json({
        success: false,
        message: "Error al obtener categorías",
        error: error.message
      });
    }
  },

  // Obtener marcas
  getBrands: async (req, res) => {
    try {
      const query = 'SELECT * FROM marcas ORDER BY nombre';
      const brands = await executeQuery(query);

      res.json({
        success: true,
        data: {
          brands,
          total: brands.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo marcas:', error);
      res.status(500).json({
        success: false,
        message: "Error al obtener marcas",
        error: error.message
      });
    }
  },

  // Obtener productos destacados
  getFeaturedProducts: async (req, res) => {
    try {
      const query = `
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          m.nombre as marca_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN marcas m ON p.marca_id = m.id
        WHERE p.destacado = 1
        ORDER BY p.fecha_creacion DESC
        LIMIT 10
      `;

      const products = await executeQuery(query);

      res.json({
        success: true,
        data: {
          featured_products: products,
          total: products.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo productos destacados:', error);
      res.status(500).json({
        success: false,
        message: "Error al obtener productos destacados",
        error: error.message
      });
    }
  },

  // Buscar productos
  searchProducts: async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Parámetro de búsqueda 'q' es requerido"
        });
      }

      const searchTerm = `%${q}%`;

      const query = `
        SELECT 
          p.*,
          c.nombre as categoria_nombre,
          m.nombre as marca_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN marcas m ON p.marca_id = m.id
        WHERE p.nombre LIKE ? OR p.descripcion LIKE ? OR p.codigo LIKE ?
        ORDER BY p.destacado DESC, p.nombre ASC
        LIMIT 20
      `;

      const products = await executeQuery(query, [searchTerm, searchTerm, searchTerm]);

      res.json({
        success: true,
        data: {
          products,
          search_term: q,
          total: products.length
        }
      });

    } catch (error) {
      console.error('Error buscando productos:', error);
      res.status(500).json({
        success: false,
        message: "Error al buscar productos",
        error: error.message
      });
    }
  }
};

module.exports = productController;