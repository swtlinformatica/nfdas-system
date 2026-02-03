// routes/certificates.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { validateCertificate } = require('../utils/certificateValidator');

// Configurar multer para upload
const upload = multer({
  dest: path.join(__dirname, '../uploads/certificates'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/x-pkcs12' || file.originalname.endsWith('.pfx')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .pfx são permitidos'));
    }
  }
});

// Listar certificados da empresa
router.get('/company/:companyId', auth, async (req, res) => {
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

    // Listar certificados
    const [certificates] = await db.query(
      'SELECT id, company_id, issuer, valid_from, valid_until, status, created_at FROM certificates WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    res.json({
      status: 'success',
      total: certificates.length,
      certificates
    });

  } catch (error) {
    console.error('Erro ao listar certificados:', error);
    res.status(500).json({ error: 'Erro ao listar certificados' });
  }
});

// Upload de certificado
router.post('/upload/:companyId', auth, upload.single('certificate'), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { password } = req.body;
    const userId = req.user.user_id;

    // Validações
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de certificado é obrigatório' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Senha do certificado é obrigatória' });
    }

    // Verificar se empresa pertence ao usuário
    const [companies] = await db.query(
      'SELECT id FROM companies WHERE id = ? AND user_id = ?',
      [companyId, userId]
    );

    if (companies.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Validar certificado
    const certData = await validateCertificate(req.file.path, password);
    
    if (!certData.valid) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: certData.error });
    }

    // Salvar caminho do certificado
    const certificatePath = path.join('uploads/certificates', req.file.filename);

    // Inserir certificado no banco de dados
    const [result] = await db.query(
      'INSERT INTO certificates (company_id, file_path, password_hash, issuer, valid_from, valid_until, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        companyId,
        certificatePath,
        require('bcryptjs').hashSync(password, 10),
        certData.issuer,
        certData.validFrom,
        certData.validUntil,
        'active'
      ]
    );

    res.status(201).json({
      status: 'success',
      message: 'Certificado enviado com sucesso',
      certificate: {
        id: result.insertId,
        company_id: companyId,
        issuer: certData.issuer,
        valid_from: certData.validFrom,
        valid_until: certData.validUntil,
        status: 'active'
      }
    });

  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erro ao fazer upload do certificado:', error);
    res.status(500).json({ error: error.message || 'Erro ao fazer upload do certificado' });
  }
});

// Deletar certificado
router.delete('/:certificateId', auth, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.user_id;

    // Verificar se certificado pertence a empresa do usuário
    const [certificates] = await db.query(
      `SELECT c.* FROM certificates c
       JOIN companies co ON c.company_id = co.id
       WHERE c.id = ? AND co.user_id = ?`,
      [certificateId, userId]
    );

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }

    const certificate = certificates[0];

    // Deletar arquivo
    const filePath = path.join(__dirname, '../', certificate.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deletar do banco de dados
    await db.query('DELETE FROM certificates WHERE id = ?', [certificateId]);

    res.json({
      status: 'success',
      message: 'Certificado deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar certificado:', error);
    res.status(500).json({ error: 'Erro ao deletar certificado' });
  }
});

module.exports = router;
