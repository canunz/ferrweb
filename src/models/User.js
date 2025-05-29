// src/models/User.js
const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.nombre = userData.nombre;
    this.email = userData.email;
    this.password = userData.password;
    this.rol = userData.rol;
    this.rut = userData.rut;
    this.telefono = userData.telefono;
    this.direccion = userData.direccion;
    this.sucursal_id = userData.sucursal_id;
    this.activo = userData.activo;
    this.primer_login = userData.primer_login;
    this.fecha_creacion = userData.fecha_creacion;
  }

  // Crear nuevo usuario
  static async create(userData) {
    const { nombre, email, password, rol = 'cliente', rut, telefono, direccion, sucursal_id } = userData;
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO usuarios (nombre, email, password, rol, rut, telefono, direccion, sucursal_id, primer_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      nombre, 
      email, 
      hashedPassword, 
      rol, 
      rut || null, 
      telefono || null, 
      direccion || null, 
      sucursal_id || null,
      rol === 'cliente' ? false : true
    ]);
    
    return result.insertId;
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = ? AND activo = true';
    const users = await executeQuery(query, [email]);
    
    if (users.length === 0) return null;
    
    return new User(users[0]);
  }

  // Buscar usuario por ID
  static async findById(id) {
    const query = 'SELECT * FROM usuarios WHERE id = ? AND activo = true';
    const users = await executeQuery(query, [id]);
    
    if (users.length === 0) return null;
    
    return new User(users[0]);
  }

  // Verificar contraseña
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Actualizar contraseña
  async updatePassword(newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE usuarios SET password = ?, primer_login = false WHERE id = ?';
    
    await executeQuery(query, [hashedPassword, this.id]);
    this.password = hashedPassword;
    this.primer_login = false;
  }

  // Actualizar información del usuario
  async update(updateData) {
    const { nombre, telefono, direccion } = updateData;
    const query = 'UPDATE usuarios SET nombre = ?, telefono = ?, direccion = ? WHERE id = ?';
    
    await executeQuery(query, [nombre || this.nombre, telefono || this.telefono, direccion || this.direccion, this.id]);
    
    // Actualizar propiedades del objeto
    this.nombre = nombre || this.nombre;
    this.telefono = telefono || this.telefono;
    this.direccion = direccion || this.direccion;
  }

  // Obtener usuarios por rol
  static async findByRole(rol) {
    const query = 'SELECT * FROM usuarios WHERE rol = ? AND activo = true ORDER BY nombre';
    const users = await executeQuery(query, [rol]);
    
    return users.map(userData => new User(userData));
  }

  // Obtener todos los usuarios (solo admin)
  static async findAll(filters = {}) {
    let query = `
      SELECT u.*, s.nombre as sucursal_nombre 
      FROM usuarios u 
      LEFT JOIN sucursales s ON u.sucursal_id = s.id 
      WHERE u.activo = true
    `;
    const params = [];

    if (filters.rol) {
      query += ' AND u.rol = ?';
      params.push(filters.rol);
    }

    if (filters.sucursal_id) {
      query += ' AND u.sucursal_id = ?';
      params.push(filters.sucursal_id);
    }

    query += ' ORDER BY u.nombre';

    const users = await executeQuery(query, params);
    return users.map(userData => new User(userData));
  }

  // Desactivar usuario
  async deactivate() {
    const query = 'UPDATE usuarios SET activo = false WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = false;
  }

  // Activar usuario
  async activate() {
    const query = 'UPDATE usuarios SET activo = true WHERE id = ?';
    await executeQuery(query, [this.id]);
    this.activo = true;
  }

  // Verificar si el email ya existe
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM usuarios WHERE email = ?';
    const params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await executeQuery(query, params);
    return result.length > 0;
  }

  // Obtener estadísticas de usuarios
  static async getStats() {
    const query = `
      SELECT 
        rol,
        COUNT(*) as total,
        COUNT(CASE WHEN activo = true THEN 1 END) as activos
      FROM usuarios 
      GROUP BY rol
    `;
    
    const stats = await executeQuery(query);
    return stats;
  }

  // Obtener historial de pedidos del usuario
  async getOrderHistory(limit = 10) {
    const query = `
      SELECT p.id, p.numero_pedido, p.estado, p.total, p.fecha_pedido,
             s.nombre as sucursal_nombre
      FROM pedidos p
      INNER JOIN sucursales s ON p.sucursal_id = s.id
      WHERE p.cliente_id = ?
      ORDER BY p.fecha_pedido DESC
      LIMIT ?
    `;
    
    return await executeQuery(query, [this.id, limit]);
  }

  // Obtener información completa del usuario con sucursal
  async getFullInfo() {
    const query = `
      SELECT u.*, s.nombre as sucursal_nombre, s.direccion as sucursal_direccion,
             s.telefono as sucursal_telefono, s.email as sucursal_email
      FROM usuarios u
      LEFT JOIN sucursales s ON u.sucursal_id = s.id
      WHERE u.id = ?
    `;
    
    const result = await executeQuery(query, [this.id]);
    return result.length > 0 ? result[0] : null;
  }

  // Verificar si el usuario puede acceder a una sucursal específica
  canAccessSucursal(sucursalId) {
    // Administradores pueden acceder a todas las sucursales
    if (this.rol === 'administrador') return true;
    
    // Otros roles solo pueden acceder a su sucursal asignada
    return this.sucursal_id === sucursalId;
  }

  // Obtener permisos según el rol
  getPermissions() {
    const permissions = {
      cliente: ['view_products', 'create_orders', 'view_own_orders'],
      vendedor: ['view_products', 'manage_orders', 'view_inventory', 'approve_orders'],
      bodeguero: ['view_products', 'manage_inventory', 'prepare_orders'],
      contador: ['view_financial_data', 'confirm_payments', 'generate_reports'],
      administrador: ['all_permissions']
    };

    return permissions[this.rol] || [];
  }

  // Verificar si el usuario tiene un permiso específico
  hasPermission(permission) {
    const userPermissions = this.getPermissions();
    return userPermissions.includes('all_permissions') || userPermissions.includes(permission);
  }

  // Cambiar rol del usuario (solo admin)
  async changeRole(newRole, adminId) {
    const validRoles = ['cliente', 'administrador', 'vendedor', 'bodeguero', 'contador'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error('Rol inválido');
    }

    const query = 'UPDATE usuarios SET rol = ? WHERE id = ?';
    await executeQuery(query, [newRole, this.id]);
    
    this.rol = newRole;
    
    // Log del cambio de rol
    console.log(`Rol cambiado para usuario ${this.id} por admin ${adminId}: ${this.rol} -> ${newRole}`);
  }

  // Obtener clientes más activos
  static async getTopClients(limit = 10) {
    const query = `
      SELECT u.id, u.nombre, u.email, 
             COUNT(p.id) as total_pedidos,
             SUM(p.total) as total_gastado
      FROM usuarios u
      INNER JOIN pedidos p ON u.id = p.cliente_id
      WHERE u.rol = 'cliente' AND u.activo = true
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total_gastado DESC
      LIMIT ?
    `;
    
    return await executeQuery(query, [limit]);
  }

  // Buscar usuarios por criterio
  static async search(searchTerm, filters = {}) {
    let query = `
      SELECT u.*, s.nombre as sucursal_nombre
      FROM usuarios u
      LEFT JOIN sucursales s ON u.sucursal_id = s.id
      WHERE u.activo = true 
      AND (u.nombre LIKE ? OR u.email LIKE ? OR u.rut LIKE ?)
    `;
    
    const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

    if (filters.rol) {
      query += ' AND u.rol = ?';
      params.push(filters.rol);
    }

    if (filters.sucursal_id) {
      query += ' AND u.sucursal_id = ?';
      params.push(filters.sucursal_id);
    }

    query += ' ORDER BY u.nombre LIMIT 50';

    const users = await executeQuery(query, params);
    return users.map(userData => new User(userData));
  }

  // Obtener usuarios por sucursal
  static async getBySucursal(sucursalId) {
    const query = `
      SELECT u.*, s.nombre as sucursal_nombre
      FROM usuarios u
      INNER JOIN sucursales s ON u.sucursal_id = s.id
      WHERE u.sucursal_id = ? AND u.activo = true
      ORDER BY u.rol, u.nombre
    `;
    
    const users = await executeQuery(query, [sucursalId]);
    return users.map(userData => new User(userData));
  }

  // Verificar RUT chileno
  static isValidRUT(rut) {
    if (!rut || typeof rut !== 'string') return false;
    
    const cleanRUT = rut.replace(/[^0-9kK]/g, '');
    if (cleanRUT.length < 8 || cleanRUT.length > 9) return false;
    
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1).toLowerCase();
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedDV = 11 - (sum % 11);
    const finalDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'k' : expectedDV.toString();
    
    return dv === finalDV;
  }

  // Convertir a objeto JSON (sin contraseña)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Obtener resumen del usuario para dashboard
  async getDashboardSummary() {
    if (this.rol !== 'cliente') return null;

    const query = `
      SELECT 
        COUNT(p.id) as total_pedidos,
        COUNT(CASE WHEN p.estado = 'entregado' THEN 1 END) as pedidos_completados,
        COUNT(CASE WHEN p.estado IN ('pendiente', 'aprobado', 'preparando', 'listo') THEN 1 END) as pedidos_activos,
        COALESCE(SUM(CASE WHEN p.estado = 'entregado' THEN p.total ELSE 0 END), 0) as total_gastado,
        MAX(p.fecha_pedido) as ultimo_pedido
      FROM pedidos p
      WHERE p.cliente_id = ?
    `;

    const result = await executeQuery(query, [this.id]);
    return result[0];
  }
}

module.exports = User;