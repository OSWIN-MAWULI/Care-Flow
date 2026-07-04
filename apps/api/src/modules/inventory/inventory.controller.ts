import { Request, Response } from 'express';
import prisma from '../../prisma.js';
import { InventoryService } from './inventory.service.js';
import { createInventoryItemSchema, createTransactionSchema, updateInventorySchema } from './inventory.schema.js';

const service = new InventoryService();

export class InventoryController {
  async list(req: Request, res: Response) {
    const departmentId = req.query.departmentId as string | undefined;
    if (!departmentId) {
      const items = await prisma.inventoryItem.findMany({
        include: { department: { select: { name: true } } },
        orderBy: { name: 'asc' },
      });
      res.json(items);
      return;
    }
    const items = await service.findByDepartment(departmentId);
    res.json(items);
  }

  async lowStock(req: Request, res: Response) {
    const departmentId = req.query.departmentId as string | undefined;
    const items = await service.findLowStock(departmentId);
    res.json(items);
  }

  async create(req: Request, res: Response) {
    try {
      const parsed = createInventoryItemSchema.parse(req.body);
      const item = await service.create(parsed);
      res.status(201).json(item);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create item' });
    }
  }

  async createTransaction(req: Request, res: Response) {
    try {
      const parsed = createTransactionSchema.parse(req.body);
      const tx = await service.createTransaction(parsed, req.user!.id);
      res.status(201).json(tx);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to record transaction' });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const txs = await service.getTransactions(req.params.itemId);
      res.json(txs);
    } catch {
      res.status(400).json({ message: 'Invalid item ID' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const parsed = updateInventorySchema.parse(req.body);
      const item = await service.updateItem(req.params.id, parsed);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update item' });
    }
  }
}
