const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');

router.use(authenticate); // Require authentication for all payment routes

router.post('/create-order', paymentsController.createOrder);
router.post('/verify', paymentsController.verifyPayment);
router.post('/refund/:bookingId', requireRole('ADMIN'), paymentsController.refund);
router.get('/booking/:bookingId', paymentsController.getPaymentDetails);

module.exports = router;
