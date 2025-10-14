const { AttendanceLog } = require('../models/AttendanceLog');
const { Order } = require('../models/Order');
const { User } = require('../models/User');
const { PayrollSettings } = require('../models/PayrollSettings');
const { Holiday } = require('../models/Holiday');

// NOTE: Month format: 'YYYY-MM'
function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0)); // exclusive
  return { start, end };
}

async function loadSettings() {
  const doc = await PayrollSettings.findOne().sort({ createdAt: -1 }).lean();
  return (
    doc || {
      hourlyRate: 0, // legacy
      overtimeRate: 0,
      baseSalary: 0,
      maxHoursPerDay: 10,
      publicHolidayHourlyRate: undefined,
      commissionPerBottle: 1.5,
      referralRate: 1000,
      workingDaysPerMonth: 26, // legacy
      workingHoursPerDay: 10, // legacy
      vatRate: 0,
      applyVatTo: 'none',
    }
  );
}

function workingDaysExclSundaysInMonth(month) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  let days = 0;
  for (let d = new Date(first); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 0) days += 1; // 0 = Sunday
  }
  return days;
}

async function aggregateAttendance(userId, month) {
  const { start, end } = monthRange(month);
  const rows = await AttendanceLog.aggregate([
    { $match: { user: typeof userId === 'string' ? new (require('mongoose').Types.ObjectId)(userId) : userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: null, workedHours: { $sum: '$workHours' }, overtimeHours: { $sum: '$overtimeHours' } } },
  ]);
  const agg = rows[0] || { workedHours: 0, overtimeHours: 0 };
  return { workedHours: agg.workedHours || 0, overtimeHours: agg.overtimeHours || 0 };
}

async function aggregateHolidayWorkedHours(userId, month) {
  const { start, end } = monthRange(month);
  // Preload holiday dates (YYYY-MM-DD) for fast lookup
  const holidays = await Holiday.find({ date: { $gte: start, $lt: end } }, { date: 1 }).lean();
  const holidaySet = new Set(
    holidays.map((h) => new Date(h.date).toISOString().slice(0, 10))
  );
  if (holidaySet.size === 0) return 0;
  const rows = await AttendanceLog.aggregate([
    { $match: { user: typeof userId === 'string' ? new (require('mongoose').Types.ObjectId)(userId) : userId, date: { $gte: start, $lt: end } } },
    {
      $project: {
        workHours: 1,
        dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } },
      },
    },
    { $match: { dateStr: { $in: Array.from(holidaySet) } } },
    { $group: { _id: null, hours: { $sum: '$workHours' } } },
  ]);
  return (rows[0] && rows[0].hours) || 0;
}

async function aggregateBottles(userId, month) {
  const { start, end } = monthRange(month);
  const orders = await Order.aggregate([
    {
      $match: {
        assignedDriver: typeof userId === 'string' ? new (require('mongoose').Types.ObjectId)(userId) : userId,
        status: 'delivered',
        deliveredAt: { $gte: start, $lt: end },
      },
    },
    { $unwind: '$items' },
    { $group: { _id: null, bottles: { $sum: '$items.quantity' } } },
  ]);
  return (orders[0] && orders[0].bottles) || 0;
}

async function referralCount(userId, month, scope = 'lifetime') {
  // Currently lifetime count of referred customers; monthly scope can be added if needed later
  const user = await User.findById(userId, { referredCustomers: 1 }).lean();
  return user?.referredCustomers?.length || 0;
}

