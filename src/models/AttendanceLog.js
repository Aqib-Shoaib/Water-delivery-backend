const { Schema, model, Types } = require('mongoose');

const attendanceLogSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    unit: { type: String },
    status: { type: String, enum: ['present', 'absent', 'leave', 'half-day'], default: 'present' },
    // Optional classification for leave days
    leaveType: { type: String, enum: ['medical', 'annual', 'casual', 'other', ''], default: '' },
    // Optional hours tracking
    workHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    remarks: { type: String },
  },
  { timestamps: true }
);

attendanceLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = { AttendanceLog: model('AttendanceLog', attendanceLogSchema) };
