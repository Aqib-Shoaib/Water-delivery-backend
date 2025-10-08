const express = require('express');
const { register, login, me, updateMe } = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired(), me);
router.patch('/me', authRequired(), updateMe);

module.exports = router;
