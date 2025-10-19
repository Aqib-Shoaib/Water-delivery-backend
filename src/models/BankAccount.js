const { Schema, model } = require('mongoose');

const bankAccountSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    type: { type: String, enum: ['bank', 'cash'], default: 'bank', index: true },
    accountNumber: { type: String },
    bankName: { type: String },
    branch: { type: String },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = { BankAccount: model('BankAccount', bankAccountSchema) };
