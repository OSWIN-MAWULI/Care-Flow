import { Router } from 'express';
import { LabOrdersController } from './lab-orders.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new LabOrdersController();

router.post('/', authenticateJWT, requireRoles([UserRole.DOCTOR]), ctrl.create.bind(ctrl));
router.get('/department/:departmentId', authenticateJWT, ctrl.listForDepartment.bind(ctrl));
router.get('/:id', authenticateJWT, ctrl.getById.bind(ctrl));
router.put('/:id/status', authenticateJWT, requireRoles([UserRole.STAFF, UserRole.DOCTOR, UserRole.ADMIN]), ctrl.updateStatus.bind(ctrl));
router.post('/:id/results', authenticateJWT, requireRoles([UserRole.STAFF]), ctrl.addResult.bind(ctrl));

export default router;
