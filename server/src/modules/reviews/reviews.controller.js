const reviewsService = require('./reviews.service');
const { successResponse, paginatedResponse } = require('../../utils/apiResponse');

const createReview = async (req, res, next) => {
  try {
    const reviewerId = req.user.userId;
    const review = await reviewsService.createReview(reviewerId, req.body);
    return successResponse(res, review, 'Review submitted successfully.', 201);
  } catch (err) {
    next(err);
  }
};

const getListingReviews = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { reviews, total } = await reviewsService.getListingReviews(
      listingId,
      Number(page),
      Number(limit)
    );
    return paginatedResponse(res, reviews, total, page, limit, 'Listing reviews fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { reviews, total } = await reviewsService.getUserReviews(
      userId,
      Number(page),
      Number(limit)
    );
    return paginatedResponse(res, reviews, total, page, limit, 'User reviews fetched successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getListingReviews,
  getUserReviews
};
