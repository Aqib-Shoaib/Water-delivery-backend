const express = require('express');
const { authRequired } = require('../middleware/auth');
const controller = require('../controllers/messageController');

const router = express.Router();

// Listing
router.get('/inbox', authRequired(), controller.listInbox);
router.get('/sent', authRequired(), controller.listSent);
router.get('/drafts', authRequired(), controller.listDrafts);
router.get('/scheduled', authRequired(), controller.listScheduled);
router.get('/scheduled/window', authRequired(), controller.listScheduledWindow);
router.get('/premium', authRequired(), controller.listPremium);
router.get('/trash', authRequired(), controller.listTrash);

// Read single message
router.get('/:id', authRequired(), controller.getOne);

// Compose
router.post('/', authRequired(), controller.createDraft);
router.post('/send', authRequired(), controller.sendNow);
router.post('/schedule', authRequired(), controller.schedule);

// Update/Trash/Delete
router.patch('/:id', authRequired(), controller.update);
router.post('/:id/trash', authRequired(), controller.moveToTrash);
router.post('/:id/restore', authRequired(), controller.restoreFromTrash);
router.delete('/:id', authRequired(), controller.remove);
// Manually send a specific scheduled message now (frontend-driven scheduling)
router.post('/scheduled/:id/send-now', authRequired(), controller.sendScheduledNow);

module.exports = router;
