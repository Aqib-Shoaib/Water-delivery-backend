const { AttendanceLog } = require('../models/AttendanceLog');

async function list(req, res, next) {
  try {
    const { user, start, end } = req.query;
    const filter = {};
    if (user) filter.user = user;
    if (start || end) filter.date = {};
    if (start) filter.date.$gte = new Date(start);
    if (end) filter.date.$lte = new Date(end);
    const items = await AttendanceLog.find(filter).sort({ date: -1 }).limit(1000);
    res.json(items);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { user, date, unit, status, remarks, workHours, overtimeHours, leaveType } = req.body || {};
    if (!user || !date) return res.status(400).json({ message: 'user and date required' });
    const doc = await AttendanceLog.create({ user, date, unit, status, remarks,
      workHours: typeof workHours === 'number' ? workHours : undefined,
      overtimeHours: typeof overtimeHours === 'number' ? overtimeHours : undefined,
      leaveType: typeof leaveType === 'string' ? leaveType : undefined,
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { date, unit, status, remarks, workHours, overtimeHours, leaveType } = req.body || {};
    const updates = {};
    if (date !== undefined) updates.date = date;
    if (unit !== undefined) updates.unit = unit;
    if (status !== undefined) updates.status = status;
    if (remarks !== undefined) updates.remarks = remarks;
    if (workHours !== undefined) updates.workHours = workHours;
    if (overtimeHours !== undefined) updates.overtimeHours = overtimeHours;
    if (leaveType !== undefined) updates.leaveType = leaveType;
    const doc = await AttendanceLog.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await AttendanceLog.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) { next(e); }
}

module.exports = { list, create, update, remove };
