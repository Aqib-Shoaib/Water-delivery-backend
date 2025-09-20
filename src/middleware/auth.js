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
      const user = await User.findById(payload.sub).select('_id name email role');
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
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { authRequired, requireRole };
