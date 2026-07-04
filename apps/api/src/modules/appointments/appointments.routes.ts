import { Router } from 'express';
import { AppointmentsController } from './appointments.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new AppointmentsController();

router.get('/availability', authenticateJWT, ctrl.getAvailability.bind(ctrl));
router.post('/', authenticateJWT, requireRoles([UserRole.PATIENT]), ctrl.create.bind(ctrl));
router.get('/my', authenticateJWT, requireRoles([UserRole.PATIENT]), ctrl.listMyAppointments.bind(ctrl));
router.get('/doctor', authenticateJWT, requireRoles([UserRole.DOCTOR, UserRole.ADMIN]), ctrl.listDoctorAppointments.bind(ctrl));
router.get('/:id', authenticateJWT, ctrl.getById.bind(ctrl));
router.put('/:id/status', authenticateJWT, requireRoles([UserRole.DOCTOR, UserRole.ADMIN]), ctrl.updateStatus.bind(ctrl));
router.put('/:id/cancel', authenticateJWT, ctrl.cancel.bind(ctrl));

export default router;
