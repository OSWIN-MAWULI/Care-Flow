import prisma from '../../prisma.js';

export interface NotificationProvider {
  send(to: string, message: string): Promise<boolean>;
}

export class MockSmsProvider implements NotificationProvider {
  async send(to: string, message: string): Promise<boolean> {
    console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
    return true;
  }
}

export class AfricasTalkingProvider implements NotificationProvider {
  private username: string;
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';
    this.apiKey = process.env.AFRICAS_TALKING_API_KEY || '';
    this.senderId = process.env.AFRICAS_TALKING_SENDER_ID || 'HMS_ALERTS';
  }

  async send(to: string, message: string): Promise<boolean> {
    try {
      // Africa's Talking Sandbox — uses sandbox base URL, not production
      const baseUrl = 'https://api.sandbox.africastalking.com/version1/messaging';
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ApiKey': this.apiKey,
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: this.username,
          to,
          message,
          from: this.senderId,
        }),
      });

      if (!response.ok) {
        console.error(`[SMS ERROR] ${response.status}: ${await response.text()}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[SMS ERROR] Provider unavailable:', error);
      return false;
    }
  }
}

export class NotificationsService {
  private provider: NotificationProvider;

  constructor() {
    const mode = process.env.SMS_PROVIDER_MODE || 'mock';
    this.provider = mode === 'production'
      ? new AfricasTalkingProvider()
      : new MockSmsProvider();
  }

  async sendNotification(userId: string, type: string, message: string) {
    const notification = await prisma.notification.create({
      data: { userId, type: type as any, message },
    });

    // If there's a phone number, send SMS
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (patient?.phone) {
      const sent = await this.provider.send(patient.phone, message);
      if (sent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'sent', sentAt: new Date() },
        });
      }
    }

    return notification;
  }

  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  async markAsSent(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
  }

  async sendAppointmentConfirmation(patientId: string, appointmentDate: Date, doctorName: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });
    if (!patient) return;

    const message = `[HMS] Appointment confirmed with Dr. ${doctorName} on ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString()}. Reply STOP to opt out.`;
    return this.sendNotification(patient.userId, 'appointment_confirmation', message);
  }

  async sendAppointmentReminder(patientId: string, appointmentDate: Date, doctorName: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });
    if (!patient) return;

    const message = `[HMS] REMINDER: Your appointment with Dr. ${doctorName} is at ${appointmentDate.toLocaleTimeString()} tomorrow. Please arrive 15 min early.`;
    return this.sendNotification(patient.userId, 'appointment_reminder', message);
  }

  async sendQueueUpdate(patientId: string, position: number, estimatedWait: number) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });
    if (!patient) return;

    const message = `[HMS] You are #${position} in queue. Estimated wait: ~${estimatedWait} min. We'll alert you when it's your turn.`;
    return this.sendNotification(patient.userId, 'appointment_reminder', message);
  }
}
