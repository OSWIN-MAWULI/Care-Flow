import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register.bind(controller));
router.post('/login', controller.login.bind(controller));
router.post('/refresh', controller.refresh.bind(controller));
router.post('/logout', controller.logout.bind(controller));
router.post('/request-reset', controller.requestReset.bind(controller));
router.post('/reset-password', controller.resetPassword.bind(controller));
router.get('/me', authenticateJWT, controller.me.bind(controller));

export default router;
