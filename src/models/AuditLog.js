const { Schema, model, Types } = require('mongoose');

const auditLogSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    entity: { type: String, index: true },
    entityId: { type: String, index: true },
    meta: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

module.exports = { AuditLog: model('AuditLog', auditLogSchema) };
