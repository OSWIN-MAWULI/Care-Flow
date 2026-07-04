import prisma from '../../prisma.js';
import { AdmitPatientInput, CreateWardInput } from './admissions.schema.js';

export class AdmissionsService {
  async admit(input: AdmitPatientInput, doctorUserId: string) {
    const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
    if (!doctor) throw new Error('Doctor profile not found');

    return prisma.$transaction(async (tx: any) => {
      // Find an available bed in the ward
      const bed = await tx.bed.findFirst({
        where: { wardId: input.wardId, status: 'available' },
      });
      if (!bed) throw new Error('No available beds in this ward');

      // Check patient isn't already admitted
      const activeAdmission = await tx.admission.findFirst({
        where: { patientId: input.patientId, status: 'admitted' },
      });
      if (activeAdmission) throw new Error('Patient is already admitted');

      // Occupy bed and create admission
      await tx.bed.update({ where: { id: bed.id }, data: { status: 'occupied' } });

      return tx.admission.create({
        data: {
          patientId: input.patientId,
          bedId: bed.id,
          admittingDoctorId: doctor.id,
          reason: input.reason,
          status: 'admitted',
        },
        include: {
          patient: { include: { user: { select: { id: true, email: true } } } },
          bed: { include: { ward: true } },
          admittingDoctor: { include: { user: { select: { email: true } } } },
        },
      });
    });
  }

  async discharge(admissionId: string) {
    return prisma.$transaction(async (tx: any) => {
      const admission = await tx.admission.findUnique({
        where: { id: admissionId },
        include: { bed: true },
      });
      if (!admission) throw new Error('Admission not found');
      if (admission.status === 'discharged') throw new Error('Patient already discharged');

      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'available' },
      });

      return tx.admission.update({
        where: { id: admissionId },
        data: { status: 'discharged', dischargedAt: new Date() },
        include: {
          patient: { include: { user: { select: { email: true } } } },
          bed: { include: { ward: true } },
        },
      });
    });
  }

  async listAdmissions(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.admission.findMany({
      where,
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        bed: { include: { ward: true } },
        admittingDoctor: { include: { user: { select: { email: true } } } },
      },
      orderBy: { admittedAt: 'desc' },
    });
  }

  async listWards(departmentId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;

    return prisma.ward.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        beds: { orderBy: { bedNumber: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createWard(input: CreateWardInput) {
    return prisma.$transaction(async (tx: any) => {
      const ward = await tx.ward.create({
        data: {
          name: input.name,
          departmentId: input.departmentId,
          capacity: input.capacity,
        },
      });

      // Create beds
      const beds = Array.from({ length: input.capacity }, (_: any, i: number) => ({
        wardId: ward.id,
        bedNumber: `${input.bedPrefix}${i + 1}`,
      }));

      await tx.bed.createMany({ data: beds });

      return tx.ward.findUnique({
        where: { id: ward.id },
        include: { beds: true, department: { select: { name: true } } },
      });
    });
  }
}
