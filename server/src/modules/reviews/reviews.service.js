const Review = require('../../models/Review');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const Listing = require('../../models/Listing');

const createReview = async (reviewerId, reviewData) => {
  const { bookingId, rating, comment } = reviewData;

  if (rating < 1 || rating > 5) {
    const error = new Error('Rating must be between 1 and 5.');
    error.statusCode = 400;
    throw error;
  }

  // Fetch booking
  const booking = await Booking.findById(bookingId).populate('listingId');

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.status !== 'COMPLETED') {
    const error = new Error('You can only review completed bookings.');
    error.statusCode = 400;
    throw error;
  }

  let type;
  let revieweeId;
  let isRenter = booking.renterId.toString() === reviewerId.toString();
  let isHost = booking.hostId.toString() === reviewerId.toString();

  if (!isRenter && !isHost) {
    const error = new Error('You are not authorized to review this booking.');
    error.statusCode = 403;
    throw error;
  }

  if (isRenter) {
    if (booking.renterReviewed) {
      const error = new Error('You have already reviewed this booking.');
      error.statusCode = 400;
      throw error;
    }
    type = 'RENTER_TO_HOST';
    revieweeId = booking.hostId;
  } else {
    if (booking.hostReviewed) {
      const error = new Error('You have already reviewed this booking.');
      error.statusCode = 400;
      throw error;
    }
    type = 'HOST_TO_RENTER';
    revieweeId = booking.renterId;
  }

  // Create review
  const review = await Review.create({
    bookingId,
    reviewerId,
    revieweeId,
    listingId: booking.listingId._id,
    rating,
    comment,
    type
  });

  // Update booking flag
  if (isRenter) {
    booking.renterReviewed = true;
  } else {
    booking.hostReviewed = true;
  }
  await booking.save();

  // Recalculate reviewee (User) average rating using aggregation
  const userStats = await Review.aggregate([
    { $match: { revieweeId: revieweeId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  if (userStats.length > 0) {
    await User.findByIdAndUpdate(revieweeId, {
      avgRating: userStats[0].avgRating || 0,
      totalReviews: userStats[0].count || 0
    });
  }

  // Recalculate listing average rating if reviewed by renter
  if (type === 'RENTER_TO_HOST') {
    const listingStats = await Review.aggregate([
      { $match: { listingId: booking.listingId._id, type: 'RENTER_TO_HOST' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (listingStats.length > 0) {
      await Listing.findByIdAndUpdate(booking.listingId._id, {
        avgRating: listingStats[0].avgRating || 0,
        totalReviews: listingStats[0].count || 0
      });
    }
  }

  return review;
};

const getListingReviews = async (listingId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ listingId, type: 'RENTER_TO_HOST' })
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .populate('reviewerId', 'fullName avatarUrl');

  const formattedReviews = reviews.map(r => {
    const rObj = r.toJSON();
    rObj.reviewer = rObj.reviewerId;
    delete rObj.reviewerId;
    return rObj;
  });

  const total = await Review.countDocuments({ listingId, type: 'RENTER_TO_HOST' });

  return { reviews: formattedReviews, total };
};

const getUserReviews = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ revieweeId: userId })
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .populate('reviewerId', 'fullName avatarUrl');

  const formattedReviews = reviews.map(r => {
    const rObj = r.toJSON();
    rObj.reviewer = rObj.reviewerId;
    delete rObj.reviewerId;
    return rObj;
  });

  const total = await Review.countDocuments({ revieweeId: userId });

  return { reviews: formattedReviews, total };
};

module.exports = {
  createReview,
  getListingReviews,
  getUserReviews
};
