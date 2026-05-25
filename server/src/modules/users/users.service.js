const User = require('../../models/User');
const Listing = require('../../models/Listing');
const Review = require('../../models/Review');

const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const userObj = user.toJSON();
  delete userObj.passwordHash;
  return userObj;
};

const updateProfile = async (userId, updateData) => {
  // Check if phone number is already taken by another user
  if (updateData.phone) {
    const existingUserWithPhone = await User.findOne({
      phone: updateData.phone,
      _id: { $ne: userId }
    });

    if (existingUserWithPhone) {
      const error = new Error('Phone number is already in use by another account.');
      error.statusCode = 400;
      throw error;
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

  const userObj = updatedUser.toJSON();
  delete userObj.passwordHash;
  return userObj;
};

const getPublicProfile = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash -email -phone -googleId');

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // Fetch active listings for this host
  const listings = await Listing.find({
    hostId: userId,
    status: 'ACTIVE'
  });

  // Since Mongoose arrays can be filtered using JS if we need primary image
  const formattedListings = listings.map(l => {
    const lObj = l.toJSON();
    lObj.images = lObj.images ? lObj.images.filter(img => img.isPrimary) : [];
    return lObj;
  });

  // Fetch latest 5 reviews received by this user
  const reviews = await Review.find({ revieweeId: userId })
    .limit(5)
    .sort({ createdAt: -1 })
    .populate('reviewerId', 'fullName avatarUrl');

  // Map populated field back to expected reviewer object
  const formattedReviews = reviews.map(r => {
    const rObj = r.toJSON();
    rObj.reviewer = rObj.reviewerId;
    delete rObj.reviewerId;
    return rObj;
  });

  return {
    profile: user.toJSON(),
    listings: formattedListings,
    reviews: formattedReviews
  };
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile
};
