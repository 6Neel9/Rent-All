const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate); // Require authentication for all wishlist endpoints

router.get('/', wishlistController.getWishlist);
router.post('/:listingId', wishlistController.toggleWishlist);

module.exports = router;
