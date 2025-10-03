const { Schema, model, Types } = require('mongoose');

const experienceLetterSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, default: Date.now },
  companyName: { type: String },
  remarks: { type: String },
  fileUrl: { type: String },
}, { timestamps: true });

module.exports = { ExperienceLetter: model('ExperienceLetter', experienceLetterSchema) };
