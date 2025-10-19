const { Vendor } = require('../models/Vendor');
const { Expense } = require('../models/Expense');
const { BankTransaction } = require('../models/BankTransaction');
const { buildAuditFromReq } = require('../utils/auditLogger');

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const filter = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }];
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Vendor.countDocuments(filter),
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const payload = { ...req.body, createdBy: req.user?._id };
    const doc = await Vendor.create(payload);
    buildAuditFromReq(req, { action: 'vendor:create', entity: 'Vendor', entityId: String(doc._id) });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Vendor.findByIdAndUpdate(id, { ...req.body, updatedBy: req.user?._id }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'vendor:update', entity: 'Vendor', entityId: String(doc._id) });
    res.json(doc);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Vendor.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'vendor:delete', entity: 'Vendor', entityId: String(id) });
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function ledger(req, res, next) {
  try {
    const { id } = req.params;
    const [expenses, payments] = await Promise.all([
      Expense.find({ vendor: id }).sort({ date: -1 }).limit(200),
      BankTransaction.find({ relatedVendor: id }).sort({ date: -1 }).limit(200),
    ]);
    const payable = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    const paid = (payments || []).reduce((s, t) => s + (t.amount || 0), 0);
    const balance = payable - paid;
    res.json({ expenses, payments, payable, paid, balance });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, ledger };
