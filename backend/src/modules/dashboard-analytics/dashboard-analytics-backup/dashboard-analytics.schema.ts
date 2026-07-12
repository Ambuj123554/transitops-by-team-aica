import { z } from 'zod';

export const kpiQuerySchema = z.object({
  vehicleType: z.string().optional(),
  status: z.string().optional(),
  region: z.string().optional(),
});

export type KpiQueryInput = z.infer<typeof kpiQuerySchema>;
