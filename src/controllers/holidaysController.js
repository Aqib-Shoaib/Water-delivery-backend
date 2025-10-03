const { Holiday } = require('../models/Holiday');

async function list(req, res, next) {
  try {
    const { from, to } = req.query || {};
    const filter = {};
    if (from || to) filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
    const items = await Holiday.find(filter).sort({ date: -1 }).limit(500);
    res.json(items);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { date, name } = req.body || {};
    if (!date) return res.status(400).json({ message: 'date required' });
    const item = await Holiday.create({ date, name });
    res.status(201).json(item);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await Holiday.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) { next(e); }
}

module.exports = { list, create, remove };
