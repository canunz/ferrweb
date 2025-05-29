// src/services/currencyService.js
const axios = require('axios');

// API del Banco Central de Chile
const BCN_API_URL = process.env.BCN_API_URL || 'https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx';
const BCN_USER = process.env.BCN_USER;
const BCN_PASSWORD = process.env.BCN_PASSWORD;

// Cache para tasas de cambio (evitar demasiadas llamadas a la API)
let exchangeRatesCache = {
  data: null,
  timestamp: null,
  ttl: 3600000 // 1 hora en milisegundos
};

// Obtener tasas de cambio del Banco Central
const getExchangeRatesFromBCN = async () => {
  try {
    // Verificar cache
    const now = Date.now();
    if (exchangeRatesCache.data && 
        exchangeRatesCache.timestamp && 
        (now - exchangeRatesCache.timestamp) < exchangeRatesCache.ttl) {
      return exchangeRatesCache.data;
    }

    if (!BCN_USER || !BCN_PASSWORD) {
      console.warn('Credenciales del Banco Central no configuradas, usando tasas de respaldo');
      return getFallbackRates();
    }

    // Obtener USD
    const usdResponse = await axios.post(BCN_API_URL, {
      user: BCN_USER,
      password: BCN_PASSWORD,
      firstDate: new Date().toISOString().split('T')[0],
      lastDate: new Date().toISOString().split('T')[0],
      seriesIds: ['F073.TCO.PRE.Z.D'], // Serie del dólar observado
      functions: ['GetSeries']
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Obtener EUR
    const eurResponse = await axios.post(BCN_API_URL, {
      user: BCN_USER,
      password: BCN_PASSWORD,
      firstDate: new Date().toISOString().split('T')[0],
      lastDate: new Date().toISOString().split('T')[0],
      seriesIds: ['F072.CLP.EUR.N.O.D'], // Serie del euro
      functions: ['GetSeries']
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const rates = {
      USD: extractRateFromBCNResponse(usdResponse.data),
      EUR: extractRateFromBCNResponse(eurResponse.data),
      CLP: 1
    };

    // Actualizar cache
    exchangeRatesCache = {
      data: rates,
      timestamp: now,
      ttl: 3600000
    };

    return rates;

  } catch (error) {
    console.error('Error obteniendo tasas del Banco Central:', error.message);
    return getFallbackRates();
  }
};

// Extraer tasa de la respuesta del Banco Central
const extractRateFromBCNResponse = (responseData) => {
  try {
    if (responseData && responseData.Series && responseData.Series.length > 0) {
      const series = responseData.Series[0];
      if (series.Obs && series.Obs.length > 0) {
        return parseFloat(series.Obs[series.Obs.length - 1].value);
      }
    }
    return null;
  } catch (error) {
    console.error('Error extrayendo tasa de respuesta BCN:', error);
    return null;
  }
};

// Tasas de respaldo en caso de fallo de la API
const getFallbackRates = () => {
  return {
    USD: 800, // Valor aproximado CLP por USD
    EUR: 900, // Valor aproximado CLP por EUR
    CLP: 1
  };
};

// Convertir entre divisas
const convertCurrency = async (from, to, amount) => {
  try {
    const rates = await getExchangeRatesFromBCN();
    
    from = from.toUpperCase();
    to = to.toUpperCase();

    if (from === to) {
      return {
        convertedAmount: amount,
        exchangeRate: 1,
        date: new Date().toISOString()
      };
    }

    let convertedAmount;
    let exchangeRate;

    // Conversión usando CLP como base
    if (from === 'CLP') {
      // De CLP a otra moneda
      exchangeRate = 1 / rates[to];
      convertedAmount = amount * exchangeRate;
    } else if (to === 'CLP') {
      // De otra moneda a CLP
      exchangeRate = rates[from];
      convertedAmount = amount * exchangeRate;
    } else {
      // Entre dos monedas extranjeras (pasando por CLP)
      const clpAmount = amount * rates[from];
      exchangeRate = rates[from] / rates[to];
      convertedAmount = clpAmount / rates[to];
    }

    return {
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      exchangeRate: Math.round(exchangeRate * 10000) / 10000,
      date: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en conversión de divisas:', error);
    throw new Error('Error en el servicio de conversión de divisas');
  }
};

// Obtener todas las tasas de cambio
const getExchangeRates = async () => {
  try {
    return await getExchangeRatesFromBCN();
  } catch (error) {
    console.error('Error obteniendo tasas de cambio:', error);
    throw new Error('Error obteniendo tasas de cambio');
  }
};

// Limpiar cache (útil para testing o actualizaciones forzadas)
const clearCache = () => {
  exchangeRatesCache = {
    data: null,
    timestamp: null,
    ttl: 3600000
  };
};

module.exports = {
  convertCurrency,
  getExchangeRates,
  clearCache
};