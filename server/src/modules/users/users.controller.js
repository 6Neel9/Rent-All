const usersService = require('./users.service');
const { successResponse } = require('../../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const profile = await usersService.getProfile(userId);
    return successResponse(res, profile, 'Profile fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const updatedProfile = await usersService.updateProfile(userId, req.body);
    return successResponse(res, updatedProfile, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const publicProfile = await usersService.getPublicProfile(id);
    return successResponse(res, publicProfile, 'Public profile fetched successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile
};
