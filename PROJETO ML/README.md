# 🚀 ML Radar — Monitor Cirúrgico de Ofertas & Arbitragem no Mercado Livre

O **ML Radar** é uma aplicação web completa e 100% gratuita desenvolvida para receber alertas de promoção de grandes varejistas (Amazon, KaBuM, Magalu, Shopee, Shein, Pichau, etc.), localizar o anúncio **idêntico** no Mercado Livre (MLB), selecionar o melhor vendedor concorrente (Buy Box ou menor preço qualificado), calcular a viabilidade financeira e o **ROI líquido de revenda**, enriquecer os dados com inteligência artificial via **Google Gemini (AI Studio)** e entregar os resultados em um bot do Telegram e em um dashboard moderno.

---

## 📸 Recursos Principais

- 🎯 **Identidade Cirúrgica em Duas Camadas**: Normalização de títulos (extração de marca, modelo, capacidade de armazenamento, voltagem), cálculo de similaridade com Tokens + Jaccard e desempate com visão computacional.
- 🏆 **Ranking de Vendedores do ML**: Prioridade para produtos de catálogo (Buy Box winner) ou menor preço entre anúncios com vendas comprovadas, boa reputação (verde) e descarte de produtos usados/recondicionados.
- 🧮 **Motor de ROI & Tarifas Reais**: Cálculo exato de comissão do ML (Clássico 12% ou Premium 17%), taxa fixa para vendas abaixo de R$ 79,00, frete grátis obrigatório, custo de embalagem, alíquota de impostos, devoluções e veredito (*Viável*, *Atenção*, *Evitar*).
- 🧠 **Google Gemini AI Studio**: Análise preditiva em JSON estrito com tendência de demanda, melhor época do ano, nível de risco, parecer sobre compradores e nota de 0 a 100 com grounding.
- 📱 **Telegram Bot Notificador**: Envio automático de cards com foto comparativa, métricas de vendas, ROI, lucro líquido e botão inline com link direto para o dashboard.
- 📥 **Duas Formas de Entrada de Alertas**:
  1. **Webhook HTTP**: `POST /api/ingest` com autenticação por header `x-api-key`.
  2. **Leitor MTProto**: Leitor nativo de canais/grupos de ofertas do Telegram via GramJS.
- 🔒 **Segurança & Privacidade Local**: Todas as credenciais são salvas no banco de dados SQLite local (`ml_radar.sqlite`), nunca no código-fonte, com valores sensíveis mascarados na interface web.
- ⚡ **Modo Demonstração Instantâneo**: O sistema já vem com dados de exemplo e funciona imediatamente para testes mesmo sem nenhuma chave de API configurada!

---

## 🛠️ Stack Tecnológica

- **Backend**: Node.js + Express + SQLite nativo de alta velocidade (`better-sqlite3` com WAL mode).
- **Frontend**: React + Vite + Tailwind CSS (Tema Escuro moderno e didático com ícones Lucide).
- **Processamento**: Fila em memória com deduplicação por hash SHA-256 e controle de concorrência.
- **Testes**: Suíte de testes unitários integrada (`node:test`).

---

## 📋 Pré-requisitos

- **Node.js** 20 ou superior instalado.
- **npm** (incluso com o Node.js).
- Navegador web moderno (Chrome, Edge, Firefox, Brave, Safari).

---

## ⚡ Como Rodar o Projeto

Com apenas um comando na raiz do projeto, todas as dependências serão instaladas e tanto o backend quanto o frontend subirão simultaneamente:

```bash
npm install && npm run dev
```

