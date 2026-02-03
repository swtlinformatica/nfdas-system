// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { validateEmail, validatePassword } = require('../utils/validators');

// Registro de novo usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validações
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
    }

    // Verificar se usuário já existe
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir novo usuário
    const [result] = await db.query(
      'INSERT INTO users (email, password, name, status) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, 'active']
    );

    // Gerar JWT
    const token = jwt.sign(
      { user_id: result.insertId, email },
      process.env.JWT_SECRET || 'seu_secret_aqui',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'Usuário registrado com sucesso',
      user: {
        id: result.insertId,
        email,
        name,
        status: 'active'
      },
      token
    });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = users[0];

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verificar se usuário está ativo
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Usuário inativo' });
    }

    // Gerar JWT
    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      process.env.JWT_SECRET || 'seu_secret_aqui',
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      },
      token
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Obter dados do usuário autenticado
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email, name, status FROM users WHERE id = ?', [req.user.user_id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      status: 'success',
      user: users[0]
    });

  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ error: 'Erro ao obter dados do usuário' });
  }
});

module.exports = router;
