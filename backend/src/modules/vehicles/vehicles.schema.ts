import { z } from 'zod';

export const createVehicleSchema = z.object({
  regNo: z.string().min(1, 'Registration number is required').max(50),
  name: z.string().min(1, 'Vehicle name is required').max(100),
  type: z.string().min(1, 'Vehicle type is required').max(50),
  capacity: z.number().positive('Max capacity must be positive'),
  odometer: z.number().min(0, 'Odometer must be non-negative'),
  acquisitionCost: z.number().min(0, 'Acquisition cost must be non-negative'),
  region: z.string().max(100).optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional().default('AVAILABLE'),
});

export const updateVehicleSchema = z.object({
  regNo: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  type: z.string().min(1).max(50).optional(),
  capacity: z.number().positive('Max capacity must be positive').optional(),
  odometer: z.number().min(0).optional(),
  acquisitionCost: z.number().min(0).optional(),
  region: z.string().max(100).optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
});

export const vehicleQuerySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
  region: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;
