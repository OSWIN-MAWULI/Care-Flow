import { Request, Response } from 'express';
import prisma from '../../prisma.js';
import { MedicalRecordsService } from './medical-records.service.js';
import { createRecordSchema, updateRecordSchema } from './medical-records.schema.js';

const service = new MedicalRecordsService();

export class MedicalRecordsController {
  async create(req: Request, res: Response) {
    try {
      const parsed = createRecordSchema.parse(req.body);
      const record = await service.create(parsed, req.user!.id);
      res.status(201).json(record);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create record' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const record = await service.findById(req.params.id);
      if (!record) {
        res.status(404).json({ message: 'Medical record not found' });
        return;
      }
      res.json(record);
    } catch {
      res.status(400).json({ message: 'Invalid record ID' });
    }
  }

  async listByPatient(req: Request, res: Response) {
    const records = await service.findByPatient(req.params.patientId);
    res.json(records);
  }

  async listMyRecords(_req: Request, res: Response) {
    // Patient fetches own records
    const patient = await prisma.patient.findUnique({ where: { userId: _req.user!.id } });
    if (!patient) {
      res.status(403).json({ message: 'Patient profile not found' });
      return;
    }
    const records = await service.findByPatient(patient.id);
    res.json(records);
  }

  async update(req: Request, res: Response) {
    try {
      const parsed = updateRecordSchema.parse(req.body);
      const record = await service.update(req.params.id, parsed, req.user!.id);
      res.json(record);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(403).json({ message: error.message || 'Failed to update record' });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await service.softDelete(req.params.id, req.user!.id);
      res.json({ message: 'Medical record deleted' });
    } catch (error: any) {
      res.status(403).json({ message: error.message || 'Failed to delete record' });
    }
  }
}
