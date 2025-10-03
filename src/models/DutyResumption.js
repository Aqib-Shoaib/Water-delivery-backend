const { Schema, model, Types } = require('mongoose');

const dutyResumptionSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, default: 0 },
  note: { type: String },
}, { timestamps: true });

module.exports = { DutyResumption: model('DutyResumption', dutyResumptionSchema) };
