const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env at project root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const required = (key, fallback) => {
  const val = process.env[key] ?? fallback;
  if (val === undefined || val === '') {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  // We support two styles:
  // 1) MONGODB_URI with <<USER>> and <<PASSWORD>> placeholders + MONGODB_USER + MONGODB_PASSWORD
  // 2) Fully expanded MONGODB_URI without placeholders
  MONGODB_URI: required('MONGODB_URI'),
  MONGODB_USER: process.env.MONGODB_USER || '',
  MONGODB_PASSWORD: process.env.MONGODB_PASSWORD || '',
};
