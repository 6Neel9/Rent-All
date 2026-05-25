const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');

router.get('/', searchController.searchListings);
router.get('/suggestions', searchController.suggestions);
router.get('/nearby', searchController.nearby);
router.get('/categories', searchController.getCategories);

module.exports = router;
