import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new UsersController();

// Admin-only user management
router.get('/', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.list.bind(ctrl));
router.get('/doctors', authenticateJWT, ctrl.listDoctors.bind(ctrl));
router.get('/staff', authenticateJWT, ctrl.listStaff.bind(ctrl));
router.get('/:id', authenticateJWT, ctrl.getById.bind(ctrl));
router.put('/:id', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.update.bind(ctrl));

// Provisioning
router.post('/doctors', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.createDoctor.bind(ctrl));
router.post('/staff', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.createStaff.bind(ctrl));

export default router;
