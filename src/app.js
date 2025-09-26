const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api', routes);

  // Static files for uploads (e.g., logo)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Health root alias
  app.get('/', (req, res) => res.json({ status: 'ok' }));

  // Error handler (keep last)
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
