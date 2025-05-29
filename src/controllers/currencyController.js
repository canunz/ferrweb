// src/controllers/currencyController.js - CONTROLADOR COMPLETO DE DIVISAS

// Simulación de tasas de cambio (en producción vendría del Banco Central)
const exchangeRates = {
  'USD': { rate: 900.50, name: 'Dólar Estadounidense' },
  'EUR': { rate: 980.75, name: 'Euro' },
  'BRL': { rate: 175.30, name: 'Real Brasileño' },
  'ARS': { rate: 1.05, name: 'Peso Argentino' },
  'PEN': { rate: 240.80, name: 'Sol Peruano' },
  'CLP': { rate: 1.00, name: 'Peso Chileno' }
};

// Test del servicio de divisas
const testCurrencyService = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Servicio de divisas funcionando correctamente',
      timestamp: new Date().toISOString(),
      available_endpoints: [
        '/api/v1/currency/supported',
        '/api/v1/currency/rates',
        '/api/v1/currency/convert',
        '/api/v1/currency/history/:currency'
      ]
    });
  } catch (error) {
    console.error('Error en test de divisas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener monedas soportadas
const getSupportedCurrencies = async (req, res) => {
  try {
    const supportedCurrencies = Object.keys(exchangeRates).map(code => ({
      code: code,
      name: exchangeRates[code].name,
      symbol: getSymbol(code),
      enabled: true
    }));

    res.json({
      success: true,
      data: {
        currencies: supportedCurrencies,
        total: supportedCurrencies.length,
        base_currency: 'CLP',
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo monedas soportadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tasas de cambio actuales
const getExchangeRates = async (req, res) => {
  try {
    const rates = Object.keys(exchangeRates).map(code => ({
      currency: code,
      name: exchangeRates[code].name,
      rate_to_clp: exchangeRates[code].rate,
      rate_from_clp: parseFloat((1 / exchangeRates[code].rate).toFixed(6)),
      symbol: getSymbol(code),
      last_updated: new Date().toISOString()
    }));

    res.json({
      success: true,
      data: {
        base_currency: 'CLP',
        rates: rates,
        total_currencies: rates.length,
        source: 'Banco Central de Chile (Simulado)',
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo tasas de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Convertir entre monedas
const convertCurrency = async (req, res) => {
  try {
    const { from, to, amount } = req.query;

    // Validaciones
    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros requeridos: from, to, amount'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser un número positivo'
      });
    }

    const fromCurrency = from.toUpperCase();
    const toCurrency = to.toUpperCase();

    if (!exchangeRates[fromCurrency]) {
      return res.status(400).json({
        success: false,
        message: `Moneda origen '${fromCurrency}' no soportada`
      });
    }

    if (!exchangeRates[toCurrency]) {
      return res.status(400).json({
        success: false,
        message: `Moneda destino '${toCurrency}' no soportada`
      });
    }

    // Conversión: from -> CLP -> to
    let convertedAmount;
    let exchangeRate;

    if (fromCurrency === 'CLP') {
      // De CLP a otra moneda
      convertedAmount = numAmount / exchangeRates[toCurrency].rate;
      exchangeRate = 1 / exchangeRates[toCurrency].rate;
    } else if (toCurrency === 'CLP') {
      // De otra moneda a CLP
      convertedAmount = numAmount * exchangeRates[fromCurrency].rate;
      exchangeRate = exchangeRates[fromCurrency].rate;
    } else {
      // Entre dos monedas extranjeras (via CLP)
      const clpAmount = numAmount * exchangeRates[fromCurrency].rate;
      convertedAmount = clpAmount / exchangeRates[toCurrency].rate;
      exchangeRate = exchangeRates[fromCurrency].rate / exchangeRates[toCurrency].rate;
    }

    res.json({
      success: true,
      data: {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        original_amount: numAmount,
        converted_amount: parseFloat(convertedAmount.toFixed(2)),
        exchange_rate: parseFloat(exchangeRate.toFixed(6)),
        calculation: `${numAmount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`,
        timestamp: new Date().toISOString(),
        source: 'Banco Central de Chile (Simulado)'
      }
    });

  } catch (error) {
    console.error('Error convirtiendo moneda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener historial de una moneda específica
const getCurrencyHistory = async (req, res) => {
  try {
    const { currency } = req.params;
    const currencyCode = currency.toUpperCase();

    if (!exchangeRates[currencyCode]) {
      return res.status(404).json({
        success: false,
        message: `Moneda '${currencyCode}' no encontrada`
      });
    }

    // Simulamos historial de los últimos 7 días
    const history = [];
    const baseRate = exchangeRates[currencyCode].rate;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simular pequeñas variaciones (+/- 2%)
      const variation = (Math.random() - 0.5) * 0.04; // -2% a +2%
      const rate = baseRate * (1 + variation);
      
      history.push({
        date: date.toISOString().split('T')[0],
        rate: parseFloat(rate.toFixed(2)),
        change: parseFloat((variation * 100).toFixed(2)),
        timestamp: date.toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        currency: currencyCode,
        name: exchangeRates[currencyCode].name,
        current_rate: exchangeRates[currencyCode].rate,
        history: history,
        period: 'Last 7 days',
        base_currency: 'CLP'
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Función auxiliar para obtener símbolos de monedas
const getSymbol = (currencyCode) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'BRL': 'R$',
    'ARS': '$',
    'PEN': 'S/',
    'CLP': '$'
  };
  return symbols[currencyCode] || currencyCode;
};

module.exports = {
  testCurrencyService,
  getSupportedCurrencies,
  getExchangeRates,
  convertCurrency,
  getCurrencyHistory
};