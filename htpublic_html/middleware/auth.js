// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Obter token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Extrair token (formato: "Bearer token")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_aqui');
    
    // Adicionar dados do usuário ao request
    req.user = decoded;
    
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = auth;
