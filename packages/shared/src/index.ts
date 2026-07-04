// Shared TypeScript types, enums and validation schemas for HMS

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  STAFF = 'staff'
}

export enum GenderType {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum PaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
  CASH = 'cash',
  INSURANCE = 'insurance'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  RECORD_UPDATE = 'record_update',
  SYSTEM_ALERT = 'system_alert'
}

export enum NotificationStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed'
}

export enum ReferralStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
  DECLINED = 'declined'
}

export enum ConversationType {
  DIRECT = 'direct',
  DEPARTMENT = 'department',
  CASE = 'case'
}

export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance'
}

export enum AdmissionStatus {
  ADMITTED = 'admitted',
  DISCHARGED = 'discharged'
}

export enum LabOrderStatus {
  ORDERED = 'ordered',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Common interfaces
export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface PatientDTO {
  id: string;
  userId: string;
  dateOfBirth: string;
  gender: GenderType;
  phone: string;
  address?: string;
  nhisNumber?: string;
  emergencyContact?: string;
  user: UserDTO;
}

export interface DoctorDTO {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  bio?: string;
  consultDurationMin: number;
  departmentId?: string;
  user: UserDTO;
}

export interface StaffDTO {
  id: string;
  userId: string;
  departmentId: string;
  position: string;
  user: UserDTO;
}
