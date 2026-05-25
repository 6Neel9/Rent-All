const Wishlist = require('../../models/Wishlist');
const Listing = require('../../models/Listing');

const toggleWishlist = async (userId, listingId) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  const existing = await Wishlist.findOne({ userId, listingId });

  if (existing) {
    await Wishlist.findByIdAndDelete(existing._id);
    return { wishlisted: false };
  } else {
    await Wishlist.create({ userId, listingId });
    return { wishlisted: true };
  }
};

const getWishlist = async (userId) => {
  const wishlistItems = await Wishlist.find({ userId }).populate({
    path: 'listingId',
    populate: { path: 'hostId', select: 'fullName avatarUrl' }
  });

  return wishlistItems.map(item => {
    const listingObj = item.listingId ? item.listingId.toJSON() : null;
    if (listingObj) {
      listingObj.host = listingObj.hostId;
      delete listingObj.hostId;
      listingObj.images = listingObj.images ? listingObj.images.filter(img => img.isPrimary).slice(0, 1) : [];
    }
    return listingObj;
  }).filter(Boolean); // Filter out any nulls if listing was deleted
};

module.exports = {
  toggleWishlist,
  getWishlist
};
