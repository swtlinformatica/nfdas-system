# Sistema NFDas - Consultas NF-e e NFS-e

Sistema web para consulta centralizada de Notas Fiscais Eletrônicas (NF-e) e Notas Fiscais de Serviço Eletrônica (NFS-e), facilitando a apuração de impostos para empresas e escritórios contábeis.

## 📋 Pré-requisitos

- Node.js 16+ instalado
- MySQL 5.7+ ou superior
- Conta Hostinger com plano Business
- Token de API da Hostinger gerado

## 🚀 Instalação e Configuração

### Passo 1: Fazer Upload na Hostinger

1. Acesse o painel Hostinger (hPanel)
2. Vá para **Websites** → **Criar Novo Site**
3. Escolha **Web app Node.js**
4. Selecione **Faça upload dos arquivos**
5. Faça upload de todos os arquivos desta pasta
6. Clique em **Continuar**

### Passo 2: Configurar Variáveis de Ambiente

1. Na Hostinger, após o upload, acesse **SSH** ou **Terminal**
2. Navegue até a pasta do projeto
3. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

4. Edite o arquivo `.env` com suas credenciais:
   ```bash
   nano .env
   ```

5. Preencha as variáveis:
   - `HOSTINGER_API_TOKEN`: Seu token de API da Hostinger
   - `DB_HOST`: Host do MySQL (geralmente `localhost`)
   - `DB_USER`: Usuário MySQL
   - `DB_PASSWORD`: Senha MySQL
   - `DB_NAME`: Nome do banco de dados
   - `JWT_SECRET`: Uma chave secreta aleatória

### Passo 3: Instalar Dependências

```bash
npm install
```

### Passo 4: Iniciar o Servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 📡 Endpoints Disponíveis

### Testes de Conexão

- **GET `/health`** - Verifica se o servidor está funcionando
- **GET `/api/db-test`** - Testa conexão com banco de dados
- **GET `/api/hostinger-test`** - Testa conexão com API Hostinger

### Banco de Dados

- **POST `/api/init-database`** - Cria as tabelas iniciais

### Hostinger API

- **GET `/api/hostinger/websites`** - Lista seus sites/domínios
- **GET `/api/hostinger/databases`** - Lista seus bancos de dados

## 🔐 Segurança

### Armazenamento de Token

O token de API da Hostinger é armazenado como variável de ambiente (`.env`). Nunca compartilhe este arquivo ou o token publicamente.

### Certificados Digitais

Os certificados digitais (A1) dos usuários serão armazenados de forma criptografada no banco de dados. Nunca armazene certificados em texto plano.

## 📊 Estrutura do Banco de Dados

O sistema cria automaticamente as seguintes tabelas:

- **users**: Usuários do sistema
- **companies**: Empresas cadastradas
- **certificates**: Certificados digitais armazenados
- **invoices**: Cache de notas fiscais consultadas
- **subscriptions**: Assinaturas dos usuários

## 🔧 Próximos Passos

1. Implementar autenticação de usuários (JWT)
2. Criar endpoints para upload de certificados
3. Integrar com APIs de NF-e (SEFAZ)
4. Integrar com APIs de NFS-e (Portal Nacional)
5. Desenvolver frontend React
6. Implementar sistema de pagamentos

## 📚 Referências

- [Documentação Hostinger API](https://developers.hostinger.com/)
- [Portal NF-e](https://www.nfe.fazenda.gov.br/)
- [Portal NFS-e](https://www.gov.br/nfse/)

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato com o suporte da Hostinger.

---

**Desenvolvido com ❤️ por Manus AI**
