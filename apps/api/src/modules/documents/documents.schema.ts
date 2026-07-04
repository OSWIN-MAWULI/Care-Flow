import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  medicalRecordId: z.string().uuid(),
  fileUrl: z.string().url(),
  fileType: z.string().max(50),
});
