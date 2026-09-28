const { getCatalog } = require('./catalogLoader');

const { STORES } = getCatalog();

function amazonResultsUrl(nodeId) {
  return `https://www.amazon.com.br/s?rh=n%3A${nodeId}`;
}

module.exports = { STORES, getCatalog, amazonResultsUrl };
