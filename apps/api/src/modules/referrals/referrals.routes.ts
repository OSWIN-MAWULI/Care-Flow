import { Router } from 'express';
import { ReferralsController } from './referrals.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new ReferralsController();

router.post('/', authenticateJWT, requireRoles([UserRole.DOCTOR]), ctrl.create.bind(ctrl));
router.get('/my', authenticateJWT, requireRoles([UserRole.DOCTOR]), ctrl.listMyReferrals.bind(ctrl));
router.get('/department/:departmentId', authenticateJWT, ctrl.listForDepartment.bind(ctrl));
router.get('/:id', authenticateJWT, ctrl.getById.bind(ctrl));
router.put('/:id/status', authenticateJWT, requireRoles([UserRole.DOCTOR, UserRole.ADMIN]), ctrl.updateStatus.bind(ctrl));

export default router;
