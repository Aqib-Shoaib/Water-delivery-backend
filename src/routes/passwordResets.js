const express = require('express');
const { requestReset, confirmReset } = require('../controllers/passwordResetController');

const router = express.Router();

// Public endpoints (rate-limit recommended in production)
router.post('/request', requestReset);
router.post('/confirm', confirmReset);

module.exports = router;
