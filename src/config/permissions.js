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
    // Regions
    'regions:read',
    'regions:write',
    // Orders
    'orders:read',
    'orders:write',
    // Invoices
    'invoices:read',
    'invoices:write',
    // Settings and notifications
    'settings:write',
    'notifications:write',
    // Audit
    'audit:read',
  ],
};
