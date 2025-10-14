const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/salarySlipController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('salarySlips:read'), controller.list);
router.post('/', authRequired(), requirePermission('salarySlips:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('salarySlips:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('salarySlips:write'), controller.remove);

// New calculation and workflow endpoints
router.post('/preview', authRequired(), requirePermission('salarySlips:read'), controller.preview);
router.post('/generate', authRequired(), requirePermission('salarySlips:write'), controller.generate);
router.post('/:id/finalize', authRequired(), requirePermission('salarySlips:write'), controller.finalize);
router.post('/:id/pay', authRequired(), requirePermission('salarySlips:write'), controller.pay);
router.get('/export', authRequired(), requirePermission('salarySlips:read'), controller.exportCsv);
// PDF download
router.get('/:id.pdf', authRequired(), requirePermission('salarySlips:read'), controller.downloadPdf);

module.exports = router;
