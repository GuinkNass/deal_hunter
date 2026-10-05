const express = require('express');
const router = express.Router();
const { getAuthUrl, exchangeCodeForToken } = require('../services/mlApiService');

/**
 * GET /api/ml/auth-url
 * Returns authorization URL for connecting Mercado Livre account
 */
router.get('/auth-url', (req, res) => {
  try {
    const url = getAuthUrl();
    res.json({ success: true, url });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ml/callback
 * Handles OAuth2 redirect from Mercado Livre
 */
router.get('/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(`http://localhost:5173/settings?ml_error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    return res.redirect('http://localhost:5173/settings?ml_error=Código%20de%20autorização%20ausente');
  }

  try {
    await exchangeCodeForToken(code);
    res.redirect('http://localhost:5173/settings?ml_connected=true');
  } catch (err) {
    console.error('[ML OAuth] Erro no callback:', err.message);
    res.redirect(`http://localhost:5173/settings?ml_error=${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
