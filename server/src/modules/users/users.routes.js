const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { updateProfileSchema } = require('./users.validation');

router.get('/profile', authenticate, usersController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), usersController.updateProfile);
router.get('/:id', usersController.getPublicProfile);

module.exports = router;
