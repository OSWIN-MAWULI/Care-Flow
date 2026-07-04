import { Request, Response } from 'express';
import prisma from '../../prisma.js';
import { ReferralsService } from './referrals.service.js';
import { createReferralSchema, updateReferralStatusSchema } from './referrals.schema.js';
import { ReferralStatus } from '@hms/shared';

const service = new ReferralsService();

export class ReferralsController {
  async create(req: Request, res: Response) {
    try {
      const parsed = createReferralSchema.parse(req.body);
      const referral = await service.create(parsed, req.user!.id);

      // Auto-create a case conversation
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
      const recipientDoctorId = parsed.referredToDoctorId;
      const conv = await prisma.conversation.create({
        data: {
          type: 'case',
          relatedPatientId: parsed.patientId,
          relatedReferralId: referral.id,
          participants: {
            createMany: {
              data: [
                { userId: req.user!.id },
                ...(recipientDoctorId
                  ? [{ userId: (await prisma.doctor.findUnique({ where: { id: recipientDoctorId } }))!.userId }]
                  : []),
              ],
            },
          },
        },
      });

      res.status(201).json({ referral, conversationId: conv.id });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create referral' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const referral = await service.findById(req.params.id);
      if (!referral) {
        res.status(404).json({ message: 'Referral not found' });
        return;
      }
      res.json(referral);
    } catch {
      res.status(400).json({ message: 'Invalid referral ID' });
    }
  }

  async listForDepartment(req: Request, res: Response) {
    const staff = await prisma.staff.findUnique({ where: { userId: req.user!.id } });
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    const departmentId = req.params.departmentId || staff?.departmentId || doctor?.departmentId;

    if (!departmentId) {
      res.status(400).json({ message: 'Department ID required' });
      return;
    }

    const referrals = await service.findByDepartment(departmentId);
    res.json(referrals);
  }

  async listMyReferrals(req: Request, res: Response) {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) {
      res.status(403).json({ message: 'Doctor profile not found' });
      return;
    }

    const referrals = await service.findByReferringDoctor(doctor.id);
    res.json(referrals);
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const parsed = updateReferralStatusSchema.parse(req.body);
      const referral = await service.updateStatus(req.params.id, parsed.status as ReferralStatus);
      res.json(referral);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to update referral' });
    }
  }
}
