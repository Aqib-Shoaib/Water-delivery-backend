const express = require('express');
const { list, create, update, remove, bootstrap, getOne } = require('../controllers/adminUserController');
const { authRequired, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Bootstrap route to create the first admin. Protected by a shared secret.
router.post('/bootstrap', bootstrap);

// All other admin user routes require permissions
router.get('/', authRequired(), requirePermission('users:read'), list);
router.post('/', authRequired(), requirePermission('users:write'), create);
router.get('/:id', authRequired(), requirePermission('users:read'), getOne);
router.put('/:id', authRequired(), requirePermission('users:write'), update);
router.delete('/:id', authRequired(), requirePermission('users:write'), remove);

module.exports = router;
