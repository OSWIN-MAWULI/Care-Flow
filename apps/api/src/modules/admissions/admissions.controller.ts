import { Request, Response } from 'express';
import { AdmissionsService } from './admissions.service.js';
import { admitPatientSchema, createWardSchema } from './admissions.schema.js';

const service = new AdmissionsService();

export class AdmissionsController {
  async admit(req: Request, res: Response) {
    try {
      const parsed = admitPatientSchema.parse(req.body);
      const admission = await service.admit(parsed, req.user!.id);
      res.status(201).json(admission);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to admit patient' });
    }
  }

  async discharge(req: Request, res: Response) {
    try {
      const result = await service.discharge(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to discharge patient' });
    }
  }

  async list(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const admissions = await service.listAdmissions(status);
    res.json(admissions);
  }

  async listWards(req: Request, res: Response) {
    const departmentId = req.query.departmentId as string | undefined;
    const wards = await service.listWards(departmentId);
    res.json(wards);
  }

  async createWard(req: Request, res: Response) {
    try {
      const parsed = createWardSchema.parse(req.body);
      const ward = await service.createWard(parsed);
      res.status(201).json(ward);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create ward' });
    }
  }
}
