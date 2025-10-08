const { Message } = require('../models/Message');
const { Types } = require('mongoose');

function asObjectIdList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((v) => {
      try { return new Types.ObjectId(v); } catch { return null; }
    })
    .filter(Boolean);
}

function isPremiumFromStars(user) {
  return (user?.stars || 0) > 0;
}

async function populateMsg(q) {
  return q
    .populate('sender', 'name email role')
    .populate('recipients', 'name email role');
}

// GET /api/messages/inbox
async function listInbox(req, res, next) {
  try {
    const userId = req.user._id;
    const items = await populateMsg(
      Message.find({
        recipients: userId,
        trashedFor: { $ne: userId },
      })
        .sort({ createdAt: -1 })
        .limit(200)
    );
    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/messages/scheduled/window?days=3 OR ?start=ISO&end=ISO
async function listScheduledWindow(req, res, next) {
  try {
    const userId = req.user._id;
    const { start, end, days } = req.query || {};
    let from = start ? new Date(start) : new Date();
    let to = end ? new Date(end) : new Date(Date.now() + (Number(days) || 3) * 24 * 60 * 60 * 1000);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ message: 'Invalid start/end' });
    }
    const items = await populateMsg(
      Message.find({
        sender: userId,
        status: 'scheduled',
        scheduledAt: { $gte: from, $lte: to },
      }).sort({ scheduledAt: 1 }).limit(500)
    );
    res.json(items);
  } catch (err) { next(err); }
}

