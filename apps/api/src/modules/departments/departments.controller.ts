import { Request, Response } from 'express';
import { DepartmentsService } from './departments.service.js';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.schema.js';

const service = new DepartmentsService();

export class DepartmentsController {
  async list(_req: Request, res: Response) {
    const depts = await service.findAll();
    res.json(depts);
  }

  async getById(req: Request, res: Response) {
    try {
      const department = await service.findById(req.params.id);
      if (!department) {
        res.status(404).json({ message: 'Department not found' });
        return;
      }
      res.json(department);
    } catch (error: any) {
      res.status(400).json({ message: 'Invalid department ID' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const parsed = createDepartmentSchema.parse(req.body);
      const department = await service.create(parsed);
      res.status(201).json(department);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      if (error.code === 'P2002') {
        res.status(409).json({ message: 'Department name already exists' });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create department' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const parsed = updateDepartmentSchema.parse(req.body);
      const department = await service.update(req.params.id, parsed);
      res.json(department);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      if (error.code === 'P2025') {
        res.status(404).json({ message: 'Department not found' });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to update department' });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await service.remove(req.params.id);
      res.json({ message: 'Department deleted' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        res.status(404).json({ message: 'Department not found' });
        return;
      }
      if (error.code === 'P2003') {
        res.status(409).json({ message: 'Cannot delete department with associated resources. Reassign first.' });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to delete department' });
    }
  }
}
