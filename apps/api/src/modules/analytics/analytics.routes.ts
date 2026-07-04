import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new AnalyticsController();

router.get('/dashboard', authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.DOCTOR]), ctrl.dashboard.bind(ctrl));
router.get('/appointments', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.appointments.bind(ctrl));
router.get('/diagnoses', authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.DOCTOR]), ctrl.diagnoses.bind(ctrl));
router.get('/wait-times', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.waitTimes.bind(ctrl));
router.get('/revenue', authenticateJWT, requireRoles([UserRole.ADMIN]), ctrl.revenue.bind(ctrl));

export default router;
