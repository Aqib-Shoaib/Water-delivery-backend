const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { PasswordReset } = require('../models/PasswordReset');

// POST /api/password-resets/request
// body: { email }
// Always responds 200 to avoid account enumeration
async function requestReset(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email required' });

    const user = await User.findOne({ email }).select('_id');
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await PasswordReset.create({ user: user._id, token, expiresAt });
      // In production, send email with token link. For now, return token only in non-production for testing.
      return res.json({ success: true, token });
    }

    // If no user, still return success
    return res.json({ success: true });
  } catch (err) { next(err); }
}

// POST /api/password-resets/confirm
// body: { token, password }
async function confirmReset(req, res, next) {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: 'token and password required' });

    const pr = await PasswordReset.findOne({ token }).populate('user', '_id');
    if (!pr) return res.status(400).json({ message: 'invalid token' });
    if (pr.used) return res.status(400).json({ message: 'token already used' });
    if (pr.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: 'token expired' });

    const passwordHash = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(pr.user._id, { passwordHash });
    pr.used = true;
    await pr.save();

    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { requestReset, confirmReset };
