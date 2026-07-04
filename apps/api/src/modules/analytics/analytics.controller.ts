import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service.js';

const service = new AnalyticsService();

export class AnalyticsController {
  async appointments(req: Request, res: Response) {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const stats = await service.getAppointmentStats(days);
    res.json(stats);
  }

  async diagnoses(_req: Request, res: Response) {
    const stats = await service.getDiagnosisStats();
    res.json(stats);
  }

  async waitTimes(_req: Request, res: Response) {
    const stats = await service.getWaitTimeStats();
    res.json(stats);
  }

  async revenue(req: Request, res: Response) {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const stats = await service.getRevenueStats(days);
    res.json(stats);
  }

  async dashboard(_req: Request, res: Response) {
    const [appointments, diagnoses, waitTimes, revenue] = await Promise.all([
      service.getAppointmentStats(30),
      service.getDiagnosisStats(5),
      service.getWaitTimeStats(),
      service.getRevenueStats(30),
    ]);

    res.json({ appointments, diagnoses, waitTimes, revenue });
  }
}
