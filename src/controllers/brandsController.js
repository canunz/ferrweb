const { executeQuery } = require('../config/database');

// Test del servicio
const testBrands = (req, res) => {
  res.json({
    success: true,
    message: "✅ Servicio de marcas funcionando correctamente",
    timestamp: new Date().toISOString(),
    available_endpoints: [
      "GET /api/v1/brands/test - Test del servicio",
      "GET /api/v1/brands - Lista todas las marcas",
      "GET /api/v1/brands/:id - Obtener marca específica",
      "POST /api/v1/brands - Crear nueva marca",
      "PUT /api/v1/brands/:id - Actualizar marca",
      "DELETE /api/v1/brands/:id - Eliminar marca",
      "GET /api/v1/brands/:id/products - Productos de la marca",
      "GET /api/v1/brands/featured - Marcas destacadas",
      "GET /api/v1/brands/search - Buscar marcas",
      "GET /api/v1/brands/stats - Estadísticas de marcas"
    ]
  });
};

// Listar todas las marcas
const getAllBrands = async (req, res) => {
  try {
    const { page = 1, limit = 20, activo = 1, order_by = 'nombre' } = req.query;
    const offset = (page - 1) * limit;

    // Validar orden
    const validOrderFields = ['nombre', 'fecha_creacion', 'total_productos'];
    const orderField = validOrderFields.includes(order_by) ? order_by : 'nombre';

    const query = `
      SELECT 
        m.*,
        COUNT(p.id) as total_productos,
        COALESCE(AVG(p.precio), 0) as precio_promedio,
        MAX(p.fecha_actualizacion) as ultimo_producto_actualizado
      FROM marcas m
      LEFT JOIN productos p ON m.id = p.marca_id AND p.activo = 1
      WHERE m.activo = ?
      GROUP BY m.id
      ORDER BY ${orderField} ASC
      LIMIT ? OFFSET ?
    `;

    const brands = await executeQuery(query, [activo, parseInt(limit), parseInt(offset)]);

    // Contar total
    const countQuery = 'SELECT COUNT(*) as total FROM marcas WHERE activo = ?';
    const countResult = await executeQuery(countQuery, [activo]);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        brands,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: total,
          total_pages: Math.ceil(total / limit)
        },
        summary: {
          total_marcas_activas: total,
          ordenado_por: orderField
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo marcas:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener marcas",
      error: error.message
    });
  }
};

