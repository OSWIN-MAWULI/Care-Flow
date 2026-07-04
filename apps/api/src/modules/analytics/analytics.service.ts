import prisma from '../../prisma.js';

export class AnalyticsService {
  async getAppointmentStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const appointments = await prisma.appointment.findMany({
      where: { scheduledAt: { gte: since } },
      include: { doctor: true },
    });

    const total = appointments.length;
    const byStatus = {
      pending: appointments.filter((a: any) => a.status === 'pending').length,
      confirmed: appointments.filter((a: any) => a.status === 'confirmed').length,
      completed: appointments.filter((a: any) => a.status === 'completed').length,
      cancelled: appointments.filter((a: any) => a.status === 'cancelled').length,
      no_show: appointments.filter((a: any) => a.status === 'no_show').length,
    };

    // Per-day aggregation
    const byDay: Record<string, number> = {};
    for (const a of appointments) {
      const day = a.scheduledAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }

    // Doctor utilization
    const doctors = await prisma.doctor.findMany({
      include: { _count: { select: { appointments: true } } },
    });
    const doctorUtilization = doctors.map((d: any) => ({
      id: d.id,
      specialization: d.specialization,
      totalAppointments: d._count.appointments,
      completedAppointments: appointments.filter((a: any) => a.doctorId === d.id && a.status === 'completed').length,
    }));

    return { total, byStatus, byDay, doctorUtilization };
  }

  async getDiagnosisStats(limit = 10) {
    const records = await prisma.medicalRecord.findMany({
      where: { deletedAt: null },
      select: { diagnosis: true },
    });

    const counts: Record<string, number> = {};
    for (const r of records) {
      counts[r.diagnosis] = (counts[r.diagnosis] || 0) + 1;
    }

    const topDiagnoses = Object.entries(counts)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
      .slice(0, limit)
      .map(([diagnosis, count]: [string, number]) => ({ diagnosis, count }));

    return topDiagnoses;
  }

  async getWaitTimeStats() {
    // Average wait time from appointment creation to being seen
    const completed = await prisma.appointment.findMany({
      where: { status: 'completed' },
      select: { createdAt: true, scheduledAt: true },
    });

    if (!completed.length) return { averageWaitMinutes: 0, sampleSize: 0 };

    const totalWaitMs = completed.reduce((sum: number, a: any) => {
      return sum + Math.abs(a.scheduledAt.getTime() - a.createdAt.getTime());
    }, 0);

    return {
      averageWaitMinutes: Math.round(totalWaitMs / completed.length / 60000),
      sampleSize: completed.length,
    };
  }

  async getRevenueStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: since }, status: 'paid' },
    });

    const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount);
    }

    return { totalRevenue, totalTransactions: payments.length, byMethod };
  }
}
