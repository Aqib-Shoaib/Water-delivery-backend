const { Schema, model, Types } = require('mongoose');

const resignationSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, default: Date.now },
  reason: { type: String },
  finalSettlement: { type: Number, default: 0 },
  fileUrl: { type: String },
}, { timestamps: true });

module.exports = { Resignation: model('Resignation', resignationSchema) };
