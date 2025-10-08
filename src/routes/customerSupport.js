const express = require('express');
const { authRequired } = require('../middleware/auth');
const { listMine, create, getOne, addComment } = require('../controllers/customerSupportController');

const router = express.Router();

router.use(authRequired());
router.get('/', listMine);
router.post('/', create);
router.get('/:id', getOne);
router.post('/:id/comments', addComment);

module.exports = router;
