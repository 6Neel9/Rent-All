const { z } = require('zod');

const createBookingSchema = z.object({
  listingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid listing ID'),
  startDate: z.string().datetime({ message: 'Invalid start date format' }),
  endDate: z.string().datetime({ message: 'Invalid end date format' })
});

const cancelBookingSchema = z.object({
  cancelReason: z.string().min(5, 'Reason must be at least 5 characters long')
});

const rejectBookingSchema = z.object({
  cancelReason: z.string().min(5, 'Reason must be at least 5 characters long')
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
  rejectBookingSchema
};
