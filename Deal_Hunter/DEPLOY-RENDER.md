# Guia de Deploy 100% na Nuvem (Render) — Deal Hunter Pro

Este guia explica como hospedar o backend do **Deal Hunter Pro** na nuvem do [Render](https://render.com), eliminando completamente a necessidade de rodar scripts `.bat` ou manter o computador ligado.

---

## 1. Estrutura Criada para a Nuvem

| Arquivo / Componente | Função |
| :--- | :--- |
| `render.yaml` | Blueprint para criar automaticamente o Web Service Node.js e o banco PostgreSQL no Render. |
| `Deal_Hunter/server/src/database/db.js` | Camada universal de banco: conecta ao PostgreSQL quando `DATABASE_URL` existir (com fallback SQLite para testes locais). |
| `Deal_Hunter/server/src/database/schema.pg.sql` | Esquema relacional otimizado para PostgreSQL no Render. |
| `Deal_Hunter/server/src/index.js` | Servidor com porta dinâmica (`PORT`), host `0.0.0.0`, CORS para extensões (`chrome-extension://*`) e rota de health-check `/health`. |
| `Deal_Hunter/extension/config.js` | Configuração central da extensão para apontar para a URL do Render em produção. |
| `Deal_Hunter/extension/manifest.json` | Permissões de rede liberadas para `https://*.onrender.com/*`. |

---

## 2. Como Fazer o Deploy no Render

### Opção A: Usando o Blueprint Automático (Recomendado)

1. Faça commit e push do repositório para o seu **GitHub** ou **GitLab**.
2. Acesse o painel do [Render](https://dashboard.render.com/) e clique em **New +** > **Blueprint**.
3. Conecte o repositório do Deal Hunter.
4. O Render detectará automaticamente o arquivo `render.yaml`:
   - Criará um **PostgreSQL gerenciado** (`deal-hunter-db`).
   - Criará um **Web Service Node.js** (`deal-hunter-server`).
   - Conectará a variável `DATABASE_URL` automaticamente entre eles.
5. Clique em **Apply**. O deploy começará imediatamente!

---

### Opção B: Criação Manual no Painel do Render

Se preferir criar os recursos individualmente:

#### 1. Criar o Banco PostgreSQL:
1. No Render, clique em **New +** > **PostgreSQL**.
2. Nome: `deal-hunter-db`
3. Database: `dealhunter`
4. User: `dealhunter`
5. Plano: **Free** (ou **Starter**).
6. Copie a **Internal Database URL** gerada.

#### 2. Criar o Web Service:
1. Clique em **New +** > **Web Service**.
2. Conecte seu repositório Git.
3. Configure os campos:
   - **Name**: `deal-hunter-server`
   - **Root Directory**: `Deal_Hunter/server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Na seção **Environment Variables**, adicione:
   - `NODE_VERSION`: `22.13.0`
   - `HOST`: `0.0.0.0`
   - `DATABASE_URL`: *(Cole a Internal Database URL do PostgreSQL criado)*
   - `API_TOKEN`: *(Defina um token de sua preferência ou deixe o backend gerar)*
   - `WEB_AUTH_URL`: `https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app`
5. Clique em **Deploy Web Service**.

---

## 3. Conectando a Extensão à Nova API na Nuvem

Após o deploy no Render terminar, seu serviço terá uma URL pública, como:
`https://deal-hunter-server.onrender.com`

### 1. Atualizar o arquivo de configuração da extensão:
Abra `Deal_Hunter/extension/config.js` e confirme a sua URL do Render:
```javascript
const CONFIG = {
  PRODUCTION_API_URL: 'https://deal-hunter-server.onrender.com', // Coloque sua URL aqui
  ENVIRONMENT: 'production',
  ...
};
```

### 2. Recarregar a extensão no Chrome:
1. Acesse `chrome://extensions/` no seu navegador.
2. Ative o **Modo do desenvolvedor** (canto superior direito).
3. Localize o **Deal Hunter Pro** e clique no ícone de **Recarregar** (ícone circular).

### 3. Fazer Login:
1. Clique no ícone do Deal Hunter no navegador para abrir o popup.
2. O popup indicará **Nuvem Conectada**.
3. Clique em **Fazer Login** para autenticar sua conta Pro. Uma vez autenticado, a sessão fica gravada permanentemente no Chrome (`chrome.storage.local`), sem precisar de scripts locais!
