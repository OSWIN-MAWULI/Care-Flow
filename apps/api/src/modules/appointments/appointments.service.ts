import prisma from '../../prisma.js';
import { CreateAppointmentInput } from './appointments.schema.js';
import { AppointmentStatus } from '@hms/shared';

export class AppointmentsService {
  async create(input: CreateAppointmentInput, patientUserId: string) {
    // Find patient record from user
    const patient = await prisma.patient.findUnique({ where: { userId: patientUserId } });
    if (!patient) throw new Error('Patient profile not found');

    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt < new Date()) throw new Error('Cannot book appointments in the past');

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { id: input.doctorId } });
    if (!doctor) throw new Error('Doctor not found');

    // Check double-booking via transaction
    return prisma.$transaction(async (tx: any) => {
      const conflicting = await tx.appointment.findFirst({
        where: {
          doctorId: input.doctorId,
          scheduledAt,
          status: { in: ['pending', 'confirmed', 'in_progress'] },
        },
      });
      if (conflicting) throw new Error('Time slot already booked');

      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: input.doctorId,
          scheduledAt,
          reason: input.reason,
          status: AppointmentStatus.PENDING,
        },
        include: {
          patient: {
            include: { user: { select: { id: true, email: true, role: true } } },
          },
          doctor: {
            include: { user: { select: { id: true, email: true, role: true } } },
          },
        },
      });

      return appointment;
    });
  }

  async findById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
        doctor: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
        medicalRecord: true,
        payment: true,
      },
    });
  }

  async findByPatient(userId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return [];

    return prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          include: { user: { select: { id: true, email: true, role: true } }, department: { select: { name: true } } },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findByDoctor(doctorId: string, date?: string) {
    const where: any = { doctorId };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.scheduledAt = { gte: start, lt: end };
    }

    return prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    return prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
        doctor: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
      },
    });
  }

  async cancel(id: string, userId: string, role: string) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error('Appointment not found');

    // Patient can only cancel their own; doctor/admin can cancel any
    if (role === 'patient') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (!patient || appointment.patientId !== patient.id) {
        throw new Error('Not authorized to cancel this appointment');
      }
    }

    return prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });
  }

  async getAvailableSlots(doctorId?: string, departmentId?: string, date?: string) {
    const where: any = {};
    if (doctorId) where.id = doctorId;
    if (departmentId) where.departmentId = departmentId;

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        availabilities: true,
        appointments: {
          where: date
            ? {
                scheduledAt: {
                  gte: new Date(date),
                  lt: new Date(new Date(date).getTime() + 86400000),
                },
                status: { in: ['pending', 'confirmed', 'in_progress'] },
              }
            : undefined,
        },
      },
    });

    const slots: { doctorId: string; doctorName: string; specialization: string; availableTimes: string[] }[] = [];

    for (const doc of doctors) {
      if (!doc.availabilities.length) continue;

      const dayOfWeek = date ? new Date(date).getDay() : undefined;
      const dayAvail = doc.availabilities.filter((a: any) => (dayOfWeek ? a.dayOfWeek === dayOfWeek : true));

      const bookedTimes = new Set(doc.appointments.map((a: any) => a.scheduledAt.toISOString().slice(0, 16)));

      const availableTimes: string[] = [];
      for (const avail of dayAvail) {
        let cursor = new Date(avail.startTime);
        const end = new Date(avail.endTime);
        while (cursor < end) {
          const slotTime = date
            ? new Date(`${date}T${cursor.toISOString().slice(11, 16)}:00Z`).toISOString()
            : cursor.toISOString();
          const slotKey = slotTime.slice(0, 16);
          if (!bookedTimes.has(slotKey)) {
            availableTimes.push(slotTime);
          }
          cursor = new Date(cursor.getTime() + doc.consultDurationMin * 60000);
        }
      }

      slots.push({
        doctorId: doc.id,
        doctorName: `${doc.specialization}`,
        specialization: doc.specialization,
        availableTimes,
      });
    }

    return slots;
  }
}
