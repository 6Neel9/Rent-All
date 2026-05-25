const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/', authenticate, reviewsController.createReview);
router.get('/listing/:listingId', reviewsController.getListingReviews);
router.get('/user/:userId', reviewsController.getUserReviews);

module.exports = router;
