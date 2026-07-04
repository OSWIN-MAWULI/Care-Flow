import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';

const router = Router();
const ctrl = new NotificationsController();

router.get('/', authenticateJWT, ctrl.list.bind(ctrl));

export default router;
