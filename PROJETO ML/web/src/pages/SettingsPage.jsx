import React, { useState, useEffect } from 'react';
import { 
  Save, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Key, 
  Send, 
  Cpu, 
  Sliders, 
  DollarSign, 
  Filter, 
  Server,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { fetchSettings, updateSettings, testConnection, getMLAuthUrl } from '../api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [testingService, setTestingService] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetchSettings();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(key, value) {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value
      }
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await updateSettings(settings);
      if (res.success) {
        setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso no banco de dados SQLite!' });
        setTimeout(() => setSaveMessage(null), 3500);
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message || 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(service) {
    setTestingService(service);
    setTestResults(prev => ({ ...prev, [service]: null }));
    try {
      const res = await testConnection(service);
      setTestResults(prev => ({ ...prev, [service]: res }));
    } catch (err) {
      setTestResults(prev => ({ ...prev, [service]: { success: false, message: err.message } }));
    } finally {
      setTestingService(null);
    }
  }

  async function handleConnectML() {
    try {
      const res = await getMLAuthUrl();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        alert('Configure primeiro o ML Client ID antes de conectar.');
      }
    } catch (err) {
      alert(err.message);
    }
  }

  const toggleAccordion = (fieldKey) => {
    setActiveAccordion(prev => prev === fieldKey ? null : fieldKey);
  };

  // Helper field component with didactic "?" tooltip
  const ConfigField = ({ fieldKey, label, type = 'text', guide }) => {
    const item = settings[fieldKey] || { value: '', isSecret: false };
    const isOpen = activeAccordion === fieldKey;

    return (
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span>{label}</span>
            {item.isSecret && (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                Segredo Mascarado
              </span>
            )}
          </label>

          <button
            type="button"
            onClick={() => toggleAccordion(fieldKey)}
            className={`p-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium ${
              isOpen ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
            title="O que é e onde obter"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Como obter?</span>
          </button>
        </div>

        {/* Accordion / Tooltip Guide */}
        {isOpen && guide && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs space-y-2 text-slate-300 animate-fadeIn">
            <div>
              <span className="font-bold text-cyan-300 block mb-0.5">ℹ️ O que é:</span>
              <p className="text-slate-300 leading-relaxed">{guide.whatIs}</p>
            </div>

            <div>
              <span className="font-bold text-cyan-300 block mb-0.5">📍 Onde obter (Passo a Passo):</span>
              <p className="text-slate-300 leading-relaxed">{guide.whereToGet}</p>
              {guide.link && (
                <a
                  href={guide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:underline mt-1 font-semibold"
                >
                  {guide.linkText || 'Acessar Link Oficial'} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-1 border-t border-slate-800/80 text-[11px]">
              {guide.defaultValue && (
                <span>
                  <strong className="text-slate-400">Padrão sugerido:</strong>{' '}
                  <code className="text-slate-200 bg-slate-800 px-1 rounded">{guide.defaultValue}</code>
                </span>
              )}
              {guide.example && (
                <span>
                  <strong className="text-slate-400">Exemplo:</strong>{' '}
                  <code className="text-slate-200 bg-slate-800 px-1 rounded">{guide.example}</code>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div>
          {type === 'checkbox' ? (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(item.value)}
                onChange={(e) => handleInputChange(fieldKey, e.target.checked ? 1 : 0)}
                className="rounded bg-slate-800 border-slate-700 text-blue-500"
              />
              <span>Ativar esta regra</span>
            </label>
          ) : (
            <input
              type={type}
              value={item.value ?? ''}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              placeholder={guide?.example || ''}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white focus:outline-none"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-xl font-black text-white">Painel de Configurações Didático</h1>
          <p className="text-xs text-slate-400 mt-1">
            Todas as chaves e regras são salvas localmente no SQLite. Nenhuma variável sensível fica no código.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: MERCADO LIVRE */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">1. Mercado Livre (OAuth2 & Busca Cirúrgica)</h2>
              <p className="text-xs text-slate-400">Conecte seu próprio aplicativo gratuito de desenvolvedor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTest('mercadolivre')}
              disabled={testingService === 'mercadolivre'}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
            >
              {testingService === 'mercadolivre' ? 'Testando...' : 'Testar Conexão'}
            </button>
            <button
              onClick={handleConnectML}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              Conectar Mercado Livre
            </button>
          </div>
        </div>

        {testResults.mercadolivre && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            testResults.mercadolivre.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <span>{testResults.mercadolivre.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField
            fieldKey="ml_client_id"
            label="App Client ID (App ID)"
            guide={{
              whatIs: 'Identificador único da sua aplicação criada no portal de desenvolvedores do Mercado Livre.',
              whereToGet: 'Acesse o portal de desenvolvedores do ML, crie uma aplicação gratuita (nome: ML Radar, Redirect URI: http://localhost:3001/api/ml/callback) e copie o "App ID".',
              link: 'https://developers.mercadolivre.com.br/apps/home',
              linkText: 'Abrir Mercado Livre Developers',
              example: '1234567890123456'
            }}
          />

          <ConfigField
            fieldKey="ml_client_secret"
            label="Client Secret (Chave Secreta)"
            guide={{
              whatIs: 'Chave secreta privada usada para trocar o código OAuth por tokens de acesso.',
              whereToGet: 'Na mesma página da sua aplicação em developers.mercadolivre.com.br, clique em "Chave Secreta" para gerar ou copiar.',
              link: 'https://developers.mercadolivre.com.br/apps/home',
              linkText: 'Ver Chave Secreta',
              example: 'aB3dE5fG7hI9jK1lM3nO5pQ7rS9'
            }}
          />

          <ConfigField
            fieldKey="ml_redirect_uri"
            label="Redirect URI Local"
            guide={{
              whatIs: 'URL de retorno configurada no portal do ML para receber o código OAuth após o login.',
              whereToGet: 'Deve ser exatamente a mesma URL configurada no portal developers.mercadolivre.com.br.',
              defaultValue: 'http://localhost:3001/api/ml/callback',
              example: 'http://localhost:3001/api/ml/callback'
            }}
          />
        </div>
      </section>

      {/* SECTION 2: TELEGRAM ENTRADA E SAÍDA */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">2. Telegram (Entrada MTProto/Webhook & Bot de Saída)</h2>
              <p className="text-xs text-slate-400">Leitor de canais de promoção e envio de cards com lucro e ROI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTest('telegram_out')}
              disabled={testingService === 'telegram_out'}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
            >
              {testingService === 'telegram_out' ? 'Testando...' : 'Testar Bot de Saída'}
            </button>
          </div>
        </div>

        {testResults.telegram_out && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            testResults.telegram_out.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <span>{testResults.telegram_out.message || 'Teste realizado'}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField
            fieldKey="telegram_bot_token"
            label="Token do Bot de Saída (Telegram)"
            guide={{
              whatIs: 'Token fornecido pelo @BotFather para enviar alertas automáticos para seu grupo ou chat privado.',
              whereToGet: 'Abra o Telegram, procure pelo usuário @BotFather oficial, envie /newbot, escolha o nome e copie o token gerado.',
              link: 'https://t.me/BotFather',
              linkText: 'Abrir @BotFather no Telegram',
              example: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'
            }}
          />

          <ConfigField
            fieldKey="telegram_out_chat_id"
            label="Chat ID de Notificações"
            guide={{
              whatIs: 'ID numérico do chat, grupo ou canal que receberá as mensagens do bot.',
              whereToGet: 'Inicie uma conversa com @userinfobot no Telegram para descobrir seu ID, ou adicione seu bot ao seu grupo e consulte os updates.',
              link: 'https://t.me/userinfobot',
              linkText: 'Consultar ID com @userinfobot',
              example: '-1001234567890 ou 987654321'
            }}
          />

          <ConfigField
            fieldKey="webhook_api_key"
            label="Chave Secreta do Webhook (x-api-key)"
            guide={{
              whatIs: 'Chave de segurança esperada no header x-api-key para o endpoint POST /api/ingest.',
              whereToGet: 'Defina qualquer senha ou token forte de sua preferência.',
              defaultValue: 'mlradar-secret-key-12345',
              example: 'minha_chave_super_segura_123'
            }}
          />

          <ConfigField
            fieldKey="telegram_in_channel"
            label="Canal / Grupo Monitorado (MTProto)"
            guide={{
              whatIs: 'Username do canal ou grupo público de promoções a ser escutado (modo MTProto).',
              whereToGet: 'Digite o username público do canal (ex: @promocoes_exemplo).',
              example: '@promocoes_exemplo'
            }}
          />

          <ConfigField
            fieldKey="telegram_api_id"
            label="Telegram API ID (my.telegram.org)"
            guide={{
              whatIs: 'ID gratuito de aplicativo Telegram para usar a biblioteca GramJS (MTProto).',
              whereToGet: 'Acesse my.telegram.org com seu telefone, vá em "API development tools" e crie uma app gratuita.',
              link: 'https://my.telegram.org',
              linkText: 'Acessar my.telegram.org',
              example: '24194012'
            }}
          />

          <ConfigField
            fieldKey="telegram_api_hash"
            label="Telegram API Hash (my.telegram.org)"
            guide={{
              whatIs: 'Hash correspondente ao seu API ID no my.telegram.org.',
              whereToGet: 'Copiado da mesma tela de API development tools em my.telegram.org.',
              link: 'https://my.telegram.org',
              example: 'a1b2c3d4e5f67890abcdef1234567890'
            }}
          />
        </div>
      </section>

      {/* SECTION 3: GOOGLE GEMINI */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">3. Google Gemini (AI Studio Gratuito)</h2>
              <p className="text-xs text-slate-400">Análise de risco, demanda, sazonalidade e desempate com visão</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTest('gemini')}
              disabled={testingService === 'gemini'}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
            >
              {testingService === 'gemini' ? 'Testando...' : 'Testar Conexão Gemini'}
            </button>
          </div>
        </div>

        {testResults.gemini && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            testResults.gemini.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <span>{testResults.gemini.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField
            fieldKey="gemini_api_key"
            label="API Key do Google AI Studio"
            guide={{
              whatIs: 'Chave gratuita para acessar a API oficial do Google Gemini sem custos.',
              whereToGet: 'Acesse o Google AI Studio, faça login com sua conta Google e clique no botão "Get API key" para criar sua chave gratuita em segundos.',
              link: 'https://aistudio.google.com/apikey',
              linkText: 'Criar chave no Google AI Studio (Grátis)',
              example: 'AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxx'
            }}
          />

          <ConfigField
            fieldKey="gemini_model"
            label="Modelo Gemini"
            guide={{
              whatIs: 'Nome do modelo de linguagem a ser invocado.',
              whereToGet: 'Padrão recomendado: gemini-2.5-flash ou gemini-1.5-flash (ambos gratuitos com alta velocidade).',
              defaultValue: 'gemini-2.5-flash',
              example: 'gemini-2.5-flash'
            }}
          />

          <ConfigField
            fieldKey="gemini_max_req_per_min"
            label="Limite de Requisições / Minuto"
            guide={{
              whatIs: 'Trava interna para respeitar o limite gratuito do AI Studio e evitar erros 429.',
              defaultValue: '15',
              example: '15'
            }}
          />
        </div>
      </section>

      {/* SECTION 4: REGRAS DE BUSCA E IDENTIDADE */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">4. Regras de Busca Cirúrgica & Vendedores</h2>
            <p className="text-xs text-slate-400">Critérios para descartar anúncios suspeitos e escolher o vencedor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField
            fieldKey="min_sold_quantity"
            label="Mínimo de Vendas Concluídas do Anúncio"
            type="number"
            guide={{
              whatIs: 'Descarta anúncios novos ou sem histórico com menos vendas que este valor.',
              defaultValue: '10',
              example: '10'
            }}
          />

          <ConfigField
            fieldKey="min_identity_score"
            label="Confiança Mínima de Identidade (0 a 100)"
            type="number"
            guide={{
              whatIs: 'Nota mínima de similaridade de título e especificações para aceitar o anúncio do ML.',
              defaultValue: '70',
              example: '70'
            }}
          />

          <ConfigField
            fieldKey="ignore_used"
            label="Ignorar Anúncios Usados / Recondicionados"
            type="checkbox"
            guide={{
              whatIs: 'Descarta automaticamente itens com condition != "new".',
              defaultValue: 'Ativado (1)'
            }}
          />
        </div>
      </section>

      {/* SECTION 5: FINANCEIRO */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">5. Parâmetros Financeiros & Tarifas do Mercado Livre</h2>
            <p className="text-xs text-slate-400">Comissões, impostos, embalagem e margens alvo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ConfigField
            fieldKey="desired_margin"
            label="Margem de Lucro Alvo (%)"
            type="number"
            guide={{
              whatIs: 'Margem percentual desejada para classificar uma oportunidade como "Viável".',
              defaultValue: '20',
              example: '20'
            }}
          />

          <ConfigField
            fieldKey="min_roi_alert"
            label="ROI Mínimo para Disparar Alerta no Telegram (%)"
            type="number"
            guide={{
              whatIs: 'O bot de saída só enviará mensagens para oportunidades com ROI maior ou igual a este valor.',
              defaultValue: '25',
              example: '25'
            }}
          />

          <ConfigField
            fieldKey="tax_percent"
            label="Alíquota de Imposto Estimada (%)"
            type="number"
            guide={{
              whatIs: 'Percentual de imposto sobre o faturamento (ex: Simples Nacional 4% a 8%).',
              defaultValue: '6',
              example: '6'
            }}
          />

          <ConfigField
            fieldKey="packaging_cost"
            label="Custo Médio de Embalagem (R$)"
            type="number"
            guide={{
              whatIs: 'Custo de caixa de papelão, fita adesiva, etiqueta térmica e plástico bolha.',
              defaultValue: '3.50',
              example: '3.50'
            }}
          />

          <ConfigField
            fieldKey="fee_classico_percent"
            label="Comissão ML Anúncio Clássico (%)"
            type="number"
            guide={{
              whatIs: 'Taxa percentual cobrada pelo ML para modalidade Clássica.',
              defaultValue: '12.0',
              example: '12.0'
            }}
          />

          <ConfigField
            fieldKey="fee_premium_percent"
            label="Comissão ML Anúncio Premium (%)"
            type="number"
            guide={{
              whatIs: 'Taxa percentual cobrada pelo ML para modalidade Premium com parcelamento sem juros.',
              defaultValue: '17.0',
              example: '17.0'
            }}
          />

          <ConfigField
            fieldKey="fixed_fee_under_79"
            label="Taxa Fixa para Vendas &lt; R$ 79 (R$)"
            type="number"
            guide={{
              whatIs: 'Tarifa fixa cobrada pelo ML por unidade vendida em anúncios abaixo de R$ 79,00.',
              defaultValue: '6.00',
              example: '6.00'
            }}
          />

          <ConfigField
            fieldKey="default_shipping_cost"
            label="Custo de Frete Médio Estimado (R$)"
            type="number"
            guide={{
              whatIs: 'Valor de frete padrão aplicado em produtos >= R$ 79 quando o ML exige frete grátis.',
              defaultValue: '24.90',
              example: '24.90'
            }}
          />
        </div>
      </section>

      {/* SECTION 6: FILTROS */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">6. Filtros de Exclusão & Bloqueios</h2>
            <p className="text-xs text-slate-400">Evite produtos com defeito, réplicas ou fora da faixa de preço</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField
            fieldKey="excluded_keywords"
            label="Palavras-chave Bloqueadas (separadas por vírgula)"
            guide={{
              whatIs: 'Alertas que contiverem qualquer uma destas palavras serão descartados automaticamente.',
              defaultValue: 'quebrado, defeito, réplica, primeira linha, carcaça, sucata, pirata',
              example: 'quebrado, réplica, sucata'
            }}
          />

          <ConfigField
            fieldKey="min_price_filter"
            label="Preço Mínimo para Aceitar Alertas (R$)"
            type="number"
            guide={{
              whatIs: 'Ignora itens de valor muito baixo onde custos fixos inviabilizam lucro.',
              defaultValue: '15.00',
              example: '15.00'
            }}
          />
        </div>
      </section>

      {/* SECTION 7: SISTEMA */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">7. Sistema, Concorrência & Backup</h2>
              <p className="text-xs text-slate-400">Ajuste de filas, cache e exportação/importação de configurações</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/settings/export"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> Exportar JSON
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ConfigField
            fieldKey="queue_concurrency"
            label="Concorrência da Fila de Processamento"
            type="number"
            guide={{
              whatIs: 'Quantos alertas podem ser analisados simultaneamente.',
              defaultValue: '2',
              example: '2'
            }}
          />

          <ConfigField
            fieldKey="ml_request_delay_ms"
            label="Delay entre Requisições ao ML (ms)"
            type="number"
            guide={{
              whatIs: 'Tempo de espera em milissegundos para evitar rate limit na API do Mercado Livre.',
              defaultValue: '1000',
              example: '1000'
            }}
          />

          <ConfigField
            fieldKey="cache_ttl_seconds"
            label="TTL do Cache de Respostas (segundos)"
            type="number"
            guide={{
              whatIs: 'Tempo de vida dos dados em cache para não repetir buscas desnecessárias.',
              defaultValue: '7200 (2 horas)',
              example: '7200'
            }}
          />
        </div>
      </section>
    </div>
  );
}
