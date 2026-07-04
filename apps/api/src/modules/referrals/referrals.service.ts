import prisma from '../../prisma.js';
import { CreateReferralInput } from './referrals.schema.js';
import { ReferralStatus } from '@hms/shared';

export class ReferralsService {
  async create(input: CreateReferralInput, doctorUserId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorUserId },
      include: { department: true },
    });
    if (!doctor) throw new Error('Doctor profile not found');
    if (!doctor.departmentId) throw new Error('You must belong to a department to refer');

    // Verify the patient exists
    const patient = await prisma.patient.findUnique({ where: { id: input.patientId } });
    if (!patient) throw new Error('Patient not found');

    return prisma.referral.create({
      data: {
        patientId: input.patientId,
        referringDoctorId: doctor.id,
        referringDepartmentId: doctor.departmentId,
        referredToDepartmentId: input.referredToDepartmentId,
        referredToDoctorId: input.referredToDoctorId,
        reason: input.reason,
        status: ReferralStatus.PENDING,
      },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        referringDoctor: { include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } } },
        referredToDepartment: { select: { id: true, name: true } },
        referredToDoctor: { include: { user: { select: { id: true, email: true } } } },
      },
    });
  }

  async findById(id: string) {
    return prisma.referral.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        referringDoctor: { include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } } },
        referredToDepartment: { select: { id: true, name: true } },
        referredToDoctor: { include: { user: { select: { id: true, email: true } } } },
        conversations: {
          include: {
            participants: { include: { user: { select: { id: true, email: true } } } },
            messages: { include: { sender: { select: { id: true, email: true } } }, orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
  }

  async findByDepartment(departmentId: string) {
    return prisma.referral.findMany({
      where: { referredToDepartmentId: departmentId },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        referringDoctor: { include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } } },
        referredToDoctor: { include: { user: { select: { id: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByReferringDoctor(doctorId: string) {
    return prisma.referral.findMany({
      where: { referringDoctorId: doctorId },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        referredToDepartment: { select: { id: true, name: true } },
        referredToDoctor: { include: { user: { select: { id: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: ReferralStatus) {
    // Prevent invalid transitions
    const current = await prisma.referral.findUnique({ where: { id } });
    if (!current) throw new Error('Referral not found');

    if (current.status === 'completed' && status !== 'completed') {
      throw new Error('Cannot change status of a completed referral');
    }
    if (current.status === 'declined') {
      throw new Error('Cannot change status of a declined referral');
    }
    if (current.status === 'pending' && status === 'completed') {
      throw new Error('Referral must be accepted before it can be completed');
    }

    return prisma.referral.update({
      where: { id },
      data: { status },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        referringDoctor: { include: { user: { select: { id: true, email: true } } } },
        referredToDepartment: { select: { id: true, name: true } },
      },
    });
  }
}
