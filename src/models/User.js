const { Schema, model, Types } = require('mongoose');

const ROLES = ['superadmin', 'admin', 'customer', 'driver'];

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    employeeId: { type: String, unique: true, sparse: true, index: true },
    dob: { type: Date },
    cnicOrPassport: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
    roleName: { type: String, default: '' },
    phone: { type: String },
    cnic: { type: String, unique: true, sparse: true, index: true },
    region: { type: Types.ObjectId, ref: 'Region', index: true },
    permissions: { type: [String], default: [], index: true },
    stars: { type: Number, default: 0 },
    jobTitle: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'], required: false },
    joiningDate: { type: Date },
    education: { type: String },
    department: { type: String },
    employeeType: { type: String },
    shiftTimings: { type: String },
    workLocation: { type: String },
    basicSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    status: { type: String, enum: ['working','terminated','waiting'], default: 'working', index: true },
    designation: { type: String },
    address: { type: String },
    duties: { type: String },
    companyPhone: { type: String },
    companyEmail: { type: String },
    companyBelongings: { type: String },
    remarks: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

module.exports = { User: model('User', userSchema), ROLES };
