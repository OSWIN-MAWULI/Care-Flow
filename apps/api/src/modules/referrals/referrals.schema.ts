import { z } from 'zod';
import { ReferralStatus } from '@hms/shared';

export const createReferralSchema = z.object({
  patientId: z.string().uuid(),
  referredToDepartmentId: z.string().uuid(),
  referredToDoctorId: z.string().uuid().optional(),
  reason: z.string().min(1),
});

export const updateReferralStatusSchema = z.object({
  status: z.nativeEnum(ReferralStatus),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type UpdateReferralStatusInput = z.infer<typeof updateReferralStatusSchema>;
