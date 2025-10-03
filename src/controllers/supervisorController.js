const { SupervisorAssignment } = require('../models/SupervisorAssignment');

async function list(req, res, next) {
  try {
    const { supervisor, staff } = req.query;
    const filter = {};
    if (supervisor) filter.supervisor = supervisor;
    if (staff) filter.staff = staff;
    const items = await SupervisorAssignment.find(filter).sort({ createdAt: -1 }).limit(1000);
    res.json(items);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { supervisor, staff, role, startedAt, endedAt } = req.body || {};
    if (!supervisor || !staff) return res.status(400).json({ message: 'supervisor and staff required' });
    const doc = await SupervisorAssignment.create({ supervisor, staff, role, startedAt, endedAt });
    res.status(201).json(doc);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { role, startedAt, endedAt } = req.body || {};
    const doc = await SupervisorAssignment.findByIdAndUpdate(id, { role, startedAt, endedAt }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await SupervisorAssignment.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) { next(e); }
}

module.exports = { list, create, update, remove };
