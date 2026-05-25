const mongoose = require('mongoose');

const listingImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
  order: { type: Number, required: true }
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
    }
  }
});

const listingAvailabilitySchema = new mongoose.Schema({
  blockedDate: { type: Date, required: true },
  reason: { type: String }
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
    }
  }
});

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pricePerDay: { type: Number, required: true },
  pricePerWeek: { type: Number },
  depositAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'UNDER_REVIEW', 'DELETED'], default: 'ACTIVE' },
  instantBook: { type: Boolean, default: false },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String },
  rules: { type: String, required: true },
  cancellationPolicy: { type: String, enum: ['FLEXIBLE', 'MODERATE', 'STRICT'], required: true },
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  images: [listingImageSchema],
  availabilities: [listingAvailabilitySchema]
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

module.exports = mongoose.model('Listing', listingSchema);
