const express = require('express');
const controller = require('../controllers/orderController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired(), controller.list);
router.post('/', authRequired(), controller.create);
router.put('/:id', authRequired(), controller.update);

module.exports = router;
