const { AuditLog } = require('../models/AuditLog');

// GET /api/audit-logs
// query: page, limit, action, entity, userId, q (search in meta), from, to
const list = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entity,
      userId,
      q,
      from,
      to,
    } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (userId) filter.user = userId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (q) {
      // search in action/entity/entityId and meta stringified; use $or for basic text search
      const rx = new RegExp(q, 'i');
      filter.$or = [
        { action: rx },
        { entity: rx },
        { entityId: rx },
        { ip: rx },
        { userAgent: rx },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = { list };
