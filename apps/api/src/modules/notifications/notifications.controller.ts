import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service.js';

const service = new NotificationsService();

export class NotificationsController {
  async list(req: Request, res: Response) {
    const notifications = await service.getUserNotifications(req.user!.id);
    res.json(notifications);
  }
}
