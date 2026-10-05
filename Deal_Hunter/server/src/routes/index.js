const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/history', require('./history.routes'));
router.use('/telegram', require('./telegram.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/status', require('./status.routes'));
router.use('/scan', require('./scan.routes'));
router.use('/catalog', require('./catalog.routes'));
router.use('/ingest', require('./ingest.routes'));
router.use('/ml-radar', require('./mlRadar.routes'));

module.exports = router;
