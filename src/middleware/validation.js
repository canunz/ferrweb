// src/middleware/validation.js

// Validación para registro de usuario
const validateUserRegistration = (req, res, next) => {
    const { nombre, email, password, rol } = req.body;
    const errors = [];
  
    // Validar campos requeridos
    if (!nombre || nombre.trim().length === 0) {
      errors.push('El nombre es requerido');
    }
  
    if (!email || email.trim().length === 0) {
      errors.push('El email es requerido');
    } else if (!isValidEmail(email)) {
      errors.push('El email no tiene un formato válido');
    }
  
    if (!password || password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
  
    if (rol && !['cliente', 'administrador', 'vendedor', 'bodeguero', 'contador'].includes(rol)) {
      errors.push('El rol especificado no es válido');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de registro inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Validación para login
  const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];
  
    if (!email || email.trim().length === 0) {
      errors.push('El email es requerido');
    }
  
    if (!password || password.trim().length === 0) {
      errors.push('La contraseña es requerida');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de login inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Validación para crear producto
  const validateProduct = (req, res, next) => {
    const { codigo, nombre, precio, categoria_id, marca_id } = req.body;
    const errors = [];
  
    if (!codigo || codigo.trim().length === 0) {
      errors.push('El código del producto es requerido');
    }
  
    if (!nombre || nombre.trim().length === 0) {
      errors.push('El nombre del producto es requerido');
    }
  
    if (!precio || isNaN(precio) || precio <= 0) {
      errors.push('El precio debe ser un número mayor a 0');
    }
  
    if (!categoria_id || isNaN(categoria_id)) {
      errors.push('La categoría es requerida');
    }
  
    if (!marca_id || isNaN(marca_id)) {
      errors.push('La marca es requerida');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos del producto inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Validación para crear pedido
  const validateOrder = (req, res, next) => {
    const { productos, tipo_entrega, sucursal_id } = req.body;
    const errors = [];
  
    if (!Array.isArray(productos) || productos.length === 0) {
      errors.push('Debe incluir al menos un producto en el pedido');
    } else {
      productos.forEach((producto, index) => {
        if (!producto.producto_id || isNaN(producto.producto_id)) {
          errors.push(`Producto ${index + 1}: ID de producto inválido`);
        }
        if (!producto.cantidad || isNaN(producto.cantidad) || producto.cantidad <= 0) {
          errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
        }
      });
    }
  
    if (!tipo_entrega || !['retiro_tienda', 'despacho_domicilio'].includes(tipo_entrega)) {
      errors.push('Tipo de entrega inválido');
    }
  
    if (tipo_entrega === 'despacho_domicilio' && (!req.body.direccion_entrega || req.body.direccion_entrega.trim().length === 0)) {
      errors.push('La dirección de entrega es requerida para despacho a domicilio');
    }
  
    if (!sucursal_id || isNaN(sucursal_id)) {
      errors.push('La sucursal es requerida');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos del pedido inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Validación para crear pago
  const validatePayment = (req, res, next) => {
    const { pedido_id, metodo_pago, monto } = req.body;
    const errors = [];
  
    if (!pedido_id || isNaN(pedido_id)) {
      errors.push('ID de pedido inválido');
    }
  
    if (!metodo_pago || !['debito', 'credito', 'transferencia', 'mercadopago'].includes(metodo_pago)) {
      errors.push('Método de pago inválido');
    }
  
    if (!monto || isNaN(monto) || monto <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de pago inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Función helper para validar email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Función helper para validar RUT chileno
  const isValidRUT = (rut) => {
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
  };
  
  // Validación para actualizar stock
  const validateStockUpdate = (req, res, next) => {
    const { stock_actual } = req.body;
    const errors = [];
  
    if (stock_actual === undefined || isNaN(stock_actual) || stock_actual < 0) {
      errors.push('El stock debe ser un número mayor o igual a 0');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de stock inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Validación para cambio de contraseña
  const validatePasswordChange = (req, res, next) => {
    const { current_password, new_password } = req.body;
    const errors = [];
  
    if (!current_password || current_password.trim().length === 0) {
      errors.push('La contraseña actual es requerida');
    }
  
    if (!new_password || new_password.length < 6) {
      errors.push('La nueva contraseña debe tener al menos 6 caracteres');
    }
  
    if (current_password === new_password) {
      errors.push('La nueva contraseña debe ser diferente a la actual');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de cambio de contraseña inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Validación para crear usuario interno
  const validateInternalUser = (req, res, next) => {
    const { nombre, email, rol, rut } = req.body;
    const errors = [];
  
    if (!nombre || nombre.trim().length === 0) {
      errors.push('El nombre es requerido');
    }
  
    if (!email || email.trim().length === 0) {
      errors.push('El email es requerido');
    } else if (!isValidEmail(email)) {
      errors.push('El email no tiene un formato válido');
    }
  
    if (!rol || !['administrador', 'vendedor', 'bodeguero', 'contador'].includes(rol)) {
      errors.push('El rol especificado no es válido para usuario interno');
    }
  
    if (rut && !isValidRUT(rut)) {
      errors.push('El RUT no tiene un formato válido');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de usuario interno inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Validación para actualizar estado de pedido
  const validateOrderStatus = (req, res, next) => {
    const { estado } = req.body;
    const errors = [];
  
    const estadosValidos = ['pendiente', 'aprobado', 'preparando', 'listo', 'entregado', 'cancelado'];
  
    if (!estado || !estadosValidos.includes(estado)) {
      errors.push('Estado de pedido inválido. Estados válidos: ' + estadosValidos.join(', '));
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de actualización de estado inválidos',
        errors
      });
    }
  
    next();
  };
  
  // Validación para parámetros numéricos
  const validateNumericParam = (paramName) => {
    return (req, res, next) => {
      const value = req.params[paramName];
      
      if (!value || isNaN(value) || parseInt(value) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Parámetro ${paramName} debe ser un número válido mayor a 0`
        });
      }
  
      next();
    };
  };
  
  // Validación para paginación
  const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;
    
    if (page && (isNaN(page) || parseInt(page) < 1)) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro page debe ser un número mayor a 0'
      });
    }
  
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro limit debe ser un número entre 1 y 100'
      });
    }
  
    next();
  };
  
  module.exports = {
    validateUserRegistration,
    validateLogin,
    validateProduct,
    validateOrder,
    validatePayment,
    validateStockUpdate,
    validatePasswordChange,
    validateInternalUser,
    validateOrderStatus,
    validateNumericParam,
    validatePagination,
    isValidEmail,
    isValidRUT
  };