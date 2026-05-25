const listingsService = require('./listings.service');
const { successResponse, paginatedResponse } = require('../../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, ...filters } = req.query;
    const { listings, total } = await listingsService.getAll({
      ...filters,
      page: Number(page),
      limit: Number(limit)
    });
    return paginatedResponse(res, listings, total, page, limit, 'Listings fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId || null;
    const listing = await listingsService.getById(id, currentUserId);
    return successResponse(res, listing, 'Listing details fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const hostId = req.user.userId;
    const listing = await listingsService.create(hostId, req.body);
    return successResponse(res, listing, 'Listing created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    const listing = await listingsService.update(id, hostId, req.body);
    return successResponse(res, listing, 'Listing updated successfully.');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    await listingsService.remove(id, hostId);
    return successResponse(res, null, 'Listing deleted successfully.');
  } catch (err) {
    next(err);
  }
};

const uploadImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded.' });
    }

    const savedImages = await listingsService.uploadListingImages(id, hostId, files);
    return successResponse(res, savedImages, 'Images uploaded successfully.');
  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const hostId = req.user.userId;
    await listingsService.deleteListingImage(id, imageId, hostId);
    return successResponse(res, null, 'Image deleted successfully.');
  } catch (err) {
    next(err);
  }
};

const getHostListings = async (req, res, next) => {
  try {
    const hostId = req.user.userId;
    const listings = await listingsService.getHostListings(hostId);
    return successResponse(res, listings, 'Host listings fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const blockDates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    const { blockedDate, reason } = req.body;
    const availability = await listingsService.blockDates(id, hostId, blockedDate, reason);
    return successResponse(res, availability, 'Date blocked successfully.');
  } catch (err) {
    next(err);
  }
};

const unblockDate = async (req, res, next) => {
  try {
    const { id, availId } = req.params;
    const hostId = req.user.userId;
    await listingsService.unblockDate(id, availId, hostId);
    return successResponse(res, null, 'Date unblocked successfully.');
  } catch (err) {
    next(err);
  }
};

const getBlockedDates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blockedDates = await listingsService.getBlockedDates(id);
    return successResponse(res, blockedDates, 'Blocked dates fetched successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  uploadImages,
  deleteImage,
  getHostListings,
  blockDates,
  unblockDate,
  getBlockedDates
};
