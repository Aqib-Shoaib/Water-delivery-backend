const { Schema, model, Types } = require('mongoose');

const supervisorAssignmentSchema = new Schema(
  {
    supervisor: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    staff: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

supervisorAssignmentSchema.index({ supervisor: 1, staff: 1, startedAt: 1 });

module.exports = { SupervisorAssignment: model('SupervisorAssignment', supervisorAssignmentSchema) };
