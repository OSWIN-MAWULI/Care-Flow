import { z } from 'zod';

export const createRecordSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  diagnosis: z.string().min(1),
  notes: z.string().optional(),
  prescriptions: z.array(z.object({
    medication: z.string().min(1),
    dosage: z.string().min(1),
    instructions: z.string().optional(),
  })).optional(),
});

export const updateRecordSchema = z.object({
  diagnosis: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
