const logger = require('../../utils/logger');
const { Pool } = require('pg');

// Dados para conexão ao banco de dados
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

let isConnected = false; // Variável de controle

const checkDatabaseConnection = async () => {
    if (isConnected) return; // Retorna se já estiver conectado

    try {
        await pool.connect(); // Tenta conectar
        isConnected = true; // Marca como conectado
        logger.info('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (err) {
        logger.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1); // Encerra se não conseguir conectar
    }
};


module.exports = { pool, checkDatabaseConnection };
