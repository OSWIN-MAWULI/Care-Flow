import { Request, Response } from 'express';
import { UsersService } from './users.service.js';
import { createDoctorSchema, createStaffSchema, updateUserSchema, userQuerySchema } from './users.schema.js';

const service = new UsersService();

export class UsersController {
  async list(req: Request, res: Response) {
    const query = userQuerySchema.parse(req.query);
    const result = await service.findAll(query);
    res.json(result);
  }

  async getById(req: Request, res: Response) {
    try {
      const user = await service.findById(req.params.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json(user);
    } catch {
      res.status(400).json({ message: 'Invalid user ID' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const parsed = updateUserSchema.parse(req.body);
      const user = await service.updateUser(req.params.id, parsed);
      res.json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to update user' });
    }
  }

  async createDoctor(req: Request, res: Response) {
    try {
      const parsed = createDoctorSchema.parse(req.body);
      const result = await service.createDoctor(parsed);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create doctor' });
    }
  }

  async createStaff(req: Request, res: Response) {
    try {
      const parsed = createStaffSchema.parse(req.body);
      const result = await service.createStaff(parsed);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create staff' });
    }
  }

  async listDoctors(_req: Request, res: Response) {
    const doctors = await service.getDoctors();
    res.json(doctors);
  }

  async listStaff(_req: Request, res: Response) {
    const staff = await service.getStaff();
    res.json(staff);
  }
}
