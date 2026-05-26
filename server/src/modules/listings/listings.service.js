const mongoose = require('mongoose');
const Listing = require('../../models/Listing');
const Booking = require('../../models/Booking');
const Wishlist = require('../../models/Wishlist');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../../middleware/upload.middleware');

const getAll = async (filters = {}) => {
  const {
    categoryId,
    city,
    state,
    minPrice,
    maxPrice,
    startDate,
    endDate,
    instantBook,
    minRating,
    search,
    sortBy = 'newest',
    page = 1,
    limit = 12
  } = filters;

  const skip = (page - 1) * limit;

  // Build where query
  const query = {
    status: 'ACTIVE'
  };

  if (categoryId) {
    query.categoryId = categoryId;
  }

  if (city) {
    query.city = { $regex: new RegExp(city, 'i') };
  }

  if (state) {
    query.state = { $regex: new RegExp(state, 'i') };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.pricePerDay = {};
    if (minPrice !== undefined) query.pricePerDay.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.pricePerDay.$lte = Number(maxPrice);
  }

  if (instantBook !== undefined) {
    query.instantBook = instantBook === 'true' || instantBook === true;
  }

  if (minRating !== undefined) {
    query.avgRating = { $gte: Number(minRating) };
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } }
    ];
  }

  // Date Availability Filtering
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Find bookings that overlap
    const overlappingBookings = await Booking.find({
      status: { $in: ['CONFIRMED', 'ACTIVE'] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    }).select('listingId');

    const blockedListingIds = overlappingBookings.map(b => b.listingId);

    query._id = { $nin: blockedListingIds };
    query.availabilities = {
      $not: {
        $elemMatch: {
          blockedDate: { $gte: start, $lte: end }
        }
      }
    };
  }

  // Sorting
  let sortObj = {};
  switch (sortBy) {
    case 'price_asc':
      sortObj = { pricePerDay: 1 };
      break;
    case 'price_desc':
      sortObj = { pricePerDay: -1 };
      break;
    case 'rating':
      sortObj = { avgRating: -1 };
      break;
    case 'most_booked':
      sortObj = { totalBookings: -1 };
      break;
    case 'newest':
    default:
      sortObj = { createdAt: -1 };
      break;
  }

  const listings = await Listing.find(query)
    .sort(sortObj)
    .skip(Number(skip))
    .limit(Number(limit))
    .populate('hostId', 'fullName avatarUrl avgRating')
    .populate('categoryId', 'name slug');

  const formattedListings = listings.map(l => {
    const lObj = l.toJSON();
    lObj.host = lObj.hostId;
    lObj.category = lObj.categoryId;
    delete lObj.hostId;
    delete lObj.categoryId;
    lObj.images = lObj.images ? lObj.images.filter(img => img.isPrimary).slice(0, 1) : [];
    return lObj;
  });

  const total = await Listing.countDocuments(query);

  return { listings: formattedListings, total };
};

const getById = async (id, currentUserId = null) => {
  const listing = await Listing.findById(id)
    .populate('hostId', 'fullName avatarUrl avgRating totalReviews createdAt')
    .populate('categoryId', 'name slug');

  if (!listing || listing.status === 'DELETED') {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  let isWishlisted = false;
  if (currentUserId) {
    const wishlist = await Wishlist.findOne({
      userId: currentUserId,
      listingId: id
    });
    isWishlisted = !!wishlist;
  }

  // Note: Reviews are not embedded, so we fetch them separately if needed, 
  // but for the detail view, usually they are fetched via reviews module. 
  // We'll mimic the Prisma behavior by fetching the latest 5 reviews here.
  const Review = require('../../models/Review');
  const reviews = await Review.find({ listingId: id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('reviewerId', 'fullName avatarUrl');

  const formattedReviews = reviews.map(r => {
    const rObj = r.toJSON();
    rObj.reviewer = rObj.reviewerId;
    delete rObj.reviewerId;
    return rObj;
  });

  const lObj = listing.toJSON();
  lObj.host = lObj.hostId;
  lObj.category = lObj.categoryId;
  delete lObj.hostId;
  delete lObj.categoryId;
  
  // Sort images by order
  lObj.images = lObj.images ? lObj.images.sort((a, b) => a.order - b.order) : [];

  return {
    ...lObj,
    reviews: formattedReviews,
    isWishlisted
  };
};

const create = async (hostId, listingData) => {
  const listing = await Listing.create({
    ...listingData,
    hostId
  });
  return listing;
};

const update = async (id, hostId, listingData) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  if (listing.hostId.toString() !== hostId.toString()) {
    const error = new Error('You do not own this listing.');
    error.statusCode = 403;
    throw error;
  }

  const updatedListing = await Listing.findByIdAndUpdate(id, listingData, { new: true });
  return updatedListing;
};

const remove = async (id, hostId) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  if (listing.hostId.toString() !== hostId.toString()) {
    const error = new Error('You do not own this listing.');
    error.statusCode = 403;
    throw error;
  }

  listing.status = 'DELETED';
  await listing.save();

  return true;
};

const uploadListingImages = async (id, hostId, files) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  if (listing.hostId.toString() !== hostId.toString()) {
    const error = new Error('Unauthorized listing update.');
    error.statusCode = 403;
    throw error;
  }

  const currentCount = listing.images.length;
  if (currentCount + files.length > 10) {
    const error = new Error('Maximum 10 images are allowed per listing.');
    error.statusCode = 400;
    throw error;
  }

  const uploadPromises = files.map(async (file, index) => {
    const folder = `rentall/listings/${id}`;
    const uploadResult = await uploadBufferToCloudinary(file.buffer, folder);

    const hasPrimary = listing.images.some(img => img.isPrimary);
    const isPrimary = !hasPrimary && index === 0;

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      isPrimary,
      order: currentCount + index + 1
    };
  });

  const newImages = await Promise.all(uploadPromises);
  
  listing.images.push(...newImages);
  await listing.save();

  return listing.images;
};

