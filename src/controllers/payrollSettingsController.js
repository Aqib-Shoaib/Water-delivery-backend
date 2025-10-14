const { PayrollSettings } = require('../models/PayrollSettings');
const { computeForUserMonth } = require('../services/payrollService');

async function get(req, res, next) {
  try {
    const doc = await PayrollSettings.findOne().sort({ createdAt: -1 }).lean();
    res.json(
      doc || {
        hourlyRate: 0,
        overtimeRate: 0,
        baseSalary: 0,
        maxHoursPerDay: 10,
        publicHolidayHourlyRate: undefined,
        commissionPerBottle: 1.5,
        referralRate: 1000,
        workingDaysPerMonth: 26,
        workingHoursPerDay: 10,
        vatRate: 0,
        applyVatTo: 'none',
      }
    );
  } catch (e) { next(e); }
}

async function upsert(req, res, next) {
  try {
    const payload = req.body || {};
    const doc = await PayrollSettings.findOne().sort({ createdAt: -1 });
    if (!doc) {
      const created = await PayrollSettings.create(payload);
      return res.status(201).json(created);
    }
    Object.assign(doc, payload);
    await doc.save();
    res.json(doc);
  } catch (e) { next(e); }
}

module.exports = { get, upsert };

// Test calculation without needing real data
async function testCalc(req, res, next) {
  try {
    const { userId, month, overrides = {} } = req.body || {};
    if (!month) return res.status(400).json({ message: 'month required (YYYY-MM)' });
    // Require minimal overrides if no userId is provided
    if (!userId) {
      const required = ['workedHours', 'overtimeHours'];
      const missing = required.filter((k) => overrides[k] == null);
      if (missing.length) {
        return res.status(400).json({ message: `When userId is not provided, the following overrides are required: ${missing.join(', ')}` });
      }
    }
    const result = await computeForUserMonth({ userId: userId || undefined, month, overrides });
    res.json(result);
  } catch (e) { next(e); }
}

module.exports.testCalc = testCalc;
