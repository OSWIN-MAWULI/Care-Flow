import { z } from 'zod';
import { GenderType } from '@hms/shared';

export const createDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  specialization: z.string().min(2).max(100),
  licenseNumber: z.string().min(2).max(50),
  bio: z.string().optional(),
  consultDurationMin: z.number().int().min(5).max(120).default(15),
  departmentId: z.string().uuid().optional(),
});

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  departmentId: z.string().uuid(),
  position: z.string().min(2).max(100),
});

export const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  email: z.string().email().optional(),
});

export const userQuerySchema = z.object({
  role: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
