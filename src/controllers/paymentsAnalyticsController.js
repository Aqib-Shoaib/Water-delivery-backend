const { User } = require('../models/User');
const { PaymentLoan } = require('../models/PaymentLoan');

function rangeMatch(from, to, field = 'date') {
  const q = {};
  if (from) q.$gte = new Date(from);
  if (to) q.$lte = new Date(to);
  return Object.keys(q).length ? { [field]: q } : {};
}

async function totals(req, res, next) {
  try {
    const { from, to } = req.query || {};
    const dateQ = rangeMatch(from, to, 'date');

    const [employeeCount, totalLoanApplications, approvedLoans, pendingLoans, rejectedLoans, totalPaidAmount] = await Promise.all([
      require('../models/User').User.countDocuments({}),
      PaymentLoan.countDocuments({ type: 'loan', ...dateQ }),
      PaymentLoan.countDocuments({ type: 'loan', applicationStatus: 'approved', ...dateQ }),
      PaymentLoan.countDocuments({ type: 'loan', applicationStatus: 'pending', ...dateQ }),
      PaymentLoan.countDocuments({ type: 'loan', applicationStatus: 'rejected', ...dateQ }),
      PaymentLoan.aggregate([
        { $match: { type: { $in: ['payment', 'leave-salary'] }, ...dateQ } },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ]).then(a => (a[0]?.sum || 0)),
    ]);

    res.json({ employeeCount, totalLoanApplications, approvedLoans, pendingLoans, rejectedLoans, totalPaidAmount });
  } catch (e) { next(e); }
}

async function rows(req, res, next) {
  try {
    const { from, to } = req.query || {};
    const dateQ = rangeMatch(from, to, 'date');

    const loanRows = await PaymentLoan.aggregate([
      { $match: { type: 'loan', ...dateQ } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$user._id',
          name: '$user.name',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          employeeId: '$user.employeeId',
          dob: '$user.dob',
          cnicOrPassport: '$user.cnicOrPassport',
          phone: '$user.phone',
          email: '$user.email',
          jobTitle: '$user.jobTitle',
          gender: '$user.gender',
          joiningDate: '$user.joiningDate',
          department: '$user.department',
          employeeType: '$user.employeeType',
          address: '$user.address',
          remarks: '$user.remarks',
          appliedAmount: '$amount',
          applicationStatus: '$applicationStatus',
          approvedAmount: '$approvedAmount',
          monthlyInstallment: '$monthlyInstallment',
          installmentsTotal: '$installmentsTotal',
          durationMonths: '$durationMonths',
          approvedByName: '$approvedByName',
          approvedByDesignation: '$approvedByDesignation',
          approvedByPhone: '$approvedByPhone',
          confirmedByName: '$confirmedByName',
          confirmedByDesignation: '$confirmedByDesignation',
          confirmedByPhone: '$confirmedByPhone',
          approvalDate: '$date',
          receiptUrl: '$receiptUrl',
        },
      },
      { $sort: { approvalDate: -1 } },
      { $limit: 1000 },
    ]);

    const paymentsByUser = await PaymentLoan.aggregate([
      { $match: { type: 'payment', ...dateQ } },
      { $group: { _id: '$user', totalReceivedSalaryThisMonth: { $sum: '$amount' } } },
    ]).then(a => Object.fromEntries(a.map(x => [String(x._id), x.totalReceivedSalaryThisMonth])));

    const repaymentsByUser = await PaymentLoan.aggregate([
      { $match: { type: 'repayment', ...dateQ } },
      { $group: { _id: '$user', totalPaidInstallmentsThisMonth: { $sum: '$amount' } } },
    ]).then(a => Object.fromEntries(a.map(x => [String(x._id), x.totalPaidInstallmentsThisMonth])));

    const rows = loanRows.map(r => ({
      ...r,
      totalReceivedSalaryThisMonth: paymentsByUser[String(r.userId)] || 0,
      totalPaidInstallmentsThisMonth: repaymentsByUser[String(r.userId)] || 0,
    }));

    res.json({ rows });
  } catch (e) { next(e); }
}

module.exports = { totals, rows };
