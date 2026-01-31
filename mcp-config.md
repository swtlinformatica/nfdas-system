# Configuração do MCP Server - Hostinger

Este documento descreve como configurar o MCP Server da Hostinger para que o Manus possa gerenciar sua infraestrutura de forma segura.

## 🔐 O que é MCP Server?

MCP (Model Context Protocol) é um protocolo que permite que ferramentas de IA (como o Manus) se conectem a serviços de forma segura, sem precisar compartilhar credenciais sensíveis diretamente.

## 📋 Pré-requisitos

- Token de API da Hostinger (gerado no hPanel)
- Acesso SSH ao servidor
- Node.js instalado no servidor

## 🚀 Instalação do MCP Server

### Passo 1: Instalar o MCP Server da Hostinger

```bash
npm install -g @hostinger/mcp-server
```

### Passo 2: Configurar o Token

Crie um arquivo de configuração para o MCP Server:

```bash
mkdir -p ~/.mcp/hostinger
nano ~/.mcp/hostinger/config.json
```

Cole o seguinte conteúdo:

```json
{
  "apiToken": "SEU_TOKEN_AQUI",
  "apiUrl": "https://api.hostinger.com/v1",
  "environment": "production"
}
```

**Substitua `SEU_TOKEN_AQUI` pelo seu token de API da Hostinger.**

### Passo 3: Iniciar o MCP Server

```bash
mcp-hostinger start
```

Você deve ver uma mensagem como:

```
✓ MCP Server iniciado na porta 3001
✓ Conectado à API Hostinger
✓ Aguardando conexões...
```

### Passo 4: Verificar a Conexão

Em outro terminal, teste a conexão:

```bash
curl http://localhost:3001/health
```

Você deve receber:

```json
{
  "status": "ok",
  "message": "MCP Server está funcionando"
}
```

## 🔗 Conectar o Manus ao MCP Server

Após configurar o MCP Server, o Manus pode se conectar usando:

```
mcp://localhost:3001
```

## 📊 Operações Disponíveis via MCP

Com o MCP Server configurado, você pode:

- ✅ Listar websites/domínios
- ✅ Listar bancos de dados
- ✅ Criar bancos de dados MySQL
- ✅ Gerenciar usuários de banco de dados
- ✅ Listar backups
- ✅ Gerenciar domínios

## 🔒 Segurança

- O token é armazenado localmente no servidor, nunca é transmitido para terceiros
- O Manus se conecta ao MCP Server via protocolo seguro
- Você pode revogar o token a qualquer momento no hPanel

## 🛠️ Troubleshooting

### MCP Server não inicia

```bash
# Verifique se a porta 3001 está disponível
lsof -i :3001

# Se a porta está em uso, mate o processo
kill -9 <PID>
```

### Erro de autenticação

```bash
# Verifique se o token está correto
cat ~/.mcp/hostinger/config.json

# Gere um novo token no hPanel e atualize o arquivo
```

### Verificar logs

```bash
# Ver logs do MCP Server
journalctl -u mcp-hostinger -f
```

## 📚 Referências

- [Documentação MCP Server Hostinger](https://github.com/hostinger/api-mcp-server)
- [Documentação API Hostinger](https://developers.hostinger.com/)

---

**Configurado com segurança máxima! 🔐**
