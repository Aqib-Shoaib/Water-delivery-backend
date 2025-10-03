const { SalarySlip } = require('../models/SalarySlip');

async function list(req, res, next) {
  try {
    const { user, month } = req.query;
    const filter = {};
    if (user) filter.user = user;
    if (month) filter.month = month;
    const items = await SalarySlip.find(filter).sort({ month: -1 }).limit(500);
    res.json(items);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { user, month, gross = 0, deductions = 0, net = 0, notes, fileUrl } = req.body || {};
    if (!user || !month) return res.status(400).json({ message: 'user and month required' });
    const doc = await SalarySlip.create({ user, month, gross, deductions, net, notes, fileUrl, issuedAt: new Date() });
    res.status(201).json(doc);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { gross, deductions, net, notes, fileUrl } = req.body || {};
    const doc = await SalarySlip.findByIdAndUpdate(id, { gross, deductions, net, notes, fileUrl }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await SalarySlip.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) { next(e); }
}

module.exports = { list, create, update, remove };