function computeTotals({
  derivedHourlyRate,
  baseSalary,
  overtimeRate,
  publicHolidayHourlyRate,
  workedNormalHours,
  workedPublicHolidayHours,
  overtimeHours,
  bottles,
  commissionPerBottle,
  referralRate,
  referrals,
  allowances = [],
  deductions = [],
  annualBonus = 0,
  annualLeaveSalary = 0,
  vatRate,
  applyVatTo,
}) {
  // Regular pay is capped at baseSalary
  const regularAmount = Math.min(baseSalary || 0, derivedHourlyRate * (workedNormalHours || 0));
  const overtimeAmount = (overtimeRate || 0) * (overtimeHours || 0);
  const phRate = publicHolidayHourlyRate ?? (derivedHourlyRate * 2);
  const publicHolidayAmount = phRate * (workedPublicHolidayHours || 0);
  const commissionAmount = (bottles || 0) * (commissionPerBottle || 0);
  const referralAmount = (referrals || 0) * (referralRate || 0);
  const allowancesTotal = allowances.reduce((s, a) => s + (a.amount || 0), 0);
  const deductionsTotal = deductions.reduce((s, d) => s + (d.amount || 0), 0);

  const gross =
    regularAmount +
    overtimeAmount +
    publicHolidayAmount +
    commissionAmount +
    referralAmount +
    allowancesTotal +
    (annualBonus || 0) +
    (annualLeaveSalary || 0);

  const vat = vatRate > 0 ? gross * (vatRate / 100) : 0;
  let net = gross - deductionsTotal;
  if (vatRate > 0) {
    if (applyVatTo === 'deduct_from_net') net -= vat;
    else if (applyVatTo === 'gross_addon') net += vat;
  }

  return {
    components: {
      derivedHourlyRate,
      baseSalary: baseSalary || 0,
      workedNormalHours: workedNormalHours || 0,
      regularAmount,
      workedPublicHolidayHours: workedPublicHolidayHours || 0,
      publicHolidayHourlyRate: phRate,
      publicHolidayAmount,
      overtimeHours: overtimeHours || 0,
      overtimeRate: overtimeRate || 0,
      overtimeAmount,
      bottles: bottles || 0,
      commissionPerBottle: commissionPerBottle || 0,
      commissionAmount,
      referralCount: referrals || 0,
      referralRate: referralRate || 0,
      referralAmount,
      allowances,
      annualBonus: annualBonus || 0,
      annualLeaveSalary: annualLeaveSalary || 0,
    },
    deductions: { items: deductions, total: deductionsTotal },
    vatRate,
    vatAmount: vat,
    gross,
    net,
  };
}

async function computeForUserMonth({ userId, month, overrides = {} }) {
  const settings = await loadSettings();
  const baseSalary = overrides.baseSalary ?? settings.baseSalary ?? 0;
  const maxHoursPerDay = overrides.maxHoursPerDay ?? settings.maxHoursPerDay ?? 10;
  const overtimeRate = overrides.overtimeRate ?? settings.overtimeRate ?? 0;
  const commissionPerBottle = overrides.commissionPerBottle ?? settings.commissionPerBottle ?? 1.5;
  const referralRate = overrides.referralRate ?? settings.referralRate ?? 1000;

  const daysExclSundays = workingDaysExclSundaysInMonth(month);
  const derivedHourlyRate = daysExclSundays > 0 ? (baseSalary / (daysExclSundays * maxHoursPerDay)) : 0;

  // Allow overrides to bypass DB aggregation for testing
  const aggAttendance = overrides.workedHours != null && overrides.overtimeHours != null
    ? { workedHours: Number(overrides.workedHours) || 0, overtimeHours: Number(overrides.overtimeHours) || 0 }
    : await aggregateAttendance(userId, month);
  const workedHours = aggAttendance.workedHours || 0;
  const baseOvertimeHours = aggAttendance.overtimeHours || 0;

  const holidayWorkedHours = overrides.holidayWorkedHours != null
    ? Number(overrides.holidayWorkedHours) || 0
    : await aggregateHolidayWorkedHours(userId, month);

  const sundayWorkedHours = overrides.sundayWorkedHours != null
    ? Number(overrides.sundayWorkedHours) || 0
    : await aggregateSundayWorkedHours(userId, month);
  const workedNormalHours = Math.max(0, (workedHours || 0) - (holidayWorkedHours || 0) - (sundayWorkedHours || 0));
  const bottles = overrides.bottles != null
    ? Number(overrides.bottles) || 0
    : await aggregateBottles(userId, month);
  const referrals = overrides.referralCount != null
    ? Number(overrides.referralCount) || 0
    : (await referralCount(userId, month));
  const allowances = overrides.allowances || [];
  const deductions = overrides.deductions || [];
  const annualBonus = overrides.annualBonus || 0;
  const annualLeaveSalary = overrides.annualLeaveSalary || 0;

  return computeTotals({
    derivedHourlyRate,
    baseSalary,
    overtimeRate,
    publicHolidayHourlyRate: overrides.publicHolidayHourlyRate ?? settings.publicHolidayHourlyRate,
    workedNormalHours,
    workedPublicHolidayHours: holidayWorkedHours,
    overtimeHours: (overrides.overtimeHours != null ? Number(overrides.overtimeHours) || 0 : baseOvertimeHours) + (sundayWorkedHours || 0),
    bottles,
    commissionPerBottle,
    referralRate,
    referrals,
    allowances,
    deductions,
    annualBonus,
    annualLeaveSalary,
    vatRate: overrides.vatRate ?? settings.vatRate ?? 0,
    applyVatTo: settings.applyVatTo || 'none',
  });
}

module.exports = { loadSettings, computeForUserMonth };
