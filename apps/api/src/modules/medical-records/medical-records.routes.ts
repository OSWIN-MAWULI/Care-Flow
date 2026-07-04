import { Router } from 'express';
import { MedicalRecordsController } from './medical-records.controller.js';
import { authenticateJWT, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '@hms/shared';

const router = Router();
const ctrl = new MedicalRecordsController();

router.post('/', authenticateJWT, requireRoles([UserRole.DOCTOR]), ctrl.create.bind(ctrl));
router.get('/my', authenticateJWT, requireRoles([UserRole.PATIENT]), ctrl.listMyRecords.bind(ctrl));
router.get('/patient/:patientId', authenticateJWT, requireRoles([UserRole.DOCTOR, UserRole.ADMIN]), ctrl.listByPatient.bind(ctrl));
router.get('/:id', authenticateJWT, ctrl.getById.bind(ctrl));
router.put('/:id', authenticateJWT, requireRoles([UserRole.DOCTOR]), ctrl.update.bind(ctrl));
router.delete('/:id', authenticateJWT, requireRoles([UserRole.DOCTOR]), ctrl.remove.bind(ctrl));

export default router;
