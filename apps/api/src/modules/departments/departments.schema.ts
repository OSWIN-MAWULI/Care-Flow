import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  headDoctorId: z.string().uuid().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  headDoctorId: z.string().uuid().nullable().optional(),
});

export const departmentParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
