const { createApp } = require('../src/app');
const app = createApp();

// Vercel serverless expects a handler function (req, res)
module.exports = (req, res) => app(req, res);
