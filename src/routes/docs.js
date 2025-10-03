const express = require('express');
const { authRequired, requirePermission, requireRole } = require('../middleware/auth');
const controller = require('../controllers/docController');

const router = express.Router();

function allowDocsRead(req, res, next) {
  if (req.user?.role === 'admin' || req.user?.role === 'superadmin') return next();
  return requirePermission('docs:read')(req, res, next);
}
function allowDocsWrite(req, res, next) {
  if (req.user?.role === 'admin' || req.user?.role === 'superadmin') return next();
  return requirePermission('docs:write')(req, res, next);
}

router.get('/', authRequired(), allowDocsRead, controller.list);
router.post('/', authRequired(), allowDocsWrite, controller.create);
router.put('/:id', authRequired(), allowDocsWrite, controller.update);
router.delete('/:id', authRequired(), allowDocsWrite, controller.remove);

module.exports = router;
