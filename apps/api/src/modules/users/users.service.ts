import prisma from '../../prisma.js';
import bcrypt from 'bcryptjs';
import { CreateDoctorInput, CreateStaffInput, UpdateUserInput } from './users.schema.js';

export class UsersService {
  async findAll(query: { role?: string; page: number; limit: number }) {
    const where: any = {};
    if (query.role) where.role = query.role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: true,
          doctor: { include: { department: { select: { id: true, name: true } } } },
          staff: { include: { department: { select: { id: true, name: true } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page: query.page, limit: query.limit };
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { department: { select: { id: true, name: true } } } },
        staff: { include: { department: { select: { id: true, name: true } } } },
      },
    });
  }

  async updateUser(id: string, input: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data: input,
      select: { id: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  async createDoctor(input: CreateDoctorInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error('User with this email already exists');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    return prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: { email: input.email, passwordHash, role: 'doctor' },
      });

      await tx.doctor.create({
        data: {
          userId: user.id,
          specialization: input.specialization,
          licenseNumber: input.licenseNumber,
          bio: input.bio,
          consultDurationMin: input.consultDurationMin,
          departmentId: input.departmentId,
        },
      });

      return { id: user.id, email: user.email, role: user.role };
    });
  }

  async createStaff(input: CreateStaffInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error('User with this email already exists');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    return prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: { email: input.email, passwordHash, role: 'staff' },
      });

      await tx.staff.create({
        data: {
          userId: user.id,
          departmentId: input.departmentId,
          position: input.position,
        },
      });

      return { id: user.id, email: user.email, role: user.role, position: input.position };
    });
  }

  async getDoctors() {
    return prisma.doctor.findMany({
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true } },
        department: { select: { id: true, name: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { user: { createdAt: 'desc' } },
    });
  }

  async getStaff() {
    return prisma.staff.findMany({
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { user: { createdAt: 'desc' } },
    });
  }
}
