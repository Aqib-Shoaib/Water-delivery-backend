// Central permissions registry used by backend and surfaced to the Admin UI
// Keep names stable; clients can display friendly labels.
module.exports = {
  PERMISSIONS: [
    // Users
    'users:read',
    'users:write',
    // Products
    'products:read',
    'products:write',
    // Deals
    'deals:read',
    'deals:write',
    // Docs
    'docs:read',
    'docs:write',
    // Regions
    'regions:read',
    'regions:write',
    // Orders
    'orders:read',
    'orders:write',
    // Invoices
    'invoices:read',
    'invoices:write',
    // Attendance
    'attendance:read',
    'attendance:write',
    // Payments/Loans
    'payments:read',
    'payments:write',
    // Holidays
    'holidays:read',
    'holidays:write',
    // Salary slips
    'salarySlips:read',
    'salarySlips:write',
    // Supervisors
    'supervisors:read',
    'supervisors:write',
    // Employee actions
    'warnings:read',
    'warnings:write',
    'resignations:read',
    'resignations:write',
    'experienceLetters:read',
    'experienceLetters:write',
    'dutyResumptions:read',
    'dutyResumptions:write',
    // Employee analytics
    'employeeAnalytics:read',
    // File uploads
    'files:write',
    // Settings and notifications
    'settings:write',
    'notifications:write',
    // Audit
    'audit:read',
  ],
};
