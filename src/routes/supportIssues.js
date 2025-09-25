const express = require('express');
const { list, create, update, addComment, remove } = require('../controllers/supportIssueController');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// All support issues endpoints are admin-only
router.use(authRequired(), requireRole('admin'));

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/comments', addComment);
router.delete('/:id', remove);

module.exports = router;