const addImageUrl = async (id, hostId, imageData) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  if (listing.hostId.toString() !== hostId.toString()) {
    const error = new Error('Unauthorized listing update.');
    error.statusCode = 403;
    throw error;
  }

  const currentCount = listing.images.length;
  if (currentCount >= 10) {
    const error = new Error('Maximum 10 images are allowed per listing.');
    error.statusCode = 400;
    throw error;
  }

  const hasPrimary = listing.images.some(img => img.isPrimary);
  const newImage = {
    url: imageData.url,
    publicId: imageData.publicId,
    isPrimary: imageData.isPrimary || !hasPrimary,
    order: currentCount + 1
  };

  listing.images.push(newImage);
  await listing.save();

  return listing.images;
};

const deleteListingImage = async (listingId, imageId, hostId) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  if (listing.hostId.toString() !== hostId.toString()) {
    const error = new Error('Unauthorized listing update.');
    error.statusCode = 403;
    throw error;
  }

  const imageIndex = listing.images.findIndex(img => img._id.toString() === imageId.toString());
  if (imageIndex === -1) {
    const error = new Error('Image not found.');
    error.statusCode = 404;
    throw error;
  }

  const imageToDelete = listing.images[imageIndex];

  // Delete from Cloudinary
  await deleteFromCloudinary(imageToDelete.publicId);

  // Remove from array
  listing.images.splice(imageIndex, 1);

  // Re-evaluate primary image if the deleted image was primary
  if (imageToDelete.isPrimary && listing.images.length > 0) {
    listing.images[0].isPrimary = true;
  }

  await listing.save();
  return true;
};

const getHostListings = async (hostId) => {
  const listings = await Listing.find({
    hostId,
    status: { $ne: 'DELETED' }
  })
  .populate('categoryId', 'name')
  .sort({ createdAt: -1 });

  return listings.map(l => {
    const lObj = l.toJSON();
    // Ensure id is set
    if (!lObj.id && lObj._id) {
      lObj.id = lObj._id.toString();
      delete lObj._id;
    }
    lObj.category = lObj.categoryId;
    delete lObj.categoryId;
    lObj.images = lObj.images ? lObj.images.filter(img => img.isPrimary).slice(0, 1) : [];
    return lObj;
  });
};

const blockDates = async (listingId, hostId, blockedDate, reason) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  if (listing.hostId.toString() !== hostId.toString()) {
    const error = new Error('Unauthorized action.');
    error.statusCode = 403;
    throw error;
  }

  const dateObj = new Date(blockedDate);
  dateObj.setUTCHours(0, 0, 0, 0);

  // Check if exists
  const existingIndex = listing.availabilities.findIndex(
    a => a.blockedDate.getTime() === dateObj.getTime()
  );

  if (existingIndex !== -1) {
    listing.availabilities[existingIndex].reason = reason;
  } else {
    listing.availabilities.push({ blockedDate: dateObj, reason });
  }

  await listing.save();
  return listing.availabilities.find(a => a.blockedDate.getTime() === dateObj.getTime());
};

const unblockDate = async (listingId, availId, hostId) => {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }

  if (listing.hostId.toString() !== hostId.toString()) {
    const error = new Error('Unauthorized action.');
    error.statusCode = 403;
    throw error;
  }

  const initialLength = listing.availabilities.length;
  listing.availabilities = listing.availabilities.filter(a => a._id.toString() !== availId.toString());

  if (initialLength !== listing.availabilities.length) {
    await listing.save();
  }

  return true;
};

const getBlockedDates = async (listingId) => {
  const listing = await Listing.findById(listingId).select('availabilities');
  if (!listing) return [];
  
  return listing.availabilities.sort((a, b) => a.blockedDate - b.blockedDate);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  uploadListingImages,
  addImageUrl,
  deleteListingImage,
  getHostListings,
  blockDates,
  unblockDate,
  getBlockedDates
};
