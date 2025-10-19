const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/bankController');

const router = express.Router();

// accounts
router.get('/accounts', authRequired(), requirePermission('bank:read'), controller.listAccounts);
router.post('/accounts', authRequired(), requirePermission('bank:write'), controller.createAccount);
router.put('/accounts/:id', authRequired(), requirePermission('bank:write'), controller.updateAccount);
router.delete('/accounts/:id', authRequired(), requirePermission('bank:write'), controller.removeAccount);

// transactions
router.get('/accounts/:accountId/transactions', authRequired(), requirePermission('bank:read'), controller.listTransactions);
router.post('/transactions', authRequired(), requirePermission('bank:write'), controller.createTransaction);
router.delete('/transactions/:id', authRequired(), requirePermission('bank:write'), controller.removeTransaction);

module.exports = router;
