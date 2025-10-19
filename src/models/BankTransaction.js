const { Schema, model, Types } = require('mongoose');

const bankTransactionSchema = new Schema(
  {
    account: { type: Types.ObjectId, ref: 'BankAccount', required: true, index: true },
    date: { type: Date, default: () => new Date(), index: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment', 'receipt'], required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    reference: { type: String },
    counterparty: { type: String },
    notes: { type: String },
    relatedVendor: { type: Types.ObjectId, ref: 'Vendor' },
    relatedInvoice: { type: Types.ObjectId, ref: 'Invoice' },
    relatedExpense: { type: Types.ObjectId, ref: 'Expense' },
  },
  { timestamps: true }
);

module.exports = { BankTransaction: model('BankTransaction', bankTransactionSchema) };
