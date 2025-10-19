const { PurchaseOrder } = require('../models/PurchaseOrder');
const { Vendor } = require('../models/Vendor');
const { buildAuditFromReq } = require('../utils/auditLogger');

function generateNumber() {
  return 'PO-' + Date.now();
}

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, status, vendor, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vendor) filter.vendor = vendor;
    if (q) filter.number = new RegExp(q, 'i');
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      PurchaseOrder.find(filter).populate('vendor', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PurchaseOrder.countDocuments(filter),
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const payload = { ...req.body };
    payload.number = payload.number || generateNumber();
    const doc = await PurchaseOrder.create(payload);
    buildAuditFromReq(req, { action: 'po:create', entity: 'PurchaseOrder', entityId: String(doc._id) });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await PurchaseOrder.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'po:update', entity: 'PurchaseOrder', entityId: String(doc._id) });
    res.json(doc);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await PurchaseOrder.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'po:delete', entity: 'PurchaseOrder', entityId: String(id) });
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
