require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para detectar domínio
app.use((req, res, next) => {
  const host = req.headers.host || '';
  req.isAppDomain = host.includes('app.');
  req.isDomain = host.includes('nfdas.com.br');
  console.log(`[NFDas] Host: ${host}, isAppDomain: ${req.isAppDomain}`);
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Banco de Dados
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'u856557853_manager',
  password: process.env.DB_PASSWORD || 'Root@2027',
  database: process.env.DB_NAME || 'u856557853_db_nfdas',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('[NFDas] Configuração do Banco de Dados:');
console.log(`  - Host: ${DB_CONFIG.host}`);
console.log(`  - User: ${DB_CONFIG.user}`);
console.log(`  - Database: ${DB_CONFIG.database}`);

const pool = mysql.createPool(DB_CONFIG);

// Exportar pool para uso em rotas
global.db = pool;

// Configuração da API Hostinger
const hostingerAPI = axios.create({
  baseURL: process.env.HOSTINGER_API_URL || 'https://api.hostinger.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.HOSTINGER_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ============================================
// IMPORTAR ROTAS
// ============================================
const authRoutes = require('./htpublic_html/routes/auth');
const companiesRoutes = require('./htpublic_html/routes/companies');
const certificatesRoutes = require('./htpublic_html/routes/certificates');

// ============================================
// ROTAS DE TESTE
// ============================================

// Rota raiz - diferenciada por domínio
app.get('/', (req, res) => {
  if (req.isAppDomain) {
    // Para app.nfdas.com.br - retorna JSON indicando que é a app
    return res.json({
      status: 'OK',
      message: 'Bem-vindo ao NFDas App',
      version: '1.0.0',
      type: 'app',
      endpoints: {
        auth: '/api/auth',
        companies: '/api/companies',
        certificates: '/api/certificates'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Para nfdas.com.br - retorna JSON indicando que é a landing page
  res.json({
    status: 'OK',
    message: 'Bem-vindo ao Sistema NFDas',
    version: '1.0.0',
    type: 'landing',
    endpoints: {
      health: '/health',
      debug: '/api/debug',
      auth: '/api/auth',
      companies: '/api/companies',
      certificates: '/api/certificates',
      dbTest: '/api/db-test',
      initDatabase: '/api/init-database',
      hostingerTest: '/api/hostinger-test'
    },
    timestamp: new Date().toISOString()
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor NFDas está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Debug - Verificar variáveis de ambiente
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint',
    environment: process.env.NODE_ENV || 'development',
    config: {
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      database: DB_CONFIG.database,
      port: DB_CONFIG.port
    },
    env_vars: {
      DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
      DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
      DB_NAME: process.env.DB_NAME ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV ? 'SET' : 'NOT SET'
    }
  });
});

// Teste de Conexão com Banco de Dados
app.get('/api/db-test', async (req, res) => {
  let connection;
  try {
    console.log('[NFDas] Testando conexão com banco de dados...');
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as test');
    
    res.json({
      status: 'OK',
      message: 'Conexão com banco de dados bem-sucedida',
      result: rows,
      config: {
        host: DB_CONFIG.host,
        database: DB_CONFIG.database
      }
    });
  } catch (error) {
    console.error('[NFDas] Erro ao conectar:', error.message);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro ao conectar com banco de dados',
      error: error.message,
      config: {
        host: DB_CONFIG.host,
        user: DB_CONFIG.user,
        database: DB_CONFIG.database,
        port: DB_CONFIG.port
      }
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Teste de Conexão com API Hostinger
app.get('/api/hostinger-test', async (req, res) => {
  try {
    const response = await hostingerAPI.get('/orders');
    
    res.json({
      status: 'OK',
      message: 'Conexão com API Hostinger bem-sucedida',
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro ao conectar com API Hostinger',
      error: error.message,
      details: error.response?.data || 'Sem detalhes'
    });
  }
});

// ============================================
// USAR ROTAS
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/certificates', certificatesRoutes);

// ============================================
// ROTAS DE BANCO DE DADOS
// ============================================

// Criar tabelas iniciais
app.post('/api/init-database', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Tabela de Usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela de Empresas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Tabela de Certificados
    await connection.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        certificate_data LONGBLOB NOT NULL,
        certificate_password_encrypted VARCHAR(255),
        expiration_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    
    // Tabela de Notas Fiscais (Cache)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        invoice_key VARCHAR(50) UNIQUE NOT NULL,
        invoice_type ENUM('nfe', 'nfse') NOT NULL,
        emitter_cnpj VARCHAR(20),
        receiver_cnpj VARCHAR(20),
        invoice_date DATE,
        total_amount DECIMAL(15, 2),
        status VARCHAR(50),
        raw_data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    
    // Tabela de Assinaturas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        plan VARCHAR(50) NOT NULL,
        status ENUM('active', 'inactive', 'cancelled') DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    connection.release();
    
    res.json({
      status: 'OK',
      message: 'Banco de dados inicializado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro ao inicializar banco de dados',
      error: error.message
    });
  }
});

// ============================================
// ROTAS DE HOSTINGER API
// ============================================

// Listar sites/domínios
app.get('/api/hostinger/websites', async (req, res) => {
  try {
    const response = await hostingerAPI.get('/websites');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro ao listar websites',
      error: error.message
    });
  }
});

// Listar bancos de dados
app.get('/api/hostinger/databases', async (req, res) => {
  try {
    const response = await hostingerAPI.get('/databases');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro ao listar bancos de dados',
      error: error.message
    });
  }
});

// ============================================
// CRIAR DIRETÓRIOS NECESSÁRIOS
// ============================================

const uploadsDir = path.join(__dirname, 'uploads/certificates');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[NFDas] Diretório de uploads criado:', uploadsDir);
}

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   Sistema NFDas - Servidor Iniciado    ║
  ║   Porta: ${PORT}                            ║
  ║   Ambiente: ${process.env.NODE_ENV || 'development'}          ║
  ╚════════════════════════════════════════╝
  `);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
