const wishlistService = require('./wishlist.service');
const { successResponse } = require('../../utils/apiResponse');

const toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { listingId } = req.params;
    const result = await wishlistService.toggleWishlist(userId, listingId);
    const message = result.wishlisted ? 'Listing added to wishlist.' : 'Listing removed from wishlist.';
    return successResponse(res, result, message);
  } catch (err) {
    next(err);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const items = await wishlistService.getWishlist(userId);
    return successResponse(res, items, 'Wishlist items fetched successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  toggleWishlist,
  getWishlist
};
