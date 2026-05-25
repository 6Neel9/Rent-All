const mongoose = require('mongoose');

// Ensure crypto is available for MongoDB
const crypto = require('crypto');
if (!global.crypto) {
  global.crypto = crypto;
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    console.log(`Successfully connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
