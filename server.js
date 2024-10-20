require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger.js')
const app = express();
const cors = require('cors');
const { checkDatabaseConnection } = require('./src/db/dbConnection.js');

//Inportações de Rotas
const locationsRoutes = require('./src/routes/locations.js')
const register = require('./src/routes/register.js')

app.use(express.json());

//conexão com o banco de dados
checkDatabaseConnection();

app.use(cors());

app.use((req, res, next) => {
    logger.info(`Request: ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    logger.info('Rota de boas-vindas acessada');
    res.send('Bem-vindo à minha API, teste LOCAL!!!')
});

app.use('/localidades', locationsRoutes)
app.use('/registro', register)

app

const port = process.env.PORT
console.log(port)
app.listen(port, ()=>{
    logger.info(`API iniciada com sucesso`)
    console.log(`API rodando em http://localhost:${port}`)
});