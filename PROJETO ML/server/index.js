const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { seedSettings } = require('./db/seed');
const { enqueueDeal } = require('./services/queueService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure seed settings exist
seedSettings();

// Routes
app.use('/api/ingest', require('./routes/ingest'));
app.use('/api/analyses', require('./routes/analyses'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/calculator', require('./routes/calculator'));
app.use('/api/ml', require('./routes/mlAuth'));
app.use('/api/status', require('./routes/status'));

// Serve static frontend in production if built
const webDistPath = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
}

// Fallback handler for SPA or status page
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint não encontrado' });
  }

  const indexHtml = path.join(webDistPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head><title>ML Radar API</title><meta charset="utf-8"></head>
    <body style="background:#0b0f17;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;padding:60px 20px;text-align:center;">
      <h1 style="color:#38bdf8;font-size:28px;">🚀 ML Radar API Ativa</h1>
      <p style="color:#94a3b8;font-size:16px;">Servidor backend operando na porta ${PORT}.</p>
      <div style="margin-top:24px;">
        <p>Acesse o Dashboard Web em <a href="http://localhost:5173" style="color:#38bdf8;font-weight:bold;">http://localhost:5173</a></p>
        <p>Status da API: <a href="http://localhost:${PORT}/api/status" style="color:#a78bfa;">/api/status</a></p>
      </div>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Erro interno do servidor'
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ML RADAR BACKEND RODANDO NA PORTA ${PORT}`);
  console.log(`📡 Ingest Webhook: http://localhost:${PORT}/api/ingest`);
  console.log(`📊 API Status:    http://localhost:${PORT}/api/status`);
  console.log(`🌐 Frontend Dev:   http://localhost:5173`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
