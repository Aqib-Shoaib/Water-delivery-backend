const { Expense } = require('../models/Expense');
const { buildAuditFromReq } = require('../utils/auditLogger');

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, status, category, vendor, start, end, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (vendor) filter.vendor = vendor;
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }
    if (q) filter.$or = [{ reference: new RegExp(q, 'i') }, { notes: new RegExp(q, 'i') }];

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total, sumAgg] = await Promise.all([
      Expense.find(filter).populate('vendor', 'name').sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Expense.countDocuments(filter),
      Expense.aggregate([
        { $match: Object.assign({}, filter, { amount: { $gte: 0 } }) },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]),
    ]);
    const totalAmount = sumAgg[0]?.totalAmount || 0;
    res.json({ items, total, totalAmount, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const payload = { ...req.body, createdBy: req.user?._id };
    const doc = await Expense.create(payload);
    buildAuditFromReq(req, { action: 'expense:create', entity: 'Expense', entityId: String(doc._id) });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Expense.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'expense:update', entity: 'Expense', entityId: String(doc._id) });
    res.json(doc);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Expense.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'expense:delete', entity: 'Expense', entityId: String(id) });
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
