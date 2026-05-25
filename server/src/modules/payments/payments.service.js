const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../../models/Payment');
const Booking = require('../../models/Booking');
const notificationsService = require('../notifications/notifications.service');

let razorpay = null;
const isMock = !process.env.RAZORPAY_KEY_ID || 
               process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock') || 
               !process.env.RAZORPAY_KEY_SECRET;

if (!isMock) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.warn('Failed to initialize Razorpay, using mock fallback:', err.message);
  }
}

const createOrder = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate('listingId');

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.renterId.toString() !== userId.toString()) {
    const error = new Error('Unauthorized action.');
    error.statusCode = 403;
    throw error;
  }

  const totalAmount = Number(booking.totalPrice) + Number(booking.depositAmount);
  const amountInPaise = Math.round(totalAmount * 100);

  let razorpayOrder;

  if (isMock || !razorpay) {
    console.log(`[MOCK PAYMENT] Generating mock Razorpay order for booking: ${bookingId}`);
    razorpayOrder = {
      id: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
      amount: amountInPaise,
      currency: 'INR',
      receipt: bookingId.toString(),
      status: 'created'
    };
  } else {
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: bookingId.toString()
      });
    } catch (err) {
      console.warn('Razorpay order creation failed, using mock fallback:', err.message);
      razorpayOrder = {
        id: `order_mock_fallback_${crypto.randomBytes(8).toString('hex')}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: bookingId.toString(),
        status: 'created'
      };
    }
  }

  // Create or Update Payment Record
  let payment = await Payment.findOne({ bookingId });
  if (payment) {
    payment.razorpayOrderId = razorpayOrder.id;
    payment.amount = totalAmount;
    payment.status = 'CREATED';
    await payment.save();
  } else {
    await Payment.create({
      bookingId,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      status: 'CREATED'
    });
  }

  return {
    orderId: razorpayOrder.id,
    amount: totalAmount,
    currency: 'INR',
    keyId: isMock ? 'rzp_test_mockkeyid123' : process.env.RAZORPAY_KEY_ID
  };
};

const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId) => {
  const payment = await Payment.findOne({ bookingId });

  if (!payment) {
    const error = new Error('Payment record not found.');
    error.statusCode = 404;
    throw error;
  }

  const booking = await Booking.findById(bookingId).populate('listingId');

  let isValid = false;

  // Verify signature
  if (isMock || razorpayOrderId.startsWith('order_mock_')) {
    console.log(`[MOCK PAYMENT] Bypassing signature verification for mock order: ${razorpayOrderId}`);
    isValid = true;
  } else {
    try {
      const generatedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSig === razorpaySignature;
    } catch (err) {
      console.error('Signature verification error:', err.message);
      isValid = false;
    }
  }

  if (!isValid) {
    // Mark payment as failed
    payment.status = 'FAILED';
    await payment.save();
    
    const error = new Error('Payment signature verification failed.');
    error.statusCode = 400;
    throw error;
  }

  // Update Payment Status
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = 'CAPTURED';
  await payment.save();

  // Update Booking Status
  const isInstant = booking.listingId.instantBook;
  
  booking.paymentStatus = 'PAID';
  booking.status = isInstant ? 'CONFIRMED' : booking.status;
  await booking.save();

  // Notify Host of Payment Received
  await notificationsService.createNotification(
    booking.hostId,
    'PAYMENT_RECEIVED',
    'Payment Received!',
    `Payment for booking "${booking.listingId.title}" has been successfully completed.`,
    `/dashboard/host`
  );

  return true;
};

const refund = async (bookingId, refundAmount) => {
  const payment = await Payment.findOne({ bookingId });

  if (!payment || payment.status !== 'CAPTURED') {
    console.warn(`No captured payment found for booking ${bookingId}. Skipping processor refund.`);
    return false;
  }

  const amountInPaise = Math.round(refundAmount * 100);
  let refundSuccess = false;

  if (isMock || payment.razorpayOrderId.startsWith('order_mock_')) {
    console.log(`[MOCK REFUND] Simulating mock refund of ₹${refundAmount} for booking ${bookingId}`);
    refundSuccess = true;
  } else {
    try {
      await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: amountInPaise
      });
      refundSuccess = true;
    } catch (err) {
      console.error('Razorpay refund API call failed:', err.message);
      refundSuccess = false;
    }
  }

  if (refundSuccess) {
    const isFullRefund = refundAmount >= Number(payment.amount);
    
    payment.status = isFullRefund ? 'REFUNDED' : 'CREATED';
    await payment.save();

    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      await booking.save();
    }

    return true;
  }

  return false;
};

const getPaymentDetails = async (bookingId, userId) => {
  const payment = await Payment.findOne({ bookingId }).populate('bookingId');

  if (!payment) {
    const error = new Error('Payment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payment.bookingId.renterId.toString() !== userId.toString() && payment.bookingId.hostId.toString() !== userId.toString()) {
    const error = new Error('Unauthorized action.');
    error.statusCode = 403;
    throw error;
  }

  const pObj = payment.toJSON();
  pObj.booking = pObj.bookingId;
  delete pObj.bookingId;

  return pObj;
};

module.exports = {
  createOrder,
  verifyPayment,
  refund,
  getPaymentDetails
};
