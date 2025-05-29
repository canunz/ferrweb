// src/utils/helpers.js

// Formatear moneda chilena
const formatCLP = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };
  
  // Formatear fecha en formato chileno
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };
  
  // Validar RUT chileno
  const validateRUT = (rut) => {
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
  
  // Formatear RUT chileno
  const formatRUT = (rut) => {
    if (!rut) return '';
    
    const cleanRUT = rut.replace(/[^0-9kK]/g, '');
    if (cleanRUT.length < 8) return rut;
    
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1);
    
    return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
  };
  
  // Generar código alfanumérico
  const generateCode = (prefix = '', length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };
  
  // Calcular descuento por cantidad
  const calculateDiscount = (subtotal, quantity) => {
    if (quantity > 4) {
      return subtotal * 0.05; // 5% descuento por más de 4 artículos
    }
    return 0;
  };
  
  // Validar email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Sanitizar string para SQL
  const sanitizeString = (str) => {
    if (!str) return '';
    return str.toString().trim().replace(/[<>]/g, '');
  };
  
  // Generar respuesta estándar de éxito
  const successResponse = (data, message = 'Operación exitosa') => {
    return {
      success: true,
      message,
      data
    };
  };
  
  // Generar respuesta estándar de error
  const errorResponse = (message = 'Error interno del servidor', error = null) => {
    const response = {
      success: false,
      message
    };
    
    if (error && process.env.NODE_ENV === 'development') {
      response.error = error;
    }
    
    return response;
  };
  
  // Convertir texto a slug
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };
  
  // Validar número de teléfono chileno
  const isValidChileanPhone = (phone) => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    // Acepta formatos: +56912345678, 56912345678, 912345678, 12345678
    return /^(\+?56)?[0-9]{8,9}$/.test(cleanPhone);
  };
  
  // Formatear número de teléfono chileno
  const formatChileanPhone = (phone) => {
    if (!phone) return '';
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    if (cleanPhone.length === 8) {
      // Teléfono fijo: 12345678 -> +56 2 1234 5678
      return `+56 2 ${cleanPhone.substring(0, 4)} ${cleanPhone.substring(4)}`;
    } else if (cleanPhone.length === 9) {
      // Celular: 912345678 -> +56 9 1234 5678
      return `+56 ${cleanPhone.substring(0, 1)} ${cleanPhone.substring(1, 5)} ${cleanPhone.substring(5)}`;
    }
    
    return phone;
  };
  
  // Calcular edad desde fecha de nacimiento
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Redondear a decimales específicos
  const roundToDecimals = (number, decimals = 2) => {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };
  
  module.exports = {
    formatCLP,
    formatDate,
    validateRUT,
    formatRUT,
    generateCode,
    calculateDiscount,
    isValidEmail,
    sanitizeString,
    successResponse,
    errorResponse,
    slugify,
    isValidChileanPhone,
    formatChileanPhone,
    calculateAge,
    roundToDecimals
  };