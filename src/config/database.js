// src/config/database.js
const mysql = require('mysql2');
require('dotenv').config();

// Configuración de la conexión MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'emma2004',
    database: process.env.DB_NAME || 'ferreinve',
    port: process.env.DB_PORT || 3306,
    
    // Configuraciones válidas para MySQL2
    connectionLimit: 10,
    queueLimit: 0,
    
    // Configuraciones de conexión
    multipleStatements: true,
    charset: 'utf8mb4',
    timezone: '+00:00',
    
    // Configuraciones de reconexión
    reconnect: true,
    idleTimeout: 300000,
    acquireTimeout: 60000,
    timeout: 60000
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Promisificar las consultas
const promisePool = pool.promise();

/**
 * Ejecutar una consulta SQL
 * @param {string} query - La consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise} - Resultado de la consulta
 */
const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await promisePool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Error ejecutando consulta:', error);
        throw error;
    }
};

/**
 * Ejecutar múltiples consultas en una transacción
 * @param {Array} queries - Array de objetos {query, params}
 * @returns {Promise} - Resultado de las consultas
 */
const executeTransaction = async (queries) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.execute(query, params);
            results.push(result);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Probar la conexión a la base de datos
 * @returns {Promise<boolean>} - True si la conexión es exitosa
 */
const testConnection = async () => {
    try {
        const [rows] = await promisePool.execute('SELECT 1 as connected');
        if (rows[0].connected === 1) {
            console.log('✅ Conexión a MySQL establecida correctamente');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        throw error;
    }
};

/**
 * Obtener estadísticas de la base de datos
 * @returns {Promise<Object>} - Estadísticas de la BD
 */
const getDatabaseStats = async () => {
    try {
        const queries = [
            'SELECT COUNT(*) as total_usuarios FROM usuarios WHERE activo = 1',
            'SELECT COUNT(*) as total_productos FROM productos WHERE activo = 1',
            'SELECT COUNT(*) as total_pedidos FROM pedidos',
            'SELECT COUNT(*) as total_pagos FROM pagos',
            'SELECT COUNT(*) as total_categorias FROM categorias WHERE activo = 1',
            'SELECT COUNT(*) as total_marcas FROM marcas WHERE activo = 1'
        ];

        const results = await Promise.all(
            queries.map(query => executeQuery(query))
        );

        return {
            usuarios: results[0][0].total_usuarios,
            productos: results[1][0].total_productos,
            pedidos: results[2][0].total_pedidos,
            pagos: results[3][0].total_pagos,
            categorias: results[4][0].total_categorias,
            marcas: results[5][0].total_marcas
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return null;
    }
};

/**
 * Cerrar todas las conexiones del pool
 */
const closePool = () => {
    return new Promise((resolve) => {
        pool.end(() => {
            console.log('🔒 Pool de conexiones MySQL cerrado');
            resolve();
        });
    });
};

// Manejar el cierre graceful de la aplicación
process.on('SIGINT', async () => {
    console.log('🛑 Cerrando conexiones de base de datos...');
    await closePool();
    process.exit(0);
});

module.exports = {
    pool,
    promisePool,
    executeQuery,
    executeTransaction,
    testConnection,
    getDatabaseStats,
    closePool
};