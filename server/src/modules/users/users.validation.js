const { z } = require('zod');

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long').optional(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  city: z.string().min(1, 'City cannot be empty').optional(),
  state: z.string().min(1, 'State cannot be empty').optional(),
  country: z.string().min(1, 'Country cannot be empty').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable()
});

module.exports = {
  updateProfileSchema
};
