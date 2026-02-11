const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Avatar Upload Configuration
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '') || '.png';
    const name = 'avatar_' + req.user._id + '_' + Date.now() + ext;
    cb(null, name);
  },
});
const upload = multer({ storage });
const uploadAvatarMiddleware = upload.single('avatar');

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'avatar file required' });
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: publicUrl }, { new: true });
    res.json({ user: user.toJSON(), url: publicUrl });
  } catch (err) { next(err); }
}

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
    const { name, email, password, cnic, username, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    if (username) {
      const usernameExists = await User.findOne({ username }).select('_id');
      if (usernameExists) return res.status(409).json({ message: 'Username already in use' });
    }

    if (phone) {
      const phoneExists = await User.findOne({ phone }).select('_id');
      if (phoneExists) return res.status(409).json({ message: 'Phone number already in use' });
    }

    if (cnic) {
      const cnicExists = await User.findOne({ cnic }).select('_id');
      if (cnicExists) return res.status(409).json({ message: 'CNIC already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const total = await User.countDocuments();
    const role = total === 0 ? 'superadmin' : 'customer';
    const user = await User.create({ name, email, passwordHash, role, cnic, username, phone });
    const token = sign(user);
    res.status(201).json({ token, user: user });
  } catch (err) { next(err); }
}


// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, identifier, password } = req.body;
    const loginIdentifier = identifier || email;

    if (!loginIdentifier || !password) return res.status(400).json({ message: 'identifier/email and password required' });
    
    // Find user by email, username, or phone
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier },
        { phone: loginIdentifier }
      ]
    }).select('+passwordHash');

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = sign(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) { next(err); }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const full = await User.findById(req.user._id)
    res.json({ user: full?.toJSON?.() || req.user })
  } catch (err) { next(err) }
}

// PATCH /api/auth/me
// body: { name?, phone?, address? }
async function updateMe(req, res, next) {
  try {
    const {
      name, phone, address, firstName, lastName, dob, gender, education,
      employeeId, cnic, cnicOrPassport, jobTitle, joiningDate, designation,
      duties, companyPhone, companyEmail, companyBelongings, remarks,
      department, employeeType, shiftTimings, workLocation,
      basicSalary, allowances, deductions, status
    } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (dob !== undefined) updates.dob = dob;
    if (gender !== undefined) updates.gender = gender;
    if (education !== undefined) updates.education = education;
    if (employeeId !== undefined) updates.employeeId = employeeId;
    if (cnic !== undefined) updates.cnic = cnic || undefined;
    if (cnicOrPassport !== undefined) updates.cnicOrPassport = cnicOrPassport;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (joiningDate !== undefined) updates.joiningDate = joiningDate;
    if (designation !== undefined) updates.designation = designation;
    if (duties !== undefined) updates.duties = duties;
    if (companyPhone !== undefined) updates.companyPhone = companyPhone;
    if (companyEmail !== undefined) updates.companyEmail = companyEmail;
    if (companyBelongings !== undefined) updates.companyBelongings = companyBelongings;
    if (remarks !== undefined) updates.remarks = remarks;
    if (department !== undefined) updates.department = department;
    if (employeeType !== undefined) updates.employeeType = employeeType;
    if (shiftTimings !== undefined) updates.shiftTimings = shiftTimings;
    if (workLocation !== undefined) updates.workLocation = workLocation;
    if (basicSalary !== undefined) updates.basicSalary = basicSalary;
    if (allowances !== undefined) updates.allowances = allowances;
    if (deductions !== undefined) updates.deductions = deductions;
    if (status !== undefined) updates.status = status;
    const { pushToken } = req.body;
    if (pushToken !== undefined) updates.pushToken = pushToken;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user: user.toJSON() });
  } catch (err) { next(err); }
}

module.exports = { register, login, me, updateMe, uploadAvatar, uploadAvatarMiddleware };

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
