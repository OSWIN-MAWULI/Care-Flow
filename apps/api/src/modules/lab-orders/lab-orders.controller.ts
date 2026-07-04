import { Request, Response } from 'express';
import prisma from '../../prisma.js';
import { LabOrdersService } from './lab-orders.service.js';
import { createLabOrderSchema, updateLabOrderStatusSchema, addLabResultSchema } from './lab-orders.schema.js';
import { LabOrderStatus } from '@hms/shared';

const service = new LabOrdersService();

export class LabOrdersController {
  async create(req: Request, res: Response) {
    try {
      const parsed = createLabOrderSchema.parse(req.body);
      const order = await service.create(parsed, req.user!.id);
      res.status(201).json(order);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create lab order' });
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
    const orders = await service.findByDepartment(departmentId);
    res.json(orders);
  }

  async getById(req: Request, res: Response) {
    try {
      const order = await service.findById(req.params.id);
      if (!order) {
        res.status(404).json({ message: 'Lab order not found' });
        return;
      }
      res.json(order);
    } catch {
      res.status(400).json({ message: 'Invalid ID' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const parsed = updateLabOrderStatusSchema.parse(req.body);
      const order = await service.updateStatus(req.params.id, parsed.status as LabOrderStatus);
      res.json(order);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to update status' });
    }
  }

  async addResult(req: Request, res: Response) {
    try {
      const parsed = addLabResultSchema.parse(req.body);
      const result = await service.addResult(req.params.id, parsed, req.user!.id);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to add result' });
    }
  }
}
