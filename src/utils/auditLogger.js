const { AuditLog } = require('../models/AuditLog');

async function logAudit({ userId, action, entity, entityId, meta, ip, userAgent }) {
  try {
    await AuditLog.create({ user: userId || null, action, entity, entityId, meta, ip, userAgent });
  } catch (e) {
    // swallow errors to avoid breaking main flow
    if (process.env.NODE_ENV !== 'production') console.error('audit log error:', e.message);
  }
}

function buildAuditFromReq(req, payload) {
  return logAudit({
    userId: req?.user?._id,
    action: payload.action,
    entity: payload.entity,
    entityId: payload.entityId,
    meta: payload.meta,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent']
  });
}

module.exports = { logAudit, buildAuditFromReq };
