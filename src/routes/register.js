const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { pool } = require('../db/dbConnection');

const register = [
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { localidade, nomeResponsavel, totalInscritos, inscritos, servico } = req.body;

        try {
            const cityExist = await pool.query(`SELECT * FROM localidades WHERE nome = $1`, [localidade]);
            const city = cityExist.rows[0];

            if (!city) {
                logger.warn(`Localidade não encontrada: ${localidade}`);
                return res.status(401).json({ message: `Localidade inválida` });
            }

            const enrollment = await pool.query(
                'INSERT INTO inscricao_geral (localidade_id, nome_responsavel, qtd_geral) VALUES ($1, $2, $3) RETURNING id',
                [city.id, nomeResponsavel, totalInscritos]
            );
            const enrollmentId = enrollment.rows[0].id;
            logger.info(`Inscrição geral criada com ID: ${enrollmentId} para a localidade: ${localidade}`);

            const age06masculine = inscritos['0-6'].masculino;
            const age06feminine = inscritos['0-6'].feminino;
            const age710masculine = inscritos['7-10'].masculino;
            const age710feminine = inscritos['7-10'].feminino;
            const age10masculine = inscritos['10+'].masculino;
            const age10feminine = inscritos['10+'].feminino;
            const servicemasculine = servico.masculino;
            const servicefeminine = servico.feminino;

            const deadline = await pool.query(`SELECT * FROM eventos WHERE id = 1`);
            const currentDate = new Date();

            let tipoInscricao;
            if (currentDate > deadline.rows[0].data_limite) {
                logger.warn(`Tentativa de inscrição da localidade ${localidade} após a data limite: ${currentDate}`);
                tipoInscricao = 4;
            } else {
                tipoInscricao = 1;
            }

            // Inserção para a faixa etária 0-6
            if (age06masculine > 0 || age06feminine > 0) {
                const enrollmentAge06 = await pool.query(
                    'INSERT INTO inscricao_0_6(inscricao_geral_id, tipo_inscricao_id, qtd_masculino, qtd_feminino) VALUES ($1, $2, $3, $4)',
                    [enrollmentId, 5, age06masculine, age06feminine]
                );
                logger.info(`Inserção feita na tabela inscricao_0_6 com ID de inscrição: ${enrollmentId}`);
            } else {
                logger.info(`Nenhuma inscrição foi feita para a faixa etária 0-6 (todos os valores são zero).`);
            }

            // Inserção para a faixa etária 7-12
            if (age710masculine > 0 || age710feminine > 0) {
                const enrollmentAge712 = await pool.query(
                    'INSERT INTO inscricao_7_12(inscricao_geral_id, tipo_inscricao_id, qtd_masculino, qtd_feminino) VALUES ($1, $2, $3, $4)',
                    [enrollmentId, 2, age710masculine, age710feminine]
                );
                logger.info(`Inserção feita na tabela inscricao_7_12 com ID de inscrição: ${enrollmentId}`);
            } else {
                logger.info(`Nenhuma inscrição foi feita para a faixa etária 7-12 (todos os valores são zero).`);
            }

            // Inserção para a faixa etária 13+
            if (age10masculine > 0 || age10feminine > 0) {
                const enrollmentAge13 = await pool.query(
                    'INSERT INTO inscricao_13_acima(inscricao_geral_id, tipo_inscricao_id, qtd_masculino, qtd_feminino) VALUES ($1, $2, $3, $4)',
                    [enrollmentId, tipoInscricao, age10masculine, age10feminine]
                );
                logger.info(`Inserção feita na tabela inscricao_13_acima com ID de inscrição: ${enrollmentId}`);
            } else {
                logger.info(`Nenhuma inscrição foi feita para a faixa etária 13+ (todos os valores são zero).`);
            }

            // Inserção para o serviço
            if (servicemasculine > 0 || servicefeminine > 0) {
                const enrollmentService = await pool.query(
                    'INSERT INTO inscricao_servico(inscricao_geral_id, tipo_inscricao_id, qtd_masculino, qtd_feminino) VALUES ($1, $2, $3, $4)',
                    [enrollmentId, 3, servicemasculine, servicefeminine]
                );
                logger.info(`Inserção feita na tabela inscricao_servico com ID de inscrição: ${enrollmentId}`);
            } else {
                logger.info(`Nenhuma inscrição foi feita para o serviço (todos os valores são zero).`);
            }

            return res.status(201).json({ message: 'Inscrição realizada com sucesso!' });

        } catch (err) {
            logger.error(`Erro ao processar a inscrição: ${err}`);
            return res.status(500).json({ error: 'Erro ao processar a inscrição.' });
        }
    }
];


module.exports = register;
