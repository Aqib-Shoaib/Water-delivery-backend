const { PORT } = require('./src/config/env');
const { createApp } = require('./src/app');
const { connectMongo } = require('./src/db/mongoose');
const mongoose = require('mongoose');

(async () => {
  try {
    await connectMongo();
    console.log('✅ MongoDB connected');

    const app = createApp();
    const server = app.listen(PORT, '0.0.0.0', () => {
      const host = process.env.HOST || '0.0.0.0';
      console.log(`🚀 Server running on ${host}:${PORT} (reachable on LAN at http://<YOUR_PC_IP>:${PORT})`);
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