// Obtener marca específica
const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        m.*,
        COUNT(p.id) as total_productos,
        COALESCE(AVG(p.precio), 0) as precio_promedio,
        MIN(p.precio) as precio_minimo,
        MAX(p.precio) as precio_maximo,
        SUM(p.stock) as stock_total
      FROM marcas m
      LEFT JOIN productos p ON m.id = p.marca_id AND p.activo = 1
      WHERE m.id = ?
      GROUP BY m.id
    `;

    const result = await executeQuery(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Marca no encontrada"
      });
    }

    // Obtener categorías de productos de esta marca
    const categoriesQuery = `
      SELECT DISTINCT c.id, c.nombre, COUNT(p.id) as productos_en_categoria
      FROM categorias c
      INNER JOIN productos p ON c.id = p.categoria_id
      WHERE p.marca_id = ? AND p.activo = 1 AND c.activo = 1
      GROUP BY c.id, c.nombre
      ORDER BY productos_en_categoria DESC
    `;

    const categories = await executeQuery(categoriesQuery, [id]);

    const brandData = {
      ...result[0],
      categorias_asociadas: categories
    };

    res.json({
      success: true,
      data: brandData
    });

  } catch (error) {
    console.error('❌ Error obteniendo marca:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener marca",
      error: error.message
    });
  }
};

// Crear nueva marca
const createBrand = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      activo = 1
    } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la marca es requerido"
      });
    }

    // Verificar si ya existe
    const existingBrand = await executeQuery('SELECT id FROM marcas WHERE nombre = ?', [nombre]);
    if (existingBrand.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una marca con ese nombre"
      });
    }

    const insertQuery = `
      INSERT INTO marcas (nombre, descripcion, activo, fecha_creacion, fecha_actualizacion)
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    const result = await executeQuery(insertQuery, [nombre, descripcion, activo]);

    const newBrand = await executeQuery(`
      SELECT m.*, 0 as total_productos 
      FROM marcas m WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: "Marca creada exitosamente",
      data: newBrand[0]
    });

  } catch (error) {
    console.error('❌ Error creando marca:', error);
    res.status(500).json({
      success: false,
      message: "Error al crear marca",
      error: error.message
    });
  }
};

// Actualizar marca
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    // Verificar que existe
    const existingBrand = await executeQuery('SELECT * FROM marcas WHERE id = ?', [id]);
    if (existingBrand.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Marca no encontrada"
      });
    }

    // Verificar nombre duplicado (excepto la misma marca)
    if (nombre) {
      const duplicateCheck = await executeQuery('SELECT id FROM marcas WHERE nombre = ? AND id != ?', [nombre, id]);
      if (duplicateCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Ya existe otra marca con ese nombre"
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
      UPDATE marcas 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await executeQuery(updateQuery, updateValues);

    // Obtener marca actualizada con estadísticas
    const updatedBrand = await executeQuery(`
      SELECT 
        m.*,
        COUNT(p.id) as total_productos
      FROM marcas m
      LEFT JOIN productos p ON m.id = p.marca_id AND p.activo = 1
      WHERE m.id = ?
      GROUP BY m.id
    `, [id]);

    res.json({
      success: true,
      message: "Marca actualizada exitosamente",
      data: updatedBrand[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando marca:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar marca",
      error: error.message
    });
  }
};

// Eliminar marca (soft delete)
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    // Verificar que existe
    const existingBrand = await executeQuery('SELECT * FROM marcas WHERE id = ?', [id]);
    if (existingBrand.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Marca no encontrada"
      });
    }

    // Verificar si tiene productos asociados
    const productsCount = await executeQuery('SELECT COUNT(*) as total FROM productos WHERE marca_id = ? AND activo = 1', [id]);
    const hasProducts = productsCount[0].total > 0;

    if (hasProducts && !force) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar la marca porque tiene productos asociados",
        data: {
          productos_asociados: productsCount[0].total,
          sugerencia: "Use force=true para eliminar de todas formas (desactivará productos)"
        }
      });
    }

    if (force && hasProducts) {
      // Desactivar productos asociados
      await executeQuery('UPDATE productos SET activo = 0, fecha_actualizacion = NOW() WHERE marca_id = ?', [id]);
    }

    // Soft delete de la marca
    await executeQuery('UPDATE marcas SET activo = 0, fecha_actualizacion = NOW() WHERE id = ?', [id]);

    res.json({
      success: true,
      message: "Marca eliminada exitosamente",
      data: {
        marca_id: id,
        marca_nombre: existingBrand[0].nombre,
        productos_desactivados: hasProducts ? productsCount[0].total : 0,
        eliminacion_forzada: force
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando marca:', error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar marca",
      error: error.message
    });
  }
};

// Obtener productos de una marca
const getBrandProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, activo = 1, categoria, precio_min, precio_max } = req.query;
    const offset = (page - 1) * limit;

    // Verificar que la marca existe
    const brandExists = await executeQuery('SELECT nombre FROM marcas WHERE id = ?', [id]);
    if (brandExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Marca no encontrada"
      });
    }

    // Construir filtros dinámicos
    let whereConditions = ['p.marca_id = ?', 'p.activo = ?'];
    let queryParams = [id, activo];

    if (categoria) {
      whereConditions.push('p.categoria_id = ?');
      queryParams.push(categoria);
    }

    if (precio_min) {
      whereConditions.push('p.precio >= ?');
      queryParams.push(precio_min);
    }

    if (precio_max) {
      whereConditions.push('p.precio <= ?');
      queryParams.push(precio_max);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.*,
        c.nombre as categoria_nombre,
        m.nombre as marca_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      ${whereClause}
      ORDER BY p.nombre ASC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const products = await executeQuery(query, queryParams);

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM productos p ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        marca: {
          id: id,
          nombre: brandExists[0].nombre
        },
        products,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: total,
          total_pages: Math.ceil(total / limit)
        },
        filters_applied: {
          categoria,
          precio_min,
          precio_max
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo productos de marca:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos de la marca",
      error: error.message
    });
  }
};

// Marcas destacadas (con más productos)
const getFeaturedBrands = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const query = `
      SELECT 
        m.*,
        COUNT(p.id) as total_productos,
        COALESCE(AVG(p.precio), 0) as precio_promedio,
        SUM(p.stock) as stock_total
      FROM marcas m
      INNER JOIN productos p ON m.id = p.marca_id AND p.activo = 1
      WHERE m.activo = 1
      GROUP BY m.id
      HAVING COUNT(p.id) > 0
      ORDER BY total_productos DESC, precio_promedio DESC
      LIMIT ?
    `;

    const featuredBrands = await executeQuery(query, [parseInt(limit)]);

    res.json({
      success: true,
      data: {
        featured_brands: featuredBrands,
        total: featuredBrands.length,
        criteria: "Ordenadas por cantidad de productos y precio promedio"
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo marcas destacadas:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener marcas destacadas",
      error: error.message
    });
  }
};

// Buscar marcas
const searchBrands = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Parámetro de búsqueda 'q' es requerido"
      });
    }

    const searchTerm = `%${q.trim()}%`;

    const query = `
      SELECT 
        m.*,
        COUNT(p.id) as total_productos,
        COALESCE(AVG(p.precio), 0) as precio_promedio
      FROM marcas m
      LEFT JOIN productos p ON m.id = p.marca_id AND p.activo = 1
      WHERE m.activo = 1 AND (m.nombre LIKE ? OR m.descripcion LIKE ?)
      GROUP BY m.id
      ORDER BY 
        CASE 
          WHEN m.nombre LIKE ? THEN 1 
          ELSE 2 
        END,
        total_productos DESC
      LIMIT ?
    `;

    const brands = await executeQuery(query, [searchTerm, searchTerm, searchTerm, parseInt(limit)]);

    res.json({
      success: true,
      data: {
        brands,
        total: brands.length,
        search_term: q,
        message: brands.length === 0 ? 'No se encontraron marcas que coincidan con la búsqueda' : null
      }
    });

  } catch (error) {
    console.error('❌ Error en búsqueda de marcas:', error);
    res.status(500).json({
      success: false,
      message: "Error en la búsqueda de marcas",
      error: error.message
    });
  }
};

// Estadísticas de marcas
const getBrandsStats = async (req, res) => {
  try {
    // Estadísticas generales
    const generalStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_marcas,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as marcas_activas,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as marcas_inactivas
      FROM marcas
    `);

    // Top 5 marcas con más productos
    const topBrandsByProducts = await executeQuery(`
      SELECT 
        m.nombre,
        COUNT(p.id) as total_productos,
        COALESCE(AVG(p.precio), 0) as precio_promedio
      FROM marcas m
      LEFT JOIN productos p ON m.id = p.marca_id AND p.activo = 1
      WHERE m.activo = 1
      GROUP BY m.id, m.nombre
      ORDER BY total_productos DESC
      LIMIT 5
    `);

    // Marcas por rango de productos
    const brandsByProductRange = await executeQuery(`
      SELECT 
        CASE 
          WHEN COUNT(p.id) = 0 THEN 'Sin productos'
          WHEN COUNT(p.id) BETWEEN 1 AND 5 THEN '1-5 productos'
          WHEN COUNT(p.id) BETWEEN 6 AND 20 THEN '6-20 productos'
          WHEN COUNT(p.id) BETWEEN 21 AND 50 THEN '21-50 productos'
          ELSE 'Más de 50 productos'
        END as rango_productos,
        COUNT(*) as cantidad_marcas
      FROM marcas m
      LEFT JOIN productos p ON m.id = p.marca_id AND p.activo = 1
      WHERE m.activo = 1
      GROUP BY 
        CASE 
          WHEN COUNT(p.id) = 0 THEN 'Sin productos'
          WHEN COUNT(p.id) BETWEEN 1 AND 5 THEN '1-5 productos'
          WHEN COUNT(p.id) BETWEEN 6 AND 20 THEN '6-20 productos'
          WHEN COUNT(p.id) BETWEEN 21 AND 50 THEN '21-50 productos'
          ELSE 'Más de 50 productos'
        END
      ORDER BY cantidad_marcas DESC
    `);

    // Marcas creadas por mes (últimos 6 meses)
    const brandsByMonth = await executeQuery(`
      SELECT 
        DATE_FORMAT(fecha_creacion, '%Y-%m') as mes,
        COUNT(*) as marcas_creadas
      FROM marcas
      WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha_creacion, '%Y-%m')
      ORDER BY mes DESC
    `);

    res.json({
      success: true,
      data: {
        estadisticas_generales: generalStats[0],
        top_marcas_por_productos: topBrandsByProducts,
        distribucion_por_productos: brandsByProductRange,
        creacion_por_mes: brandsByMonth,
        fecha_reporte: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de marcas:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de marcas",
      error: error.message
    });
  }
};

// Exportar todas las funciones
module.exports = {
  testBrands,
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandProducts,
  getFeaturedBrands,
  searchBrands,
  getBrandsStats
};