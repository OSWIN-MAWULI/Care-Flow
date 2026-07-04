import { Router } from 'express';
import { DepartmentsController } from './departments.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new DepartmentsController();

router.get('/', authenticateJWT, ctrl.list.bind(ctrl));
router.get('/:id', authenticateJWT, ctrl.getById.bind(ctrl));
router.post('/', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.create.bind(ctrl));
router.put('/:id', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.update.bind(ctrl));
router.delete('/:id', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.remove.bind(ctrl));

export default router;
