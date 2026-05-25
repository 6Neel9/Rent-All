const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock',
});

module.exports = cloudinary;
