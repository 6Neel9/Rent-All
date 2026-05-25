const bookingsService = require('./bookings.service');
const { successResponse } = require('../../utils/apiResponse');

const createBooking = async (req, res, next) => {
  try {
    const renterId = req.user.userId;
    const result = await bookingsService.createBooking(renterId, req.body);
    return successResponse(res, result, 'Booking created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const renterId = req.user.userId;
    const bookings = await bookingsService.getMyBookings(renterId);
    return successResponse(res, bookings, 'Renter bookings fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getHostBookings = async (req, res, next) => {
  try {
    const hostId = req.user.userId;
    const bookings = await bookingsService.getHostBookings(hostId);
    return successResponse(res, bookings, 'Host bookings fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const booking = await bookingsService.getBookingById(id, userId);
    return successResponse(res, booking, 'Booking details fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    const booking = await bookingsService.confirmBooking(id, hostId);
    return successResponse(res, booking, 'Booking confirmed successfully.');
  } catch (err) {
    next(err);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    const { cancelReason } = req.body;
    const booking = await bookingsService.rejectBooking(id, hostId, cancelReason);
    return successResponse(res, booking, 'Booking request rejected successfully.');
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { cancelReason } = req.body;
    const booking = await bookingsService.cancelBooking(id, userId, cancelReason);
    return successResponse(res, booking, 'Booking cancelled successfully.');
  } catch (err) {
    next(err);
  }
};

const markComplete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    const booking = await bookingsService.markComplete(id, hostId);
    return successResponse(res, booking, 'Booking marked as complete.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getHostBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  markComplete
};
