import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { MessagingService } from './messaging.service.js';
import { createConversationSchema, sendMessageSchema } from './messaging.schema.js';

const service = new MessagingService();

export class MessagingController {
  async createConversation(req: Request, res: Response) {
    try {
      const parsed = createConversationSchema.parse(req.body);
      // Ensure creator is a participant
      if (!parsed.participantIds.includes(req.user!.id)) {
        parsed.participantIds.push(req.user!.id);
      }
      const conv = await service.createConversation(parsed);
      res.status(201).json(conv);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Failed to create conversation' });
    }
  }

  async listConversations(req: Request, res: Response) {
    const convs = await service.getUserConversations(req.user!.id);
    res.json(convs);
  }

  async getMessages(req: Request, res: Response) {
    try {
      const messages = await service.getMessages(req.params.id, req.user!.id);
      res.json(messages);
    } catch (error: any) {
      res.status(403).json({ message: error.message || 'Cannot access conversation' });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const parsed = sendMessageSchema.parse(req.body);
      const msg = await service.sendMessage(req.params.id, req.user!.id, parsed.content, parsed.attachmentUrl);

      // Emit via Socket.io if available
      const io = req.app.get('io') as SocketIOServer | undefined;
      if (io) {
        io.to(`conversation:${req.params.id}`).emit('message:new', msg);
      }

      res.status(201).json(msg);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(403).json({ message: error.message || 'Failed to send message' });
    }
  }
}
