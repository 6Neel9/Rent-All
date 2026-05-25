const paymentsService = require('./payments.service');
const { successResponse } = require('../../utils/apiResponse');

const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.userId;
    const orderDetails = await paymentsService.createOrder(bookingId, userId);
    return successResponse(res, orderDetails, 'Razorpay order created successfully.');
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;
    await paymentsService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId);
    return successResponse(res, null, 'Payment verified and captured successfully.');
  } catch (err) {
    next(err);
  }
};

const refund = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { amount } = req.body;
    const success = await paymentsService.refund(bookingId, amount);
    if (!success) {
      return res.status(400).json({ success: false, message: 'Refund processing failed.' });
    }
    return successResponse(res, null, 'Refund processed successfully.');
  } catch (err) {
    next(err);
  }
};

const getPaymentDetails = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;
    const payment = await paymentsService.getPaymentDetails(bookingId, userId);
    return successResponse(res, payment, 'Payment details fetched successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  refund,
  getPaymentDetails
};
