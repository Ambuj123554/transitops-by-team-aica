import { z } from 'zod';

export const createTripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  cargoWeightKg: z.coerce.number().positive('Cargo weight must be positive'),
  plannedDistanceKm: z.coerce.number().positive('Planned distance must be positive'),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
});

export const dispatchTripSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
});

export const completeTripSchema = z.object({
  actualDistanceKm: z.coerce.number().positive('Actual distance must be positive'),
  finalOdometer: z.coerce.number().positive('Final odometer must be positive'),
  fuelConsumedLiters: z.coerce.number().positive('Fuel consumed must be positive').optional(),
  revenue: z.coerce.number().min(0, 'Revenue cannot be negative').optional(),
});

export const tripQuerySchema = z.object({
  status: z.string().optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type DispatchTripInput = z.infer<typeof dispatchTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
