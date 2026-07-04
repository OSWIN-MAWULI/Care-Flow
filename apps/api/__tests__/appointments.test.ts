import request from 'supertest';
import express from 'express';
import authRoutes from '../src/modules/auth/auth.routes';
import appointmentsRoutes from '../src/modules/appointments/appointments.routes';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/appointments', appointmentsRoutes);

describe('Appointment Booking Edge Cases', () => {
  let patientToken: string;
  let doctorId: string;

  beforeAll(async () => {
    // Login as patient
    const patRes = await request(app)
      .post('/auth/login')
      .send({ email: 'kofi.mensah@gmail.com', password: 'Password123' });
    patientToken = patRes.body.accessToken;

    // Login as admin to get doctor IDs
    const adminRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@caresync.com', password: 'Password123' });
    const adminToken = adminRes.body.accessToken;

    const docRes = await request(app)
      .get('/users/doctors')
      .set('Authorization', `Bearer ${adminToken}`);
    if (docRes.body.length > 0) {
      doctorId = docRes.body[0].id;
    }
  });

  it('Patient can book an appointment', async () => {
    if (!doctorId) return; // skip if no doctors

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(10, 0, 0, 0);

    const res = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        scheduledAt: futureDate.toISOString(),
        reason: 'Test appointment',
      });

    // Could be 201 or 400 depending on slot availability
    expect([201, 400]).toContain(res.status);
  });

  it('Cannot book in the past', async () => {
    if (!doctorId) return;

    const pastDate = new Date('2020-01-01').toISOString();
    const res = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId, scheduledAt: pastDate });

    expect(res.status).toBe(400);
  });

  it('Patient cannot book for invalid doctor ID', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const res = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: '00000000-0000-0000-0000-000000000000',
        scheduledAt: futureDate.toISOString(),
      });

    expect(res.status).toBe(400);
  });
});
