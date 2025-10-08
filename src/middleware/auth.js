const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { NODE_ENV } = require('../config/env');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function authRequired() {
  return async function (req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const [, token] = header.split(' ');
      if (!token) return res.status(401).json({ message: 'Unauthorized' });
      const payload = jwt.verify(token, JWT_SECRET);
      // fetch user to ensure still exists; select minimal fields
      const user = await User.findById(payload.sub).select('_id name email role permissions stars');
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      req.user = user;
      next();
    } catch (err) {
      if (NODE_ENV !== 'production') console.error('authRequired error:', err.message);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    // Superadmins implicitly satisfy any role requirement
    if (req.user.role === 'superadmin') return next();
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

function requirePermission(permission) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    // Superadmins implicitly have all permissions
    if (req.user.role === 'superadmin') return next();
    const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (!perms.includes(permission)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { authRequired, requireRole, requirePermission };
