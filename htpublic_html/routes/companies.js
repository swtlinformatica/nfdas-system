// routes/companies.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const { validateCNPJ } = require('../utils/validators');

// Listar empresas do usuário
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [companies] = await db.query(
      'SELECT id, user_id, name, cnpj, status, created_at FROM companies WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      status: 'success',
      total: companies.length,
      companies
    });

  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro ao listar empresas' });
  }
});

// Obter empresa específica
router.get('/:companyId', auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.user_id;

    const [companies] = await db.query(
      'SELECT id, user_id, name, cnpj, status, created_at FROM companies WHERE id = ? AND user_id = ?',
      [companyId, userId]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json({
      status: 'success',
      company: companies[0]
    });

  } catch (error) {
    console.error('Erro ao obter empresa:', error);
    res.status(500).json({ error: 'Erro ao obter empresa' });
  }
});

// Criar nova empresa
router.post('/', auth, async (req, res) => {
  try {
    const { name, cnpj } = req.body;
    const userId = req.user.user_id;

    // Validações
    if (!name || !cnpj) {
      return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios' });
    }

    if (!validateCNPJ(cnpj)) {
      return res.status(400).json({ error: 'CNPJ inválido' });
    }

    // Verificar se CNPJ já existe para este usuário
    const [existing] = await db.query(
      'SELECT id FROM companies WHERE user_id = ? AND cnpj = ?',
      [userId, cnpj]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Esta empresa já está cadastrada' });
    }

    // Inserir empresa
    const [result] = await db.query(
      'INSERT INTO companies (user_id, name, cnpj, status) VALUES (?, ?, ?, ?)',
      [userId, name, cnpj, 'active']
    );

    res.status(201).json({
      status: 'success',
      message: 'Empresa criada com sucesso',
      company: {
        id: result.insertId,
        user_id: userId,
        name,
        cnpj,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

// Atualizar empresa
router.put('/:companyId', auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name } = req.body;
    const userId = req.user.user_id;

    // Verificar se empresa pertence ao usuário
    const [companies] = await db.query(
      'SELECT id FROM companies WHERE id = ? AND user_id = ?',
      [companyId, userId]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Atualizar
    await db.query(
      'UPDATE companies SET name = ? WHERE id = ?',
      [name, companyId]
    );

    res.json({
      status: 'success',
      message: 'Empresa atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// Deletar empresa
router.delete('/:companyId', auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.user_id;

    // Verificar se empresa pertence ao usuário
    const [companies] = await db.query(
      'SELECT id FROM companies WHERE id = ? AND user_id = ?',
      [companyId, userId]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Deletar
    await db.query('DELETE FROM companies WHERE id = ?', [companyId]);

    res.json({
      status: 'success',
      message: 'Empresa deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ error: 'Erro ao deletar empresa' });
  }
});

module.exports = router;
