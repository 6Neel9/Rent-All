const { z } = require('zod');

const createListingSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long'),
  description: z.string().min(50, 'Description must be at least 50 characters long'),
  categoryId: z.string().uuid('Invalid category ID'),
  pricePerDay: z.number().positive('Price per day must be a positive number'),
  pricePerWeek: z.number().positive('Price per week must be a positive number').optional().nullable(),
  depositAmount: z.number().nonnegative('Deposit amount cannot be negative').default(0),
  instantBook: z.boolean().default(false),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional().nullable(),
  rules: z.string().default(''),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT'])
});

const updateListingSchema = createListingSchema.partial();

const blockDateSchema = z.object({
  blockedDate: z.string().datetime({ message: 'Invalid ISO date-time string' }),
  reason: z.string().optional().nullable()
});

module.exports = {
  createListingSchema,
  updateListingSchema,
  blockDateSchema
};
