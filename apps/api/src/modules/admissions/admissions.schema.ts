import { z } from 'zod';

export const admitPatientSchema = z.object({
  patientId: z.string().uuid(),
  wardId: z.string().uuid(),
  reason: z.string().min(1),
});

export const dischargeSchema = z.object({
  dischargeNotes: z.string().optional(),
});

export const createWardSchema = z.object({
  name: z.string().min(2).max(100),
  departmentId: z.string().uuid(),
  capacity: z.number().int().positive(),
  bedPrefix: z.string().default('B'),
});

export type AdmitPatientInput = z.infer<typeof admitPatientSchema>;
export type CreateWardInput = z.infer<typeof createWardSchema>;
