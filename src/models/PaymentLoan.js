const { Schema, model, Types } = require('mongoose');

const paymentLoanSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['payment', 'loan', 'repayment', 'leave-salary'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String },
    // Optional fields for loan applications (type: 'loan')
    applicationStatus: { type: String, enum: ['pending', 'approved', 'rejected', ''], default: '' },
    approvedAmount: { type: Number },
    monthlyInstallment: { type: Number },
    installmentsTotal: { type: Number },
    durationMonths: { type: Number },
    approvedByName: { type: String },
    approvedByDesignation: { type: String },
    approvedByPhone: { type: String },
    confirmedByName: { type: String },
    confirmedByDesignation: { type: String },
    confirmedByPhone: { type: String },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = { PaymentLoan: model('PaymentLoan', paymentLoanSchema) };
