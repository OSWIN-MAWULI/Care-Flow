import { z } from 'zod';
import { GenderType } from '@hms/shared';

export const registerPatientSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  dateOfBirth: z.string().datetime().or(z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for date of birth',
  })),
  gender: z.nativeEnum(GenderType, { message: 'Invalid gender value' }),
  phone: z.string().min(9, { message: 'Phone number must be at least 9 characters long' }),
  address: z.string().optional(),
  nhisNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const requestResetSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters long' }),
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestResetInput = z.infer<typeof requestResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