// POST /api/messages/scheduled/:id/send-now
async function sendScheduledNow(req, res, next) {
  try {
    const { id } = req.params;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (!msg.sender.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    if (msg.status !== 'scheduled') return res.status(400).json({ message: 'Not a scheduled message' });
    msg.status = 'sent';
    msg.sentAt = new Date();
    msg.scheduledAt = undefined;
    await msg.save();
    const doc = await populateMsg(Message.findById(msg._id));
    res.json(doc);
  } catch (err) { next(err); }
}

// GET /api/messages/sent
async function listSent(req, res, next) {
  try {
    const userId = req.user._id;
    const items = await populateMsg(
      Message.find({ sender: userId, status: 'sent' }).sort({ createdAt: -1 }).limit(200)
    );
    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/messages/drafts
async function listDrafts(req, res, next) {
  try {
    const userId = req.user._id;
    const items = await populateMsg(
      Message.find({ sender: userId, status: 'draft' }).sort({ updatedAt: -1 }).limit(200)
    );
    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/messages/scheduled
async function listScheduled(req, res, next) {
  try {
    const userId = req.user._id;
    const items = await populateMsg(
      Message.find({ sender: userId, status: 'scheduled' }).sort({ scheduledAt: 1 }).limit(200)
    );
    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/messages/premium
async function listPremium(req, res, next) {
  try {
    const userId = req.user._id;
    const items = await populateMsg(
      Message.find({ recipients: userId, isPremiumSender: true, trashedFor: { $ne: userId } })
        .sort({ createdAt: -1 })
        .limit(200)
    );
    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/messages/trash
async function listTrash(req, res, next) {
  try {
    const userId = req.user._id;
    const items = await populateMsg(
      Message.find({ trashedFor: userId })
        .sort({ updatedAt: -1 })
        .limit(200)
    );
    res.json(items);
  } catch (err) { next(err); }
}

// GET /api/messages/:id
async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const msg = await populateMsg(Message.findById(id));
    if (!msg) return res.status(404).json({ message: 'Not found' });
    // Access: sender or a recipient
    const isSender = msg.sender && msg.sender._id.equals(userId);
    const isRecipient = (msg.recipients || []).some((r) => r && r._id.equals(userId));
    if (!isSender && !isRecipient) return res.status(403).json({ message: 'Forbidden' });
    res.json(msg);
  } catch (err) { next(err); }
}

// POST /api/messages  (create draft)
// body: { subject, body, recipients: [userIds] }
async function createDraft(req, res, next) {
  try {
    const { subject = '', body = '', recipients = [] } = req.body || {};
    const recipientIds = asObjectIdList(recipients);
    const msg = await Message.create({
      subject,
      body,
      sender: req.user._id,
      recipients: recipientIds,
      status: 'draft',
      isPremiumSender: isPremiumFromStars(req.user),
    });
    const doc = await populateMsg(Message.findById(msg._id));
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

// POST /api/messages/send (send immediately)
// body: { subject, body, recipients }
async function sendNow(req, res, next) {
  try {
    const { subject = '', body = '', recipients = [] } = req.body || {};
    const recipientIds = asObjectIdList(recipients);
    const msg = await Message.create({
      subject,
      body,
      sender: req.user._id,
      recipients: recipientIds,
      status: 'sent',
      sentAt: new Date(),
      isPremiumSender: isPremiumFromStars(req.user),
    });
    const doc = await populateMsg(Message.findById(msg._id));
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

// POST /api/messages/schedule (schedule for future)
// body: { subject, body, recipients, scheduledAt }
async function schedule(req, res, next) {
  try {
    const { subject = '', body = '', recipients = [], scheduledAt } = req.body || {};
    if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt required' });
    const when = new Date(scheduledAt);
    if (isNaN(when.getTime())) return res.status(400).json({ message: 'scheduledAt invalid' });
    const recipientIds = asObjectIdList(recipients);
    const msg = await Message.create({
      subject,
      body,
      sender: req.user._id,
      recipients: recipientIds,
      status: 'scheduled',
      scheduledAt: when,
      isPremiumSender: isPremiumFromStars(req.user),
    });
    const doc = await populateMsg(Message.findById(msg._id));
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

// PATCH /api/messages/:id  (update draft/scheduled)
// body: { subject?, body?, recipients?, scheduledAt? }
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { subject, body, recipients, scheduledAt } = req.body || {};
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (!msg.sender.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    if (msg.status === 'sent') return res.status(400).json({ message: 'Cannot update a sent message' });

    if (subject !== undefined) msg.subject = subject;
    if (body !== undefined) msg.body = body;
    if (Array.isArray(recipients)) msg.recipients = asObjectIdList(recipients);
    if (scheduledAt !== undefined) {
      const when = scheduledAt ? new Date(scheduledAt) : null;
      if (when && isNaN(when.getTime())) return res.status(400).json({ message: 'scheduledAt invalid' });
      msg.scheduledAt = when || undefined;
      if (when) msg.status = 'scheduled';
    }
    await msg.save();
    const doc = await populateMsg(Message.findById(msg._id));
    res.json(doc);
  } catch (err) { next(err); }
}

// POST /api/messages/:id/trash (soft delete for current user)
async function moveToTrash(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const canAccess = msg.sender.equals(userId) || (msg.recipients || []).some((r) => r.equals(userId));
    if (!canAccess) return res.status(403).json({ message: 'Forbidden' });

    if (!msg.trashedFor.some((u) => u.equals(userId))) msg.trashedFor.push(userId);
    await msg.save();
    res.json({ success: true });
  } catch (err) { next(err); }
}

// POST /api/messages/:id/restore
async function restoreFromTrash(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const before = msg.trashedFor.length;
    msg.trashedFor = msg.trashedFor.filter((u) => !u.equals(userId));
    if (msg.trashedFor.length !== before) await msg.save();
    res.json({ success: true });
  } catch (err) { next(err); }
}

// DELETE /api/messages/:id   (only allow deleting own draft/scheduled)
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (!msg.sender.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    if (msg.status === 'sent') return res.status(400).json({ message: 'Cannot delete a sent message' });

    await Message.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = {
  listInbox,
  listSent,
  listDrafts,
  listScheduled,
  listPremium,
  listTrash,
  getOne,
  createDraft,
  sendNow,
  schedule,
  listScheduledWindow,
  sendScheduledNow,
  update,
  moveToTrash,
  restoreFromTrash,
  remove,
};
