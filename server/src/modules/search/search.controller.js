const Listing = require('../../models/Listing');
const Category = require('../../models/Category');
const listingsService = require('../listings/listings.service');
const { successResponse, paginatedResponse } = require('../../utils/apiResponse');

// Haversine Distance Formula (km)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const searchListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, ...filters } = req.query;
    const { listings, total } = await listingsService.getAll({
      ...filters,
      page: Number(page),
      limit: Number(limit)
    });
    return paginatedResponse(res, listings, total, page, limit, 'Search results fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const suggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return successResponse(res, { listings: [], categories: [] });
    }

    const regex = new RegExp(q, 'i');

    const [listings, categories] = await Promise.all([
      Listing.find({
        status: 'ACTIVE',
        title: { $regex: regex }
      })
      .select('_id title')
      .limit(5),
      
      Category.find({
        name: { $regex: regex }
      })
      .select('_id name slug')
      .limit(5)
    ]);

    const formatItems = (items) => items.map(item => {
      const obj = item.toJSON();
      obj.id = obj._id;
      delete obj._id;
      return obj;
    });

    return successResponse(res, { 
      listings: formatItems(listings), 
      categories: formatItems(categories) 
    }, 'Suggestions fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const nearby = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude (lat) and longitude (lng) are required.' });
    }

    const targetLat = Number(lat);
    const targetLng = Number(lng);
    const maxRadius = Number(radius);

    // Fetch all active listings
    const listings = await Listing.find({ status: 'ACTIVE' })
      .populate('hostId', 'fullName avatarUrl');

    // Filter and compute distance in-memory
    const results = listings
      .map((l) => {
        const listing = l.toJSON();
        listing.host = listing.hostId;
        delete listing.hostId;
        listing.images = listing.images ? listing.images.filter(img => img.isPrimary).slice(0, 1) : [];
        
        const distance = getDistance(targetLat, targetLng, listing.latitude, listing.longitude);
        return { ...listing, distance: Number(distance.toFixed(2)) };
      })
      .filter((listing) => listing.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);

    return successResponse(res, results, 'Nearby listings fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().populate('children');
    return successResponse(res, categories.map(c => c.toJSON()), 'Categories fetched successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchListings,
  suggestions,
  nearby,
  getCategories
};
