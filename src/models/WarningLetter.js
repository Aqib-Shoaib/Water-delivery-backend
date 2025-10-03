const { Schema, model, Types } = require('mongoose');

const warningLetterSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, default: Date.now },
  subject: { type: String },
  description: { type: String },
  fileUrl: { type: String },
}, { timestamps: true });

module.exports = { WarningLetter: model('WarningLetter', warningLetterSchema) };
