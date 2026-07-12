import { z } from 'zod';

export const createDocumentSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  name: z.string().min(1, 'Document name is required'),
  fileUrl: z.string().url('Must be a valid URL'),
  fileType: z.string().min(1, 'File type is required'),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
