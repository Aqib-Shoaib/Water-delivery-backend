// GET /api/admin/users/:id
async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (err) { next(err); }
}
const bcrypt = require('bcryptjs');
const { User, ROLES } = require('../models/User');
const { PERMISSIONS } = require('../config/permissions');
const ADMIN_BOOTSTRAP_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET || '';
const { buildAuditFromReq } = require('../utils/auditLogger');

// GET /api/admin/users
async function list(req, res, next) {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(users);
  } catch (err) { next(err); }
}

// POST /api/admin/users
// body: { name, email, password, role, phone, permissions, region, cnic, firstName, lastName, employeeId, dob, cnicOrPassport, jobTitle, gender, joiningDate, designation, address, duties, companyPhone, companyEmail, companyBelongings, remarks, education, department, employeeType, shiftTimings, workLocation, basicSalary, allowances, deductions, status }
async function create(req, res, next) {
  try {
    const { name, email, password, role = 'customer', roleName = '', phone, permissions = [], region, cnic,
      firstName, lastName, employeeId, dob, cnicOrPassport, jobTitle, gender, joiningDate, designation, address, duties, companyPhone, companyEmail, companyBelongings, remarks,
      education, department, employeeType, shiftTimings, workLocation, basicSalary, allowances, deductions, status } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'invalid role' });
    if (role === 'superadmin' && req.user?.role !== 'superadmin') return res.status(403).json({ message: 'only superadmin can assign superadmin role' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'email already exists' });
    if (cnic) {
      const cnicExists = await User.findOne({ cnic });
      if (cnicExists) return res.status(409).json({ message: 'cnic already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, roleName, phone, permissions, region, cnic,
      firstName, lastName, employeeId, dob, cnicOrPassport, jobTitle, gender, joiningDate, designation, address, duties, companyPhone, companyEmail, companyBelongings, remarks,
      education, department, employeeType, shiftTimings, workLocation, basicSalary, allowances, deductions, status });
    // audit
    buildAuditFromReq(req, {
      action: 'adminUser:create',
      entity: 'User',
      entityId: String(user._id),
      meta: { name, email, role, roleName, phone, permissions, region, cnic, firstName, lastName, employeeId, dob, cnicOrPassport, jobTitle, gender, joiningDate, designation, address, duties, companyPhone, companyEmail, companyBelongings, remarks, education, department, employeeType, shiftTimings, workLocation, basicSalary, allowances, deductions, status }
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

// PUT /api/admin/users/:id
// body: can contain name, phone, role, permissions, region, password (optional), cnic and employee fields (including new employee record fields)
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updates = {};
    const { name, phone, role, roleName, permissions, password, region, cnic,
      firstName, lastName, employeeId, dob, cnicOrPassport, jobTitle, gender, joiningDate, designation, address, duties, companyPhone, companyEmail, companyBelongings, remarks,
      education, department, employeeType, shiftTimings, workLocation, basicSalary, allowances, deductions, status } = req.body;
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) {
      if (!ROLES.includes(role)) return res.status(400).json({ message: 'invalid role' });
      if (role === 'superadmin' && req.user?.role !== 'superadmin') return res.status(403).json({ message: 'only superadmin can assign superadmin role' });
      updates.role = role;
    }
    if (roleName !== undefined) updates.roleName = roleName;
    if (Array.isArray(permissions)) updates.permissions = permissions;
    if (region !== undefined) updates.region = region;
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);
    if (cnic !== undefined) {
      if (cnic) {
        const cnicExists = await User.findOne({ cnic, _id: { $ne: id } }).select('_id');
        if (cnicExists) return res.status(409).json({ message: 'cnic already exists' });
        updates.cnic = cnic;
      } else {
        updates.cnic = undefined;
      }
    }

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (employeeId !== undefined) updates.employeeId = employeeId;
    if (dob !== undefined) updates.dob = dob;
    if (cnicOrPassport !== undefined) updates.cnicOrPassport = cnicOrPassport;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (gender !== undefined) updates.gender = gender;
    if (joiningDate !== undefined) updates.joiningDate = joiningDate;
    if (designation !== undefined) updates.designation = designation;
    if (address !== undefined) updates.address = address;
    if (duties !== undefined) updates.duties = duties;
    if (companyPhone !== undefined) updates.companyPhone = companyPhone;
    if (companyEmail !== undefined) updates.companyEmail = companyEmail;
    if (companyBelongings !== undefined) updates.companyBelongings = companyBelongings;
    if (remarks !== undefined) updates.remarks = remarks;
    if (education !== undefined) updates.education = education;
    if (department !== undefined) updates.department = department;
    if (employeeType !== undefined) updates.employeeType = employeeType;
    if (shiftTimings !== undefined) updates.shiftTimings = shiftTimings;
    if (workLocation !== undefined) updates.workLocation = workLocation;
    if (basicSalary !== undefined) updates.basicSalary = basicSalary;
    if (allowances !== undefined) updates.allowances = allowances;
    if (deductions !== undefined) updates.deductions = deductions;
    if (status !== undefined) updates.status = status;

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
    // audit
    buildAuditFromReq(req, {
      action: 'adminUser:update',
      entity: 'User',
      entityId: String(user._id),
      meta: { updates }
    });
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
    // audit
    buildAuditFromReq(req, {
      action: 'adminUser:delete',
      entity: 'User',
      entityId: String(id)
    });
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
    const user = await User.create({ name, email, passwordHash, role: 'admin', phone, permissions: PERMISSIONS });
    // audit
    buildAuditFromReq(req, {
      action: 'adminUser:bootstrap',
      entity: 'User',
      entityId: String(user._id),
      meta: { email }
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, bootstrap, getOne };
