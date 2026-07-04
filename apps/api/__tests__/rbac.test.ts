import request from 'supertest';
import express from 'express';
import authRoutes from '../src/modules/auth/auth.routes';
import usersRoutes from '../src/modules/users/users.routes';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

describe('RBAC Enforcement', () => {
  let patientToken: string;
  let doctorToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Login as different roles
    const adminRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@caresync.com', password: 'Password123' });
    adminToken = adminRes.body.accessToken;

    const docRes = await request(app)
      .post('/auth/login')
      .send({ email: 'cardio.doc@caresync.com', password: 'Password123' });
    doctorToken = docRes.body.accessToken;

    // Register a patient
    const patEmail = `pat_rbac_${Date.now()}@test.com`;
    await request(app).post('/auth/register').send({
      email: patEmail,
      password: 'TestPass123',
      dateOfBirth: '1990-01-15T00:00:00.000Z',
      gender: 'male',
      phone: '+233501234567',
    });
    const patRes = await request(app)
      .post('/auth/login')
      .send({ email: patEmail, password: 'TestPass123' });
    patientToken = patRes.body.accessToken;
  });

  it('Patient cannot access admin-only routes -> 403', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  it('Admin can access admin-only routes -> 200', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('Doctor can access doctor routes -> 200', async () => {
    const res = await request(app)
      .get('/referrals/my')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(200);
  });

  it('Patient cannot access doctor routes -> 403', async () => {
    const res = await request(app)
      .get('/referrals/my')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  it('Unauthenticated request -> 401', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(401);
  });
});
