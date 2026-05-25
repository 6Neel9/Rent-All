const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  fullName: { type: String, required: true },
  avatarUrl: { type: String },
  phone: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['RENTER', 'HOST', 'BOTH', 'ADMIN'], default: 'RENTER' },
  isVerified: { type: Boolean, default: false },
  isKycVerified: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true },
  bio: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
