const bcrypt = require('bcryptjs');
const { User, ROLES } = require('../models/User');
const ADMIN_BOOTSTRAP_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET || '';

// GET /api/admin/users
async function list(req, res, next) {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(users);
  } catch (err) { next(err); }
}

// POST /api/admin/users
// body: { name, email, password, role, phone, permissions }
async function create(req, res, next) {
  try {
    const { name, email, password, role = 'customer', phone, permissions = [] } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'invalid role' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'email already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, phone, permissions });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

// PUT /api/admin/users/:id
// body: can contain name, phone, role, permissions, password (optional)
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updates = {};
    const { name, phone, role, permissions, password } = req.body;
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) {
      if (!ROLES.includes(role)) return res.status(400).json({ message: 'invalid role' });
      updates.role = role;
    }
    if (Array.isArray(permissions)) updates.permissions = permissions;
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);

    // Prevent demoting the last remaining admin
    if (updates.role && updates.role !== 'admin') {
      const current = await User.findById(id).select('_id role');
      if (!current) return res.status(404).json({ message: 'Not found' });
      if (current.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) return res.status(400).json({ message: 'cannot demote the last admin' });
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (err) { next(err); }
}

// DELETE /api/admin/users/:id
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'cannot delete yourself' });
    }
    const target = await User.findById(id).select('_id role');
    if (!target) return res.status(404).json({ message: 'Not found' });
    if (target.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) return res.status(400).json({ message: 'cannot delete the last admin' });
    }
     await User.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// POST /api/admin/users/bootstrap
// One-time endpoint to create the first admin.
// Requirements:
// - No existing admin user in the database
// - Body must include { secret, name, email, password, phone }
// - secret must match process.env.ADMIN_BOOTSTRAP_SECRET
async function bootstrap(req, res, next) {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' }).select('_id');
    if (existingAdmin) return res.status(400).json({ message: 'admin already exists' });

    const { secret, name, email, password, phone } = req.body || {};
    if (!ADMIN_BOOTSTRAP_SECRET) return res.status(500).json({ message: 'bootstrap not configured' });
    if (!secret || secret !== ADMIN_BOOTSTRAP_SECRET) return res.status(403).json({ message: 'forbidden' });
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'admin', phone, permissions: [] });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, bootstrap };
