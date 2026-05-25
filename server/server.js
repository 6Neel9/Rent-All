require('dotenv').config();
const crypto = require('crypto');
const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = http.createServer(app);

// Attach Socket.io
initSocket(server);

// Verify Database Connection
async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`========================================`);
      console.log(` RentAll Server running in [${NODE_ENV}] mode`);
      console.log(` Listening on port: http://localhost:${PORT}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Failed to start RentAll Server due to database connection error:', error);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});
