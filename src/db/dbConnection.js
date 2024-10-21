const { Pool } = require('pg');

// Dados para conexão ao banco de dados
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    ssl:process.env.POSTGRES_URL_NO_SSL,
});

let isConnected = false; // Variável de controle

const checkDatabaseConnection = async () => {
    if (isConnected) return; // Retorna se já estiver conectado

    try {
        await pool.connect(); // Tenta conectar
        isConnected = true; // Marca como conectado
        console.info('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1); // Encerra se não conseguir conectar
    }
};


module.exports = { pool, checkDatabaseConnection };
