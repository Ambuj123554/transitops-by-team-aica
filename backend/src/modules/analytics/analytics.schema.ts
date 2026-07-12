import { z } from 'zod';

// Analytics endpoints mostly use query params; keep a minimal schema set
export const analyticsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
