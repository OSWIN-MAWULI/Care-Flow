import { Router } from 'express';
import { DocumentsController } from './documents.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';

const router = Router();
const ctrl = new DocumentsController();

router.post('/', authenticateJWT, ctrl.upload.bind(ctrl));
router.get('/record/:recordId', authenticateJWT, ctrl.listByRecord.bind(ctrl));

export default router;
