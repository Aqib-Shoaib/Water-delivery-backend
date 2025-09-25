const express = require('express');
const { list, create, update, remove, bootstrap } = require('../controllers/adminUserController');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Bootstrap route to create the first admin. Protected by a shared secret.
router.post('/bootstrap', bootstrap);

// All other admin user routes require an authenticated admin
router.use(authRequired(), requireRole('admin'));

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
