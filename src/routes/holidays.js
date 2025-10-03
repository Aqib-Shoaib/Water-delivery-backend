const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/holidaysController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('holidays:read'), controller.list);
router.post('/', authRequired(), requirePermission('holidays:write'), controller.create);
router.delete('/:id', authRequired(), requirePermission('holidays:write'), controller.remove);

module.exports = router;
