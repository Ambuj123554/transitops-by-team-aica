import { z } from 'zod';

export const createMaintenanceLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  serviceType: z.string().min(1, 'Service type is required').max(100),
  cost: z.number().positive('Cost must be a positive number'),
  date: z.coerce.date({ invalid_type_error: 'Valid date is required' }),
  status: z.enum(['ACTIVE', 'COMPLETED']).optional().default('ACTIVE'),
});

export const updateMaintenanceLogSchema = z.object({
  serviceType: z.string().min(1).max(100).optional(),
  cost: z.number().positive('Cost must be a positive number').optional(),
  date: z.coerce.date().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
});

export const maintenanceQuerySchema = z.object({
  vehicleId: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
});

export type CreateMaintenanceLogInput = z.infer<typeof createMaintenanceLogSchema>;
export type UpdateMaintenanceLogInput = z.infer<typeof updateMaintenanceLogSchema>;
export type MaintenanceQuery = z.infer<typeof maintenanceQuerySchema>;
