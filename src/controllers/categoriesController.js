const { executeQuery } = require('../config/database');

// Test del servicio
const testCategories = (req, res) => {
  res.json({
    success: true,
    message: "✅ Servicio de categorías funcionando correctamente",
    timestamp: new Date().toISOString(),
    available_endpoints: [
      "GET /api/v1/categories/test - Test del servicio",
      "GET /api/v1/categories - Lista todas las categorías",
      "GET /api/v1/categories/:id - Obtener categoría específica",
      "POST /api/v1/categories - Crear nueva categoría",
      "PUT /api/v1/categories/:id - Actualizar categoría",
      "DELETE /api/v1/categories/:id - Eliminar categoría",
      "GET /api/v1/categories/:id/products - Productos de la categoría"
    ]
  });
};

// Listar todas las categorías
const getAllCategories = async (req, res) => {
  try {
    const { activo = 1 } = req.query;

    const query = `
      SELECT 
        c.*,
        COUNT(p.id) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1
      WHERE c.activo = ?
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `;

    const categories = await executeQuery(query, [activo]);

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener categorías",
      error: error.message
    });
  }
};

// Obtener categoría específica
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        c.*,
        COUNT(p.id) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1
      WHERE c.id = ?
      GROUP BY c.id
    `;

    const result = await executeQuery(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener categoría",
      error: error.message
    });
  }
};

// Crear nueva categoría
const createCategory = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      activo = 1
    } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la categoría es requerido"
      });
    }

    // Verificar si ya existe
    const existingCategory = await executeQuery('SELECT id FROM categorias WHERE nombre = ?', [nombre]);
    if (existingCategory.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una categoría con ese nombre"
      });
    }

    const insertQuery = `
      INSERT INTO categorias (nombre, descripcion, activo, fecha_creacion, fecha_actualizacion)
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    const result = await executeQuery(insertQuery, [nombre, descripcion, activo]);

    const newCategory = await executeQuery('SELECT * FROM categorias WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: "Categoría creada exitosamente",
      data: newCategory[0]
    });

  } catch (error) {
    console.error('❌ Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: "Error al crear categoría",
      error: error.message
    });
  }
};

// Actualizar categoría
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    // Verificar que existe
    const existingCategory = await executeQuery('SELECT * FROM categorias WHERE id = ?', [id]);
    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    // Verificar nombre duplicado (excepto la misma categoría)
    if (nombre) {
      const duplicateCheck = await executeQuery('SELECT id FROM categorias WHERE nombre = ? AND id != ?', [nombre, id]);
      if (duplicateCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Ya existe otra categoría con ese nombre"
        });
      }
    }

    // Construir query dinámico
    const updateFields = [];
    const updateValues = [];

    if (nombre !== undefined) {
      updateFields.push('nombre = ?');
      updateValues.push(nombre);
    }
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      updateValues.push(descripcion);
    }
    if (activo !== undefined) {
      updateFields.push('activo = ?');
      updateValues.push(activo);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay campos para actualizar"
      });
    }

    updateFields.push('fecha_actualizacion = NOW()');
    updateValues.push(id);

    const updateQuery = `
      UPDATE categorias 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await executeQuery(updateQuery, updateValues);

    const updatedCategory = await executeQuery('SELECT * FROM categorias WHERE id = ?', [id]);

    res.json({
      success: true,
      message: "Categoría actualizada exitosamente",
      data: updatedCategory[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar categoría",
      error: error.message
    });
  }
};

// Eliminar categoría (soft delete)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    // Verificar que existe
    const existingCategory = await executeQuery('SELECT * FROM categorias WHERE id = ?', [id]);
    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    // Verificar si tiene productos asociados
    const productsCount = await executeQuery('SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND activo = 1', [id]);
    const hasProducts = productsCount[0].total > 0;

    if (hasProducts && !force) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar la categoría porque tiene productos asociados",
        data: {
          productos_asociados: productsCount[0].total,
          sugerencia: "Use force=true para eliminar de todas formas (desactivará productos)"
        }
      });
    }

    if (force && hasProducts) {
      // Desactivar productos asociados
      await executeQuery('UPDATE productos SET activo = 0, fecha_actualizacion = NOW() WHERE categoria_id = ?', [id]);
    }

    // Soft delete de la categoría
    await executeQuery('UPDATE categorias SET activo = 0, fecha_actualizacion = NOW() WHERE id = ?', [id]);

    res.json({
      success: true,
      message: "Categoría eliminada exitosamente",
      data: {
        categoria_id: id,
        categoria_nombre: existingCategory[0].nombre,
        productos_desactivados: hasProducts ? productsCount[0].total : 0,
        eliminacion_forzada: force
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar categoría",
      error: error.message
    });
  }
};

// Obtener productos de una categoría
const getCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, activo = 1 } = req.query;
    const offset = (page - 1) * limit;

    // Verificar que la categoría existe
    const categoryExists = await executeQuery('SELECT nombre FROM categorias WHERE id = ?', [id]);
    if (categoryExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    const query = `
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        m.nombre as marca_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.categoria_id = ? AND p.activo = ?
      ORDER BY p.nombre ASC
      LIMIT ? OFFSET ?
    `;

    const products = await executeQuery(query, [id, activo, parseInt(limit), parseInt(offset)]);

    // Contar total
    const countResult = await executeQuery('SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND activo = ?', [id, activo]);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        categoria: {
          id: id,
          nombre: categoryExists[0].nombre
        },
        products,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo productos de categoría:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos de la categoría",
      error: error.message
    });
  }
};

module.exports = {
  testCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts
};