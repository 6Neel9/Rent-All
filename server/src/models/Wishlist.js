const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true }
}, {
  timestamps: false,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Compound unique index for user and listing combination
wishlistSchema.index({ userId: 1, listingId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
