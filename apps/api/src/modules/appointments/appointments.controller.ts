import { Request, Response } from 'express';
import prisma from '../../prisma.js';
import { AppointmentsService } from './appointments.service.js';
import { createAppointmentSchema, updateAppointmentStatusSchema, availabilityQuerySchema } from './appointments.schema.js';
import { AppointmentStatus } from '@hms/shared';

const service = new AppointmentsService();

export class AppointmentsController {
  async create(req: Request, res: Response) {
    try {
      const parsed = createAppointmentSchema.parse(req.body);
      const appointment = await service.create(parsed, req.user!.id);
      res.status(201).json(appointment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to book appointment' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const appointment = await service.findById(req.params.id);
      if (!appointment) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }
      res.json(appointment);
    } catch {
      res.status(400).json({ message: 'Invalid appointment ID' });
    }
  }

  async listMyAppointments(req: Request, res: Response) {
    const appointments = await service.findByPatient(req.user!.id);
    res.json(appointments);
  }

  async listDoctorAppointments(req: Request, res: Response) {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) {
      res.status(403).json({ message: 'Doctor profile not found' });
      return;
    }

    const date = req.query.date as string | undefined;
    const appointments = await service.findByDoctor(doctor.id, date);
    res.json(appointments);
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const parsed = updateAppointmentStatusSchema.parse(req.body);
      const appointment = await service.updateStatus(req.params.id, parsed.status as AppointmentStatus);
      res.json(appointment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to update appointment' });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const appointment = await service.cancel(req.params.id, req.user!.id, req.user!.role);
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to cancel appointment' });
    }
  }

  async getAvailability(req: Request, res: Response) {
    try {
      const query = availabilityQuerySchema.parse(req.query);
      const slots = await service.getAvailableSlots(query.doctorId, query.departmentId, query.date);
      res.json(slots);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to get availability' });
    }
  }
}
