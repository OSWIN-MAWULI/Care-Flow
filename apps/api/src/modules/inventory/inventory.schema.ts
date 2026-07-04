import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().min(1).max(50),
  unit: z.string().min(1).max(20),
  quantityInStock: z.number().int().default(0),
  reorderLevel: z.number().int().default(10),
  departmentId: z.string().uuid(),
});

export const createTransactionSchema = z.object({
  itemId: z.string().uuid(),
  changeQuantity: z.number().int(),
  reason: z.string().min(1).max(100),
  relatedPrescriptionId: z.string().uuid().optional(),
});

export const updateInventorySchema = z.object({
  quantityInStock: z.number().int().optional(),
  reorderLevel: z.number().int().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
