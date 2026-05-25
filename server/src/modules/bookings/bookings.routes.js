const express = require('express');
const router = express.Router();
const bookingsController = require('./bookings.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const { 
  createBookingSchema, 
  cancelBookingSchema, 
  rejectBookingSchema 
} = require('./bookings.validation');

router.use(authenticate); // Require authentication for all booking routes

router.post('/', validate(createBookingSchema), bookingsController.createBooking);
router.get('/', bookingsController.getMyBookings);
router.get('/host', requireRole('HOST', 'BOTH'), bookingsController.getHostBookings);
router.get('/:id', bookingsController.getBookingById);

router.put('/:id/confirm', requireRole('HOST', 'BOTH'), bookingsController.confirmBooking);
router.put('/:id/reject', requireRole('HOST', 'BOTH'), validate(rejectBookingSchema), bookingsController.rejectBooking);
router.put('/:id/cancel', validate(cancelBookingSchema), bookingsController.cancelBooking);
router.put('/:id/complete', requireRole('HOST', 'BOTH'), bookingsController.markComplete);

module.exports = router;
