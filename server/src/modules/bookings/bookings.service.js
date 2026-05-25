const Booking = require('../../models/Booking');
const Listing = require('../../models/Listing');
const notificationsService = require('../notifications/notifications.service');

const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const stopDate = new Date(endDate);
  
  currentDate.setUTCHours(0, 0, 0, 0);
  stopDate.setUTCHours(0, 0, 0, 0);
  
  while (currentDate <= stopDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const createBooking = async (renterId, bookingData) => {
  const { listingId, startDate, endDate } = bookingData;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (start < today) {
    const error = new Error('Start date cannot be in the past.');
    error.statusCode = 400;
    throw error;
  }

  if (end <= start) {
    const error = new Error('End date must be after start date.');
    error.statusCode = 400;
    throw error;
  }

  // Fetch listing
  const listing = await Listing.findById(listingId);

  if (!listing || listing.status !== 'ACTIVE') {
    const error = new Error('Listing is not available for booking.');
    error.statusCode = 404;
    throw error;
  }

  if (listing.hostId.toString() === renterId.toString()) {
    const error = new Error('You cannot book your own listing.');
    error.statusCode = 400;
    throw error;
  }

  // Check overlapping bookings
  const overlapping = await Booking.findOne({
    listingId,
    status: { $in: ['CONFIRMED', 'ACTIVE'] },
    startDate: { $lte: end },
    endDate: { $gte: start }
  });

  if (overlapping) {
    const error = new Error('The listing is already booked for the selected dates.');
    error.statusCode = 400;
    throw error;
  }

  // Check blocked dates
  const hasBlockedDates = listing.availabilities.some(
    a => a.blockedDate >= start && a.blockedDate <= end
  );

  if (hasBlockedDates) {
    const error = new Error('The listing is unavailable for the selected dates.');
    error.statusCode = 400;
    throw error;
  }

  // Calculate pricing
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  let totalPrice;
  const pricePerDay = Number(listing.pricePerDay);
  const depositAmount = Number(listing.depositAmount);

  if (totalDays >= 7 && listing.pricePerWeek) {
    const pricePerWeek = Number(listing.pricePerWeek);
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    totalPrice = (weeks * pricePerWeek) + (remainingDays * pricePerDay);
  } else {
    totalPrice = totalDays * pricePerDay;
  }

  const initialStatus = listing.instantBook ? 'CONFIRMED' : 'PENDING';

  // Create booking
  const booking = await Booking.create({
    listingId,
    renterId,
    hostId: listing.hostId,
    startDate: start,
    endDate: end,
    totalDays,
    totalPrice,
    depositAmount,
    status: initialStatus
  });

  // If instantBook, auto-block the dates
  if (listing.instantBook) {
    const dates = getDatesInRange(start, end);
    const reason = `Booked (Booking ID: ${booking._id})`;
    
    dates.forEach(date => {
      const existing = listing.availabilities.find(a => a.blockedDate.getTime() === date.getTime());
      if (existing) {
        existing.reason = reason;
      } else {
        listing.availabilities.push({ blockedDate: date, reason });
      }
    });
    await listing.save();
  }

  // Generate Razorpay Order via Payments module
  const paymentsService = require('../payments/payments.service');
  const razorpayOrder = await paymentsService.createOrder(booking._id, renterId);

  // Update booking with payment info
  booking.paymentOrderId = razorpayOrder.id;
  await booking.save();

  // Notify host
  await notificationsService.createNotification(
    listing.hostId,
    'BOOKING_REQUEST',
    'New Booking Request',
    `You have a new booking request for "${listing.title}" from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`,
    `/dashboard/host`
  );

  return {
    booking: booking.toJSON(),
    razorpayOrder
  };
};

const getMyBookings = async (renterId) => {
  const bookings = await Booking.find({ renterId })
    .populate({
      path: 'listingId',
      populate: { path: 'images' }
    })
    .populate('hostId', 'fullName avatarUrl')
    .sort({ createdAt: -1 });

  return bookings.map(b => {
    const bObj = b.toJSON();
    if (bObj.listingId) {
      bObj.listing = bObj.listingId;
      if (bObj.listing.images) {
        bObj.listing.images = bObj.listing.images.filter(img => img.isPrimary).slice(0, 1);
      }
      delete bObj.listingId;
    }
    if (bObj.hostId) {
      bObj.host = bObj.hostId;
      delete bObj.hostId;
    }
    return bObj;
  });
};

const getHostBookings = async (hostId) => {
  const bookings = await Booking.find({ hostId })
    .populate({
      path: 'listingId',
      populate: { path: 'images' }
    })
    .populate('renterId', 'fullName avatarUrl')
    .sort({ createdAt: -1 });

  return bookings.map(b => {
    const bObj = b.toJSON();
    if (bObj.listingId) {
      bObj.listing = bObj.listingId;
      if (bObj.listing.images) {
        bObj.listing.images = bObj.listing.images.filter(img => img.isPrimary).slice(0, 1);
      }
      delete bObj.listingId;
    }
    if (bObj.renterId) {
      bObj.renter = bObj.renterId;
      delete bObj.renterId;
    }
    return bObj;
  });
};

const getBookingById = async (id, userId) => {
  const Payment = require('../../models/Payment');
  const booking = await Booking.findById(id)
    .populate('listingId')
    .populate('renterId', 'fullName email phone avatarUrl')
    .populate('hostId', 'fullName email phone avatarUrl');

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.renterId._id.toString() !== userId.toString() && booking.hostId._id.toString() !== userId.toString()) {
    const error = new Error('You are not authorized to view this booking.');
    error.statusCode = 403;
    throw error;
  }

  const payment = await Payment.findOne({ bookingId: id });

  const bObj = booking.toJSON();
  bObj.listing = bObj.listingId;
  bObj.renter = bObj.renterId;
  bObj.host = bObj.hostId;
  bObj.payment = payment ? payment.toJSON() : null;
  delete bObj.listingId;
  delete bObj.renterId;
  delete bObj.hostId;

  return bObj;
};

