// src/models/Product.js
const { executeQuery } = require('../config/database');

class Product {
  constructor(productData) {
    this.id = productData.id;
    this.codigo = productData.codigo;
    this.nombre = productData.nombre;
    this.descripcion = productData.descripcion;
    this.precio = productData.precio;
    this.categoria_id = productData.categoria_id;
    this.marca_id = productData.marca_id;
    this.modelo = productData.modelo;
    this.activo = productData.activo;
    this.fecha_creacion = productData.fecha_creacion;
    this.fecha_actualizacion = productData.fecha_actualizacion;
  }

  // Crear nuevo producto
  static async create(productData) {
    const { codigo, nombre, descripcion, precio, categoria_id, marca_id, modelo } = productData;
    
    const query = `
      INSERT INTO productos (codigo, nombre, descripcion, precio, categoria_id, marca_id, modelo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      codigo, 
      nombre, 
      descripcion || null, 
      precio, 
      categoria_id, 
      marca_id, 
      modelo || null
    ]);
    
    return result.insertId;
  }

  // Buscar producto por ID
  static async findById(id) {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre, m.pais_origen
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN marcas m ON p.marca_id = m.id
      WHERE p.id = ? AND p.activo = true
    `;
    
    const products = await executeQuery(query, [id]);
    
    if (products.length === 0) return null;
    
    return new Product(products[0]);
  }

  // Buscar producto por código
  static async findByCode(codigo) {
    const query = 'SELECT * FROM productos WHERE codigo = ? AND activo = true';
    const products = await executeQuery(query, [codigo]);
    
    if (products.length === 0) return null;
    
    return new Product(products[0]);
  }

  // Obtener todos los productos con filtros
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre, m.pais_origen
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN marcas m ON p.marca_id = m.id
      WHERE p.activo = true
    `;
    const params = [];

    if (filters.categoria_id) {
      query += ' AND p.categoria_id = ?';
      params.push(filters.categoria_id);
    }

    if (filters.marca_id) {
      query += ' AND p.marca_id = ?';
      params.push(filters.marca_id);
    }

    if (filters.search) {
      query += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.codigo LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.min_precio) {
      query += ' AND p.precio >= ?';
      params.push(filters.min_precio);
    }

    if (filters.max_precio) {
      query += ' AND p.precio <= ?';
      params.push(filters.max_precio);
    }

    query += ' ORDER BY p.nombre';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    const products = await executeQuery(query, params);
    return products.map(productData => new Product(productData));
  }

  // Actualizar producto
  async update(updateData) {
    const { nombre, descripcion, precio, categoria_id, marca_id, modelo } = updateData;
    
    const query = `
      UPDATE productos 
      SET nombre = ?, descripcion = ?, precio = ?, categoria_id = ?, marca_id = ?, modelo = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      nombre || this.nombre,
      descripcion !== undefined ? descripcion : this.descripcion,
      precio || this.precio,
      categoria_id || this.categoria_id,
      marca_id || this.marca_id,
      modelo !== undefined ? modelo : this.modelo,
      this.id
    ]);

    // Actualizar propiedades del objeto
    this.nombre = nombre || this.nombre;
    this.descripcion = descripcion !== undefined ? descripcion : this.descripcion;
    this.precio = precio || this.precio;
    this.categoria_id = categoria_id || this.categoria_id;
    this.marca_id = marca_id || this.marca_id;
    this.modelo = modelo !== undefined ? modelo : this.modelo;
  }

  // Desactivar producto
  async deactivate() {
    const query = 'UPDATE productos SET activo = false WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = false;
  }

  // Activar producto
  async activate() {
    const query = 'UPDATE productos SET activo = true WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = true;
  }

  // Obtener stock por sucursal
  async getStockBySucursal(sucursal_id) {
    const query = `
      SELECT i.stock_actual, i.stock_minimo, s.nombre as sucursal_nombre
      FROM inventario i
      INNER JOIN sucursales s ON i.sucursal_id = s.id
      WHERE i.producto_id = ? AND i.sucursal_id = ?
    `;
    
    const stock = await executeQuery(query, [this.id, sucursal_id]);
    return stock.length > 0 ? stock[0] : null;
  }

  // Obtener stock total
  async getTotalStock() {
    const query = `
      SELECT SUM(stock_actual) as total_stock
      FROM inventario
      WHERE producto_id = ?
    `;
    
    const result = await executeQuery(query, [this.id]);
    return result[0]?.total_stock || 0;
  }

  // Obtener stock por todas las sucursales
  async getStockAllSucursales() {
    const query = `
      SELECT i.stock_actual, i.stock_minimo, s.id as sucursal_id, s.nombre as sucursal_nombre
      FROM inventario i
      INNER JOIN sucursales s ON i.sucursal_id = s.id
      WHERE i.producto_id = ?
      ORDER BY s.nombre
    `;
    
    return await executeQuery(query, [this.id]);
  }

  // Verificar si el código ya existe
  static async codeExists(codigo, excludeId = null) {
    let query = 'SELECT id FROM productos WHERE codigo = ?';
    const params = [codigo];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await executeQuery(query, params);
    return result.length > 0;
  }

  // Obtener productos más vendidos
  static async getBestSellers(limit = 10) {
    const query = `
      SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre,
             SUM(dp.cantidad) as total_vendido
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN marcas m ON p.marca_id = m.id
      INNER JOIN detalle_pedidos dp ON p.id = dp.producto_id
      INNER JOIN pedidos pe ON dp.pedido_id = pe.id
      WHERE p.activo = true AND pe.estado = 'entregado'
      GROUP BY p.id
      ORDER BY total_vendido DESC
      LIMIT ?
    `;
    
    const products = await executeQuery(query, [limit]);
    return products.map(productData => new Product(productData));
  }

  // Obtener estadísticas del producto
  async getStats() {
    const query = `
      SELECT 
        COUNT(dp.id) as total_pedidos,
        SUM(dp.cantidad) as total_vendido,
        AVG(dp.precio_unitario) as precio_promedio
      FROM detalle_pedidos dp
      INNER JOIN pedidos p ON dp.pedido_id = p.id
      WHERE dp.producto_id = ? AND p.estado = 'entregado'
    `;
    
    const stats = await executeQuery(query, [this.id]);
    return stats[0];
  }
}

module.exports = Product;