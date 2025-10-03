const { AttendanceLog } = require('../models/AttendanceLog');
const { Holiday } = require('../models/Holiday');
const { User } = require('../models/User');

function rangeFilter(from, to) {
  const q = {};
  if (from) q.$gte = new Date(from);
  if (to) q.$lte = new Date(to);
  return Object.keys(q).length ? { $match: { date: q } } : null;
}

async function totals(req, res, next) {
  try {
    const { from, to } = req.query || {};
    const pipeline = [];
    const rf = rangeFilter(from, to);
    if (rf) pipeline.push(rf);

    const agg = await AttendanceLog.aggregate([
      ...pipeline,
      {
        $group: {
          _id: null,
          workingDays: { $sum: { $cond: [{ $in: ['$status', ['present', 'half-day']] }, 1, 0] } },
          offDays: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
          absents: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          medicalLeave: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'leave'] }, { $eq: ['$leaveType', 'medical'] }] }, 1, 0] } },
          workHours: { $sum: { $ifNull: ['$workHours', 0] } },
          overtimeHours: { $sum: { $ifNull: ['$overtimeHours', 0] } },
        },
      },
    ]);

    const holidays = await Holiday.countDocuments((() => {
      const q = {};
      if (from || to) q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to) q.date.$lte = new Date(to);
      return q;
    })());

    const workingEmployees = await User.countDocuments({ status: 'working' });

    const data = agg[0] || { workingDays: 0, offDays: 0, absents: 0, medicalLeave: 0, workHours: 0, overtimeHours: 0 };
    const offHours = data.offDays * 8; // default 8h per off day

    res.json({
      workingEmployees,
      workingDays: data.workingDays,
      workHours: data.workHours,
      offDays: data.offDays,
      offHours,
      overtimeHours: data.overtimeHours,
      publicHolidays: holidays,
      absents: data.absents,
      medicalLeave: data.medicalLeave,
    });
  } catch (e) { next(e); }
}

async function perUser(req, res, next) {
  try {
    const { from, to } = req.query || {};
    const pipeline = [];
    const rf = rangeFilter(from, to);
    if (rf) pipeline.push(rf);

    const rows = await AttendanceLog.aggregate([
      ...pipeline,
      {
        $group: {
          _id: '$user',
          workingDays: { $sum: { $cond: [{ $in: ['$status', ['present', 'half-day']] }, 1, 0] } },
          offDays: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
          absents: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          medicalLeave: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'leave'] }, { $eq: ['$leaveType', 'medical'] }] }, 1, 0] } },
          workHours: { $sum: { $ifNull: ['$workHours', 0] } },
          overtimeHours: { $sum: { $ifNull: ['$overtimeHours', 0] } },
        },
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          workingDays: 1,
          offDays: 1,
          absents: 1,
          medicalLeave: 1,
          workHours: 1,
          overtimeHours: 1,
          name: '$user.name',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          employeeId: '$user.employeeId',
          dob: '$user.dob',
          cnicOrPassport: '$user.cnicOrPassport',
          phone: '$user.phone',
          email: '$user.email',
          education: '$user.education',
          jobTitle: '$user.jobTitle',
          gender: '$user.gender',
          joiningDate: '$user.joiningDate',
          department: '$user.department',
          employeeType: '$user.employeeType',
          address: '$user.address',
          remarks: '$user.remarks',
        },
      },
      { $sort: { firstName: 1, name: 1 } },
      { $limit: 1000 },
    ]);

    // Holiday count is global in totals; per-user we can include the count for reference
    const holidays = await Holiday.countDocuments((() => {
      const q = {};
      if (from || to) q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to) q.date.$lte = new Date(to);
      return q;
    })());

    res.json({ holidays, rows });
  } catch (e) { next(e); }
}

module.exports = { totals, perUser };