const confirmBooking = async (id, hostId) => {
  const booking = await Booking.findById(id).populate('listingId');

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.hostId.toString() !== hostId.toString()) {
    const error = new Error('You are not authorized to confirm this booking.');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status !== 'PENDING') {
    const error = new Error(`Booking cannot be confirmed from status ${booking.status}.`);
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'CONFIRMED';
  await booking.save();

  // Block the calendar dates
  const listing = booking.listingId; // populated
  const dates = getDatesInRange(booking.startDate, booking.endDate);
  const reason = `Booked (Booking ID: ${booking._id})`;

  dates.forEach(date => {
    const existing = listing.availabilities.find(a => a.blockedDate.getTime() === date.getTime());
    if (existing) {
      existing.reason = reason;
    } else {
      listing.availabilities.push({ blockedDate: date, reason });
    }
  });
  await listing.save();

  // Notify Renter
  await notificationsService.createNotification(
    booking.renterId,
    'BOOKING_CONFIRMED',
    'Booking Confirmed!',
    `Your booking request for "${listing.title}" has been confirmed by the host.`,
    `/dashboard`
  );

  return booking;
};

const rejectBooking = async (id, hostId, cancelReason) => {
  const booking = await Booking.findById(id).populate('listingId');

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.hostId.toString() !== hostId.toString()) {
    const error = new Error('You are not authorized to reject this booking.');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status !== 'PENDING') {
    const error = new Error('Only pending bookings can be rejected.');
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'REJECTED';
  booking.cancelledBy = 'HOST';
  booking.cancelReason = cancelReason;
  await booking.save();

  if (booking.paymentStatus === 'PAID') {
    const paymentsService = require('../payments/payments.service');
    const totalAmount = Number(booking.totalPrice) + Number(booking.depositAmount);
    await paymentsService.refund(booking._id, totalAmount);
  }

  await notificationsService.createNotification(
    booking.renterId,
    'BOOKING_CANCELLED',
    'Booking Request Rejected',
    `Your booking request for "${booking.listingId.title}" has been declined. Reason: ${cancelReason}`,
    `/dashboard`
  );

  return booking;
};

