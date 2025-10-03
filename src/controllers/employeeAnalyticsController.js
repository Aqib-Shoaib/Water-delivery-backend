const { User } = require('../models/User');
const { SalarySlip } = require('../models/SalarySlip');
const { PaymentLoan } = require('../models/PaymentLoan');
const { WarningLetter } = require('../models/WarningLetter');
const { Resignation } = require('../models/Resignation');
const { ExperienceLetter } = require('../models/ExperienceLetter');
const { DutyResumption } = require('../models/DutyResumption');

async function totals(req, res, next) {
  try {
    const { from, to } = req.query || {};
    const dateRange = (field = 'createdAt') => {
      if (!from && !to) return {};
      const q = {};
      if (from) q.$gte = new Date(from);
      if (to) q.$lte = new Date(to);
      return { [field]: q };
    };

    const [working, terminated, waiting, slips, loans, leaveSalary, dutyResumptions, warnings, resignations, experiences] = await Promise.all([
      User.countDocuments({ status: 'working', ...dateRange('createdAt') }),
      User.countDocuments({ status: 'terminated', ...dateRange('createdAt') }),
      User.countDocuments({ status: 'waiting', ...dateRange('createdAt') }),
      SalarySlip.countDocuments({ ...dateRange('date') }),
      PaymentLoan.countDocuments({ type: 'loan', ...dateRange('date') }),
      PaymentLoan.countDocuments({ type: 'leave-salary', ...dateRange('date') }),
      DutyResumption.countDocuments({ ...dateRange('date') }),
      WarningLetter.countDocuments({ ...dateRange('date') }),
      Resignation.countDocuments({ ...dateRange('date') }),
      ExperienceLetter.countDocuments({ ...dateRange('date') }),
    ]);
    res.json({ working, terminated, waiting, slips, loans, leaveSalary, dutyResumptions, warnings, resignations, experiences });
  } catch (e) { next(e); }
}

module.exports = { totals };
