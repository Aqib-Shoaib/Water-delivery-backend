const { Schema, model } = require('mongoose');

const holidaySchema = new Schema({
  date: { type: Date, required: true, unique: true, index: true },
  name: { type: String, default: '' },
}, { timestamps: true });

module.exports = { Holiday: model('Holiday', holidaySchema) };
