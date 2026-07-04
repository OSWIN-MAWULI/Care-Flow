import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new InventoryController();

router.get('/low-stock', authenticateJWT, ctrl.lowStock.bind(ctrl));
router.get('/', authenticateJWT, ctrl.list.bind(ctrl));
router.post('/', authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.STAFF]), ctrl.create.bind(ctrl));
router.post('/transactions', authenticateJWT, requireRoles([UserRole.STAFF]), ctrl.createTransaction.bind(ctrl));
router.get('/:itemId/transactions', authenticateJWT, ctrl.getTransactions.bind(ctrl));
router.put('/:id', authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.STAFF]), ctrl.update.bind(ctrl));

export default router;
