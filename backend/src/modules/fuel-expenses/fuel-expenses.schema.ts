import { z } from 'zod';

export const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  liters: z.number().min(0, 'Liters must be non-negative'),
  cost: z.number().min(0, 'Cost must be non-negative'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  tripId: z.string().optional(),
});

export const createExpenseSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  tripId: z.string().min(1, 'Trip ID is required'),
  tollCost: z.number().min(0, 'Toll cost must be non-negative').default(0),
  otherCost: z.number().min(0, 'Other cost must be non-negative').default(0),
});

export const fuelLogQuerySchema = z.object({
  vehicleId: z.string().optional(),
});

export const expenseQuerySchema = z.object({
  vehicleId: z.string().optional(),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
