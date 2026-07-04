import prisma from '../../prisma.js';
import { CreateRecordInput, UpdateRecordInput } from './medical-records.schema.js';

export class MedicalRecordsService {
  async create(input: CreateRecordInput, doctorUserId: string) {
    const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
    if (!doctor) throw new Error('Doctor profile not found');

    // Audit logging
    const record = await prisma.medicalRecord.create({
      data: {
        patientId: input.patientId,
        doctorId: doctor.id,
        appointmentId: input.appointmentId,
        diagnosis: input.diagnosis,
        notes: input.notes,
        prescriptions: input.prescriptions
          ? { create: input.prescriptions }
          : undefined,
      },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        doctor: { include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } } },
        prescriptions: true,
      },
    });

    // Auto audit log
    await prisma.auditLog.create({
      data: {
        userId: doctorUserId,
        action: 'CREATE',
        entityType: 'medical_records',
        entityId: record.id,
      },
    });

    return record;
  }

  async findById(id: string) {
    return prisma.medicalRecord.findFirst({
      where: { id, deletedAt: null },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        doctor: { include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } } },
        prescriptions: true,
        documents: true,
      },
    });
  }

  async findByPatient(patientId: string) {
    return prisma.medicalRecord.findMany({
      where: { patientId, deletedAt: null },
      include: {
        doctor: { include: { user: { select: { id: true, email: true } }, department: { select: { name: true } } } },
        prescriptions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDoctor(doctorId: string) {
    return prisma.medicalRecord.findMany({
      where: { doctorId, deletedAt: null },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        prescriptions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateRecordInput, doctorUserId: string) {
    const record = await prisma.medicalRecord.findFirst({
      where: { id, deletedAt: null },
      include: { doctor: true },
    });
    if (!record) throw new Error('Medical record not found');
    if (record.doctor.userId !== doctorUserId) throw new Error('Only the authoring doctor can edit this record');

    const updated = await prisma.medicalRecord.update({
      where: { id },
      data: input,
      include: {
        prescriptions: true,
        documents: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: doctorUserId,
        action: 'UPDATE',
        entityType: 'medical_records',
        entityId: id,
      },
    });

    return updated;
  }

  async softDelete(id: string, doctorUserId: string) {
    const record = await prisma.medicalRecord.findFirst({
      where: { id, deletedAt: null },
      include: { doctor: true },
    });
    if (!record) throw new Error('Medical record not found');
    if (record.doctor.userId !== doctorUserId) throw new Error('Only the authoring doctor can delete this record');

    await prisma.medicalRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: doctorUserId,
        action: 'DELETE',
        entityType: 'medical_records',
        entityId: id,
      },
    });
  }
}
