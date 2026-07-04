import { z } from 'zod';
import { LabOrderStatus } from '@hms/shared';

export const createLabOrderSchema = z.object({
  patientId: z.string().uuid(),
  departmentId: z.string().uuid(),
  testName: z.string().min(1).max(150),
});

export const updateLabOrderStatusSchema = z.object({
  status: z.nativeEnum(LabOrderStatus),
});

export const addLabResultSchema = z.object({
  resultSummary: z.string().min(1),
  fileDocumentId: z.string().uuid().optional(),
});

export type CreateLabOrderInput = z.infer<typeof createLabOrderSchema>;
export type AddLabResultInput = z.infer<typeof addLabResultSchema>;
