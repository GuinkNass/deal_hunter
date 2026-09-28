const express = require('express');

const router = express.Router();

router.use('/history', require('./history.routes'));
router.use('/telegram', require('./telegram.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/status', require('./status.routes'));
router.use('/scan', require('./scan.routes'));
router.use('/catalog', require('./catalog.routes'));

module.exports = router;
