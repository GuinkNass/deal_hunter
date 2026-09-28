const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

// Importação segura do módulo checker, lidando caso a função mude de nome
const checker = require("../monitors/checker");

router.post("/", async (req, res) => {
  try {
    logger.info("Requisição recebida para verificar todos os sites agora.");

    // Verifica se a função existe no checker (aceita checkAllNow ou checkAllSites)
    const checkFunction = checker.checkAllNow || checker.checkAllSites;

    if (typeof checkFunction === "function") {
      const results = await checkFunction();
      return res.json({
        success: true,
        message: "Verificação executada com sucesso",
        results,
      });
    } else {
      return res
        .status(500)
        .json({
          success: false,
          error: "Função de checagem não encontrada no checker.",
        });
    }
  } catch (error) {
    logger.error(`Erro ao executar verificação geral: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
