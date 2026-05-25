const express = require('express');
const router = express.Router();
const listingsController = require('./listings.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, optionalAuth, requireRole } = require('../../middleware/auth.middleware');
const { uploadImages } = require('../../middleware/upload.middleware');
const { 
  createListingSchema, 
  updateListingSchema, 
  blockDateSchema 
} = require('./listings.validation');

// Public routes
router.get('/', optionalAuth, listingsController.getAll);
router.get('/:id/availability', listingsController.getBlockedDates);
router.get('/:id', optionalAuth, listingsController.getById);

// Host protected routes
router.post('/', authenticate, requireRole('HOST', 'BOTH'), validate(createListingSchema), listingsController.create);
router.get('/host/mine', authenticate, requireRole('HOST', 'BOTH'), listingsController.getHostListings);
router.put('/:id', authenticate, requireRole('HOST', 'BOTH'), validate(updateListingSchema), listingsController.update);
router.delete('/:id', authenticate, requireRole('HOST', 'BOTH'), listingsController.remove);

// Image management routes
router.post('/:id/images', authenticate, requireRole('HOST', 'BOTH'), uploadImages, listingsController.uploadImages);
router.delete('/:id/images/:imageId', authenticate, requireRole('HOST', 'BOTH'), listingsController.deleteImage);

// Availability blocking routes
router.post('/:id/availability/block', authenticate, requireRole('HOST', 'BOTH'), validate(blockDateSchema), listingsController.blockDates);
router.delete('/:id/availability/:availId', authenticate, requireRole('HOST', 'BOTH'), listingsController.unblockDate);

module.exports = router;
