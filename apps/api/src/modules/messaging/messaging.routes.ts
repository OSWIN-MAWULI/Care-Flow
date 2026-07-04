import { Router } from 'express';
import { MessagingController } from './messaging.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';

const router = Router();
const ctrl = new MessagingController();

router.post('/conversations', authenticateJWT, ctrl.createConversation.bind(ctrl));
router.get('/conversations', authenticateJWT, ctrl.listConversations.bind(ctrl));
router.get('/conversations/:id/messages', authenticateJWT, ctrl.getMessages.bind(ctrl));
router.post('/conversations/:id/messages', authenticateJWT, ctrl.sendMessage.bind(ctrl));

export default router;
