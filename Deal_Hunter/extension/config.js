// ==============================================================================
// Deal Hunter Pro — Arquivo de Configuração Central da Extensão
// ==============================================================================
// Este arquivo gerencia os endpoints remotos da nuvem (Render) e desenvolvimento local.
// A extensão se comunica exclusivamente com a API hospedada na nuvem.

const CONFIG = {
  // 1. URL de Produção na Nuvem (Render)
  // Substitua pelo endereço público do seu Web Service no Render se for diferente:
  PRODUCTION_API_URL: 'https://deal-hunter-server.onrender.com',

  // 2. URL de Desenvolvimento Local (apenas para testes internos em ambiente dev)
  LOCAL_API_URL: 'http://127.0.0.1:3000',

  // 3. Ambiente Padrão: 'production' direciona 100% do tráfego para a nuvem no Render.
  // Alterne para 'development' caso deseje rodar a API localmente na sua máquina.
  ENVIRONMENT: 'production',

  // 4. Portal Web Oficial para Login e Validação de Licenças Pro
  WEB_AUTH_URL: 'https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app',

  // Retorna a URL base padrão da API conforme o ambiente selecionado
  getDefaultApiUrl() {
    return this.ENVIRONMENT === 'production' ? this.PRODUCTION_API_URL : this.LOCAL_API_URL;
  },

  // Retorna a URL completa para autenticação web
  getLoginUrl() {
    return `${this.WEB_AUTH_URL}/login?from=extension`;
  },
};

if (typeof module !== 'undefined') {
  module.exports = CONFIG;
}
