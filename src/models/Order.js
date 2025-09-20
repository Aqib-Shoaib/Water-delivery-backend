const { Schema, model, Types } = require('mongoose');

const ORDER_STATUSES = [
  'placed',      // customer placed order
  'assigned',    // admin assigned to driver
  'en_route',    // driver picked up and en route
  'delivered',   // delivered to customer
  'cancelled',   // cancelled by customer/admin
  'failed',      // failed delivery
];

const orderItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    customer: { type: Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    assignedDriver: { type: Types.ObjectId, ref: 'User' },
    region: { type: Types.ObjectId, ref: 'Region' },
    address: { type: String, required: true },
    notes: { type: String },
    // Optional: delivery window/time
    eta: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = { Order: model('Order', orderSchema), ORDER_STATUSES };