Após iniciar, acesse no seu navegador:
- **Painel Web (Dashboard)**: [http://localhost:5173](http://localhost:5173)
- **API Backend**: [http://localhost:3001](http://localhost:3001)
- **Webhook de Ingestão**: [http://localhost:3001/api/ingest](http://localhost:3001/api/ingest)

---

## 🔑 Como Obter Cada Chave de API Gratuita (Passo a Passo)

### 1. Mercado Livre (OAuth2 & Busca)
1. Acesse o portal de desenvolvedores: [developers.mercadolivre.com.br](https://developers.mercadolivre.com.br/) e faça login com sua conta do Mercado Livre.
2. No menu superior, clique em **Meus Aplicativos** e depois em **Criar nova aplicação**.
3. Preencha os campos:
   - **Nome da Aplicação**: `ML Radar`
   - **Redirect URI**: `http://localhost:3001/api/ml/callback`
   - **Escopos**: Leitura pública e busca.
4. Ao salvar, copie o **App ID** (Client ID) e a **Chave Secreta** (Client Secret).
5. No ML Radar, abra a aba **Configurações**, cole as duas informações e clique no botão **"Conectar Mercado Livre"**. Uma janela de autorização se abrirá para autenticar sua conta.

### 2. Google Gemini (AI Studio Gratuito)
1. Acesse: [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Faça login com qualquer conta Google.
3. Clique em **"Create API key"** (Criar chave de API) e selecione um projeto do Google Cloud (ou crie um novo gratuitamente com 1 clique).
4. Copie a chave gerada (iniciada por `AIzaSy...`).
5. Cole na aba **Configurações > Google Gemini** no ML Radar.

### 3. Telegram Bot Notificador (Saída)
1. No seu Telegram, procure pelo usuário oficial [@BotFather](https://t.me/BotFather).
2. Envie o comando `/newbot` e siga as instruções para definir o nome e username do seu bot.
3. Copie o **Token de Acesso** fornecido (ex: `123456789:ABCdefGhIJK...`).
4. Para descobrir seu **Chat ID** pessoal ou do seu grupo:
   - Envie uma mensagem para o bot [@userinfobot](https://t.me/userinfobot) para ver seu ID numérico.
   - Caso queira receber em um grupo, adicione o seu bot ao grupo e envie uma mensagem qualquer.
5. Cole o token e o Chat ID na seção **Telegram** das Configurações do ML Radar e clique em **"Enviar Mensagem de Teste"**.

### 4. Telegram MTProto (Leitor de Canais - Opcional)
Se desejar escutar diretamente canais de promoções sem webhook:
1. Acesse: [my.telegram.org](https://my.telegram.org) e digite seu número de telefone com DDD.
2. Insira o código de confirmação recebido no seu Telegram.
3. Vá em **"API development tools"**, preencha o formulário e clique em **Save**.
4. Copie o **api_id** e o **api_hash** e cole nas configurações do ML Radar.

---

## 🧪 Testando o Fluxo Completo com `curl`

Você pode simular o envio de um alerta de promoção para o webhook executando o seguinte comando no terminal:

```bash
curl -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: mlradar-secret-key-12345" \
  -d '{
    "nome": "SSD Kingston A400 480GB SATA III 2.5 Polegadas Leitura 500MBs",
    "url": "https://www.amazon.com.br/dp/B079XC5PVV",
    "preco": 139.90,
    "preco_anterior": 219.90,
    "desconto": 36,
    "loja": "Amazon",
    "foto_url": "https://m.media-amazon.com/images/I/71Y0v274Y5L._AC_SL1500_.jpg"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "result": {
    "status": "enqueued",
    "id": "job-177..."
  }
}
```

O alerta entrará instantaneamente na fila, fará o match no Mercado Livre, calculará o ROI, consultará o Gemini e aparecerá no Dashboard Web!

---

## 🤖 Como Alterar seu Bot Atual (Node.js) para Chamar o ML Radar

Se você já possui um bot em Node.js que raspa ou recebe alertas de canais (ex: Telegraf, GramJS, Puppeteer), basta adicionar a função abaixo para despachar cada oferta encontrada para o **ML Radar**:

```javascript
// Exemplo de integração no seu bot atual
async function enviarParaMLRadar(oferta) {
  try {
    const response = await fetch('http://localhost:3001/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'mlradar-secret-key-12345' // Configure a mesma chave definida no painel
      },
      body: JSON.stringify({
        nome: oferta.titulo,                  // Nome do produto
        url: oferta.link,                     // Link de compra
        preco: Number(oferta.precoAtual),     // Preço da promoção (R$)
        preco_anterior: oferta.precoAntigo,   // Preço original antes do desconto (opcional)
        desconto: oferta.porcentagemDesconto, // Desconto % (opcional)
        foto_url: oferta.imagemUrl,           // Foto do item (opcional)
        loja: oferta.nomeLoja                 // Ex: Amazon, Magalu, KaBuM (opcional)
      })
    });

    const data = await response.json();
    console.log('[ML Radar] Oportunidade enviada:', data);
  } catch (error) {
    console.error('[ML Radar] Falha ao enviar alerta:', error.message);
  }
}

// Exemplo de chamada ao receber um alerta:
enviarParaMLRadar({
  titulo: 'Headset Gamer Redragon Zeus X RGB 7.1',
  link: 'https://kabum.com.br/produto/158930/headset-zeus-x',
  precoAtual: 199.90,
  precoAntigo: 349.90,
  porcentagemDesconto: 42,
  nomeLoja: 'KaBuM!',
  imagemUrl: 'https://images.kabum.com.br/produtos/fotos/158930/headset-gamer-redragon-zeus-x.jpg'
});
```

---

## 🧪 Rodando os Testes Unitários

O projeto possui suíte de testes unitários para validar:
1. **Parser de Alertas Tolerante**: Extração de títulos, URLs, preços em formato brasileiro (`R$ 1.299,90` ou `99,90`), descontos `%` e lojas.
2. **Cálculo de ROI & Tarifas**: Aplicação da taxa fixa para vendas menores que R$ 79,00, frete grátis obrigatório, margem líquida e ponto de equilíbrio.
3. **Ranking de Vendedores**: Priorização de catálogo, descarte de produtos usados e filtro por reputação verde.

Para rodar os testes:
```bash
npm test
```

---

## ❓ Solução de Problemas Comuns

### 1. "Porta 3001 ou 5173 já está em uso"
Caso outra aplicação esteja utilizando a porta:
- No Windows PowerShell: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force`
- Ou inicie com outra porta definindo `PORT=3005 npm run dev`.

### 2. "Erro 429 no Google Gemini (Too Many Requests)"
O tier gratuito do Google AI Studio permite até 15 requisições por minuto. O ML Radar já possui uma trava automática nas configurações (`gemini_max_req_per_min: 15`). Caso exceda, o sistema continuará processando os dados financeiros normalmente usando o fallback seguro.

### 3. "Mercado Livre retornou erro 401 Unauthorized"
O ML Radar gerencia a renovação de tokens automaticamente (`refresh_token`). Caso as credenciais da aplicação expirem, basta clicar novamente em **"Conectar Mercado Livre"** na aba **Configurações**.

### 4. "Não possuo chaves no momento. Posso testar?"
Sim! O sistema inicializa automaticamente com o **Modo Demonstração** ativo, permitindo explorar o dashboard, simular cálculos na Calculadora de Margem em tempo real com atalho `Ctrl+S`, rodar buscas manuais e exportar relatórios em CSV.

---

## 📄 Licença

Distribuído sob a licença MIT. Livre para uso pessoal e comercial.
