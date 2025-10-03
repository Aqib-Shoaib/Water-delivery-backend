const { Doc } = require('../models/Doc');
const { buildAuditFromReq } = require('../utils/auditLogger');

// GET /api/docs
async function list(req, res, next) {
  try {
    const docs = await Doc.find({}).sort({ createdAt: -1 }).limit(500);
    res.json(docs);
  } catch (err) { next(err); }
}

// POST /api/docs
async function create(req, res, next) {
  try {
    const { title, url, kind = 'doc' } = req.body || {};
    if (!title || !url) return res.status(400).json({ message: 'title and url required' });
    const doc = await Doc.create({ title, url, kind, createdBy: req.user?._id });
    buildAuditFromReq(req, { action: 'doc:create', entity: 'Doc', entityId: String(doc._id), meta: { title, url, kind } });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

// PUT /api/docs/:id
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updates = {};
    const { title, url, kind } = req.body || {};
    if (title !== undefined) updates.title = title;
    if (url !== undefined) updates.url = url;
    if (kind !== undefined) updates.kind = kind;
    const doc = await Doc.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'doc:update', entity: 'Doc', entityId: String(doc._id), meta: { updates } });
    res.json(doc);
  } catch (err) { next(err); }
}

// DELETE /api/docs/:id
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await Doc.findByIdAndDelete(id);
    buildAuditFromReq(req, { action: 'doc:delete', entity: 'Doc', entityId: String(id) });
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
