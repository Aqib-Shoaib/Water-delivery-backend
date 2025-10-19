const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/vendorsController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('vendors:read'), controller.list);
router.post('/', authRequired(), requirePermission('vendors:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('vendors:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('vendors:write'), controller.remove);
router.get('/:id/ledger', authRequired(), requirePermission('vendors:read'), controller.ledger);

module.exports = router;
