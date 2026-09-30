// ==============================================================================
// Profit Hunter Pro — Arquivo de Configuração Central da Extensão
// ==============================================================================
// Integrado à arquitetura de autenticação unificada do Deal Hunter Pro.

const CONFIG = {
  // Portal Web Oficial para Login e Validação de Licenças
  WEB_AUTH_URL: 'https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app',

  // Retorna a URL completa para autenticação web
  getLoginUrl() {
    return `${this.WEB_AUTH_URL}/login?from=profit_hunter`;
  },
};

if (typeof module !== 'undefined') {
  module.exports = CONFIG;
}
