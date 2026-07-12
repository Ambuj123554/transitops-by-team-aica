import { z } from 'zod';

export const createDriverSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  licenseNumber: z.string().min(1, 'License number is required').max(50),
  licenseCategory: z.string().min(1, 'License category is required').max(20),
  licenseExpiry: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Invalid date format for license expiry'
  ),
  contactNumber: z.string().min(1, 'Contact number is required').max(20),
  safetyScore: z.number().int().min(0).max(100).optional().default(80),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional().default('AVAILABLE'),
});

export const updateDriverSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  licenseNumber: z.string().min(1).max(50).optional(),
  licenseCategory: z.string().min(1).max(20).optional(),
  licenseExpiry: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format for license expiry')
    .optional(),
  contactNumber: z.string().min(1).max(20).optional(),
  safetyScore: z.number().int().min(0).max(100).optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
});

export const driverQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverQuery = z.infer<typeof driverQuerySchema>;
