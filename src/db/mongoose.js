const mongoose = require('mongoose');
const { MONGODB_URI, MONGODB_USER, MONGODB_PASSWORD, NODE_ENV } = require('../config/env');

function buildMongoUri() {
  if (MONGODB_URI.includes('<<USER>>') || MONGODB_URI.includes('<<PASSWORD>>')) {
    if (!MONGODB_USER || !MONGODB_PASSWORD) {
      throw new Error('MONGODB_URI has placeholders but MONGODB_USER/MONGODB_PASSWORD not provided');
    }
    return MONGODB_URI
      .replace('<<USER>>', encodeURIComponent(MONGODB_USER))
      .replace('<<PASSWORD>>', encodeURIComponent(MONGODB_PASSWORD));
  }
  return MONGODB_URI;
}

const connectMongo = async () => {
  const uri = buildMongoUri();
  await mongoose.connect(uri, {
    // modern mongoose no longer needs options but keep harmless opts
    autoIndex: NODE_ENV !== 'production',
  });
  return mongoose.connection;
};

module.exports = { connectMongo };
