const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function sign(user) {
  const payload = { sub: user._id.toString(), role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// POST /api/auth/register
// Public: creates a customer account
async function register(req, res, next) {
  try {
    const { name, email, password, cnic } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    if (cnic) {
      const cnicExists = await User.findOne({ cnic }).select('_id');
      if (cnicExists) return res.status(409).json({ message: 'CNIC already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const total = await User.countDocuments();
    const role = total === 0 ? 'superadmin' : 'customer';
    const user = await User.create({ name, email, passwordHash, role, cnic });
    const token = sign(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) { next(err); }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = sign(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) { next(err); }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };

// POST /api/auth/invite
// Protected: creates an account for someone and returns a temporary password
async function invite(req, res, next) {
  try {
    const { name, email, role = 'customer' } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'name and email are required' });
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const existing = await User.findOne({ email }).select('_id');
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    // generate a random temp password
    const temp = Math.random().toString(36).slice(-10) + 'A1!';
    const passwordHash = await bcrypt.hash(temp, 10);
    const user = await User.create({ name, email, role, passwordHash });
    return res.status(201).json({ user: user.toJSON(), temporaryPassword: temp });
  } catch (err) { next(err); }
}

module.exports.invite = invite;
