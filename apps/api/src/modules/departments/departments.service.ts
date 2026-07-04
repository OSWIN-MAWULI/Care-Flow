import prisma from '../../prisma.js';
import { CreateDepartmentInput, UpdateDepartmentInput } from './departments.schema.js';

export class DepartmentsService {
  async findAll() {
    return prisma.department.findMany({
      include: {
        headDoctor: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } } },
        },
        doctors: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } } },
        },
        staff: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } } },
        },
        _count: { select: { doctors: true, staff: true, wards: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        headDoctor: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } } },
        },
        doctors: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } } },
        },
        staff: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } } },
        },
        wards: { include: { _count: { select: { beds: true } } } },
      },
    });
  }

  async create(input: CreateDepartmentInput) {
    return prisma.department.create({
      data: {
        name: input.name,
        description: input.description,
        headDoctorId: input.headDoctorId,
      },
      include: {
        headDoctor: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } } },
        },
      },
    });
  }

  async update(id: string, input: UpdateDepartmentInput) {
    return prisma.department.update({
      where: { id },
      data: input,
      include: {
        headDoctor: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } } },
        },
      },
    });
  }

  async remove(id: string) {
    await prisma.department.delete({ where: { id } });
  }
}
