// src/services/mercadopagoService.js
const axios = require('axios');

const MERCADOPAGO_BASE_URL = 'https://api.mercadopago.com';
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

// Crear preferencia de pago
const createPreference = async (preferenceData) => {
  try {
    if (!ACCESS_TOKEN) {
      throw new Error('MercadoPago Access Token no configurado');
    }

    const response = await axios.post(
      `${MERCADOPAGO_BASE_URL}/checkout/preferences`,
      preferenceData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('Error creando preferencia MercadoPago:', error.response?.data || error.message);
    throw new Error('Error al crear preferencia de pago en MercadoPago');
  }
};

// Obtener información de un pago
const getPayment = async (paymentId) => {
  try {
    if (!ACCESS_TOKEN) {
      throw new Error('MercadoPago Access Token no configurado');
    }

    const response = await axios.get(
      `${MERCADOPAGO_BASE_URL}/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('Error obteniendo pago MercadoPago:', error.response?.data || error.message);
    throw new Error('Error al obtener información del pago');
  }
};

// Buscar pagos por referencia externa
const searchPayments = async (externalReference) => {
  try {
    if (!ACCESS_TOKEN) {
      throw new Error('MercadoPago Access Token no configurado');
    }

    const response = await axios.get(
      `${MERCADOPAGO_BASE_URL}/v1/payments/search`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        params: {
          external_reference: externalReference
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('Error buscando pagos MercadoPago:', error.response?.data || error.message);
    throw new Error('Error al buscar pagos');
  }
};

// Reembolsar un pago
const refundPayment = async (paymentId, amount = null) => {
  try {
    if (!ACCESS_TOKEN) {
      throw new Error('MercadoPago Access Token no configurado');
    }

    const refundData = {};
    if (amount) {
      refundData.amount = amount;
    }

    const response = await axios.post(
      `${MERCADOPAGO_BASE_URL}/v1/payments/${paymentId}/refunds`,
      refundData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('Error reembolsando pago MercadoPago:', error.response?.data || error.message);
    throw new Error('Error al procesar reembolso');
  }
};

module.exports = {
  createPreference,
  getPayment,
  searchPayments,
  refundPayment
};