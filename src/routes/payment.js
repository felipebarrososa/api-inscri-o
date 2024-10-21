const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { pool } = require('../db/dbConnection');
const multer = require('multer');
const path = require('path');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde os comprovantes serão armazenados
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname); // Gera um nome único para o arquivo
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// Rota para registrar o pagamento
router.post('/', upload.single('comprovante_pagamento'), async (req, res) => {
    const { valor_pago, cidade } = req.body;
    const comprovante_pagamento = req.file ? req.file.filename : null;

    // Verifica se o comprovante foi carregado
    if (!comprovante_pagamento) {
        logger.warn('Comprovante de pagamento não fornecido.');
        return res.status(400).json({ message: 'Comprovante de pagamento é obrigatório.' });
    }

    try {
        // Verifica se a cidade existe
        const cityExists = await pool.query(
            'SELECT * FROM localidades WHERE nome = $1',
            [cidade]
        );

        if (cityExists.rows.length === 0) {
            logger.warn(`Localidade "${cidade}" não encontrada.`);
            return res.status(404).json({ message: 'Localidade não encontrada.' });
        } else {
            console.log(`Localidade encontrada: ${cityExists.rows[0]}`);
        }

        // Verifica se a inscrição existe
        const enrollmentExists = await pool.query(
            'SELECT ig.* FROM localidades l INNER JOIN inscricao_geral ig ON l.id = ig.localidade_id WHERE l.nome = $1',
            [cidade]
        );

        if (enrollmentExists.rows.length === 0) {
            logger.warn(`Inscrição não encontrada com cidade: ${cidade}`);
            return res.status(404).json({ message: 'Inscrição não encontrada.' });
        }

        // Obtém o ID da localidade associada à inscrição
        const localidade_id = enrollmentExists.rows[0].localidade_id; 
        const inscricao_id = enrollmentExists.rows[0].id; 

        // Insere o pagamento
        const result = await pool.query(
            'INSERT INTO Pagamento (valor_pago, comprovante_imagem, inscricao_id) VALUES ($1, $2, $3) RETURNING id',
            [valor_pago, comprovante_pagamento, inscricao_id]
        );

        const paymentId = result.rows[0].id;
        logger.info(`Pagamento registrado com sucesso, ID: ${paymentId}`);

        // Registra a movimentação financeira
        await pool.query(
            'INSERT INTO Movimentacao_Financeira (tipo, descricao, valor) VALUES ($1, $2, $3)',
            ['Entrada', `Pagamento referente à inscrição ID: ${inscricao_id}`, valor_pago]
        );

        // Atualiza o saldo da localidade, subtraindo o valor pago
        await pool.query(
            'UPDATE localidades SET saldo_devedor = saldo_devedor - $1 WHERE id = $2',
            [valor_pago, localidade_id]
        );

        logger.info(`Saldo da localidade atualizado após o pagamento, nova entrada: ${valor_pago}`);

        return res.status(201).json({ message: 'Pagamento registrado com sucesso!', paymentId });
        
    } catch (err) {
        logger.error(`Erro ao registrar pagamento: ${err}`);
        return res.status(500).json({ error: 'Erro ao registrar pagamento.' });
    }
});

module.exports = router;