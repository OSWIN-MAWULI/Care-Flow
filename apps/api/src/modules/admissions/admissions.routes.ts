import { Router } from 'express';
import { AdmissionsController } from './admissions.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new AdmissionsController();

router.get('/wards', authenticateJWT, ctrl.listWards.bind(ctrl));
router.post('/wards', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.createWard.bind(ctrl));
router.get('/', authenticateJWT, ctrl.list.bind(ctrl));
router.post('/', authenticateJWT, requireRoles([UserRole.DOCTOR]), ctrl.admit.bind(ctrl));
router.put('/:id/discharge', authenticateJWT, requireRoles([UserRole.DOCTOR]), ctrl.discharge.bind(ctrl));

export default router;
