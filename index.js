const { PORT } = require('./src/config/env');
const { createApp } = require('./src/app');
const { connectMongo } = require('./src/db/mongoose');
const mongoose = require('mongoose');

(async () => {
  try {
    await connectMongo();
    console.log('✅ MongoDB connected');

    const app = createApp();
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await mongoose.disconnect();
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
})();
