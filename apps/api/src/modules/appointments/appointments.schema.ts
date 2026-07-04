import { z } from 'zod';
import { AppointmentStatus } from '@hms/shared';

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  reason: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
});

export const availabilityQuerySchema = z.object({
  doctorId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
