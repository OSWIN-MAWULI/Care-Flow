import prisma from '../../prisma.js';
import { CreateInventoryItemInput, CreateTransactionInput } from './inventory.schema.js';

export class InventoryService {
  async findByDepartment(departmentId: string) {
    return prisma.inventoryItem.findMany({
      where: { departmentId },
      include: {
        department: { select: { name: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findLowStock(departmentId?: string) {
    const where: any = {
      quantityInStock: { lte: prisma.inventoryItem.fields.reorderLevel },
    };
    if (departmentId) where.departmentId = departmentId;

    return prisma.inventoryItem.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: { quantityInStock: 'asc' },
    });
  }

  async create(input: CreateInventoryItemInput) {
    return prisma.inventoryItem.create({
      data: input,
      include: { department: { select: { name: true } } },
    });
  }

  async createTransaction(input: CreateTransactionInput, userId: string) {
    return prisma.$transaction(async (tx: any) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: input.itemId } });
      if (!item) throw new Error('Inventory item not found');

      const newQty = item.quantityInStock + input.changeQuantity;
      if (newQty < 0) throw new Error('Insufficient stock');

      await tx.inventoryItem.update({
        where: { id: input.itemId },
        data: { quantityInStock: newQty },
      });

      return tx.inventoryTransaction.create({
        data: {
          itemId: input.itemId,
          changeQuantity: input.changeQuantity,
          reason: input.reason,
          relatedPrescriptionId: input.relatedPrescriptionId,
          performedById: userId,
        },
        include: { item: { select: { name: true, quantityInStock: true } } },
      });
    });
  }

  async getTransactions(itemId: string) {
    return prisma.inventoryTransaction.findMany({
      where: { itemId },
      include: {
        performedBy: { select: { email: true } },
        prescription: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateItem(id: string, data: { quantityInStock?: number; reorderLevel?: number }) {
    return prisma.inventoryItem.update({
      where: { id },
      data,
    });
  }
}
