const express = require('express');
const router = express.Router();
const { pool } = require('../db/dbConnection');
const { body, validationResult } = require("express-validator");

// Rota para registrar hospedagem
router.post('/', async (req, res) => {
    const errors = validationResult(req);
	if (!errors.isEmpty()) {
		console.error("Validation errors:", errors.array());
		return res.status(400).json({ errors: errors.array() });
	}

    const { id_inscricao, nomes_hospedagem } = req.body;

    // Verifica se os dados foram fornecidos
    if (!id_inscricao || !nomes_hospedagem || nomes_hospedagem.length === 0) {
        console.warn('ID de inscrição ou lista de nomes de hospedagem não fornecidos.');
        return res.status(400).json({ message: 'ID de inscrição e lista de nomes de hospedagem são obrigatórios.' });
    }

    try {
        // Verifica se a inscrição existe
        const inscricaoExists = await pool.query('SELECT * FROM inscricao_geral WHERE id = $1', [id_inscricao]);
        if (inscricaoExists.rows.length === 0) {
            console.warn(`Inscrição não encontrada com ID: ${id_inscricao}`);
            return res.status(404).json({ message: 'Inscrição não encontrada.' });
        }

        // Insere os nomes na tabela de hospedagem
        const hospedagemPromises = nomes_hospedagem.map(async (nome) => {
            return await pool.query(
                'INSERT INTO hospedagem (id_inscricao, nome) VALUES ($1, $2)',
                [id_inscricao, nome]
            );
        });

        // Aguarda todas as inserções serem concluídas
        await Promise.all(hospedagemPromises);

        console.info(`Hospedagem registrada com sucesso para a inscrição ID: ${id_inscricao}`);
        return res.status(201).json({ message: 'Hospedagem registrada com sucesso!' });
    } catch (err) {
        console.error(`Erro ao registrar hospedagem: ${err}`);
        return res.status(500).json({ error: 'Erro ao registrar hospedagem.' });
    }
});

module.exports = router;
