const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const createApp = () => {
  const app = express();

  // CORS
  const allowedOrigins = [
    process.env.ADMIN_ORIGIN || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://water-delivery-admin-panel.vercel.app',
  ];
  const corsOptions = {
    origin: function (origin, callback) {
      // allow server-to-server and same-origin (no origin header)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // JSON parser
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
