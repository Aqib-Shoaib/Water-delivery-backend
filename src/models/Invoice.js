const { Schema, model, Types } = require('mongoose');

const INVOICE_STATUSES = ['pending', 'paid', 'cancelled'];

const invoiceLineSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product' },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    order: { type: Types.ObjectId, ref: 'Order', required: true, index: true },
    number: { type: String, required: true, unique: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'pending', index: true },
    issuedAt: { type: Date, default: () => new Date() },
    paidAt: { type: Date },
    dueDate: { type: Date },
    currency: { type: String, default: 'USD' },
    lineItems: { type: [invoiceLineSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String },
    customer: { type: Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = { Invoice: model('Invoice', invoiceSchema), INVOICE_STATUSES };