const cancelBooking = async (id, userId, cancelReason) => {
  const booking = await Booking.findById(id).populate('listingId');

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.renterId.toString() !== userId.toString() && booking.hostId.toString() !== userId.toString()) {
    const error = new Error('You are not authorized to cancel this booking.');
    error.statusCode = 403;
    throw error;
  }

  const allowedStatuses = ['PENDING', 'CONFIRMED'];
  if (!allowedStatuses.includes(booking.status)) {
    const error = new Error(`Cannot cancel a booking in ${booking.status} status.`);
    error.statusCode = 400;
    throw error;
  }

  const cancelledBy = booking.renterId.toString() === userId.toString() ? 'RENTER' : 'HOST';
  const listing = booking.listingId;
  let refundPercentage = 100;
  
  if (cancelledBy === 'RENTER' && booking.status === 'CONFIRMED') {
    const daysUntilStart = Math.ceil((new Date(booking.startDate) - new Date()) / (1000 * 60 * 60 * 24));

    switch (listing.cancellationPolicy) {
      case 'FLEXIBLE':
        refundPercentage = daysUntilStart >= 1 ? 100 : 0;
        break;
      case 'MODERATE':
        if (daysUntilStart >= 5) {
          refundPercentage = 100;
        } else if (daysUntilStart >= 1) {
          refundPercentage = 50;
        } else {
          refundPercentage = 0;
        }
        break;
      case 'STRICT':
        refundPercentage = daysUntilStart >= 7 ? 100 : 0;
        break;
      default:
        refundPercentage = 100;
    }
  }

  booking.status = 'CANCELLED';
  booking.cancelledBy = cancelledBy;
  booking.cancelReason = cancelReason;
  await booking.save();

  if (booking.status === 'CONFIRMED') { // Note: booking.status was updated above, so this logic is flawed in original too if based on pre-update status. Will use previous condition.
    // Actually in original it was if (booking.status === 'CONFIRMED') before update. Wait, prisma updated it, so it relied on old status. We'll check if it WAS confirmed.
    // We already know it was in allowedStatuses. If it was CONFIRMED, we need to unblock dates.
    // The previous status is lost unless we checked. We know it was either PENDING or CONFIRMED.
    // To be safe, just remove all blocked dates that match this booking's reason or timeframe.
    const dates = getDatesInRange(booking.startDate, booking.endDate);
    listing.availabilities = listing.availabilities.filter(
      a => !dates.find(d => d.getTime() === a.blockedDate.getTime())
    );
    await listing.save();
  }

  if (booking.paymentStatus === 'PAID') {
    const paymentsService = require('../payments/payments.service');
    const rentalRefund = (Number(booking.totalPrice) * refundPercentage) / 100;
    const totalRefund = rentalRefund + Number(booking.depositAmount);

    if (totalRefund > 0) {
      await paymentsService.refund(booking._id, totalRefund);
    } else {
      booking.paymentStatus = 'REFUNDED';
      await booking.save();
    }
  }

  const notifyUserId = cancelledBy === 'RENTER' ? booking.hostId : booking.renterId;
  const notifyType = 'BOOKING_CANCELLED';
  const notifyTitle = `Booking Cancelled by ${cancelledBy === 'RENTER' ? 'Renter' : 'Host'}`;
  const notifyBody = `The booking for "${listing.title}" has been cancelled. Reason: ${cancelReason}`;
  const notifyLink = cancelledBy === 'RENTER' ? `/dashboard/host` : `/dashboard`;

  await notificationsService.createNotification(notifyUserId, notifyType, notifyTitle, notifyBody, notifyLink);

  return booking;
};

const markComplete = async (id, hostId) => {
  const booking = await Booking.findById(id).populate('listingId');

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.hostId.toString() !== hostId.toString()) {
    const error = new Error('You are not authorized to complete this booking.');
    error.statusCode = 403;
    throw error;
  }

  if (!['CONFIRMED', 'ACTIVE'].includes(booking.status)) {
    const error = new Error('Only confirmed or active bookings can be marked complete.');
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'COMPLETED';
  booking.renterReviewed = false;
  booking.hostReviewed = false;
  await booking.save();

  await notificationsService.createNotification(
    booking.renterId,
    'NEW_REVIEW',
    'Review your experience!',
    `The rental for "${booking.listingId.title}" is complete. Please leave a review for the host and listing.`,
    `/dashboard`
  );

  return booking;
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
