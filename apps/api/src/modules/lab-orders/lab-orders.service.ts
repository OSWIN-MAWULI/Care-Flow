import prisma from '../../prisma.js';
import { CreateLabOrderInput, AddLabResultInput } from './lab-orders.schema.js';
import { LabOrderStatus } from '@hms/shared';

export class LabOrdersService {
  async create(input: CreateLabOrderInput, doctorUserId: string) {
    const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
    if (!doctor) throw new Error('Doctor profile not found');

    return prisma.labOrder.create({
      data: {
        patientId: input.patientId,
        orderingDoctorId: doctor.id,
        departmentId: input.departmentId,
        testName: input.testName,
      },
      include: {
        patient: { include: { user: { select: { email: true } } } },
        orderingDoctor: { include: { user: { select: { email: true } } } },
        department: { select: { name: true } },
      },
    });
  }

  async findByDepartment(departmentId: string) {
    return prisma.labOrder.findMany({
      where: { departmentId },
      include: {
        patient: { include: { user: { select: { id: true, email: true } } } },
        orderingDoctor: { include: { user: { select: { email: true } } } },
        labResult: true,
      },
      orderBy: { orderedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { email: true } } } },
        orderingDoctor: { include: { user: { select: { email: true } } } },
        department: { select: { name: true } },
        labResult: { include: { fileDocument: true, recordedBy: { select: { email: true } } } },
      },
    });
  }

  async updateStatus(id: string, status: LabOrderStatus) {
    const data: any = { status };
    if (status === 'completed') data.completedAt = new Date();

    return prisma.labOrder.update({
      where: { id },
      data,
      include: {
        patient: { include: { user: { select: { email: true } } } },
        labResult: true,
      },
    });
  }

  async addResult(labOrderId: string, input: AddLabResultInput, userId: string) {
    return prisma.labResult.create({
      data: {
        labOrderId,
        resultSummary: input.resultSummary,
        fileDocumentId: input.fileDocumentId,
        recordedById: userId,
      },
      include: {
        labOrder: {
          include: {
            orderingDoctor: { include: { user: { select: { email: true } } } },
          },
        },
        fileDocument: true,
      },
    });
  }
}
