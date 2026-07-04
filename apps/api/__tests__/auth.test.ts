import request from 'supertest';
import express from 'express';
import authRoutes from '../src/modules/auth/auth.routes';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Flow', () => {
  const testUser = {
    email: `test_${Date.now()}@test.com`,
    password: 'TestPass123',
    dateOfBirth: '1990-01-15T00:00:00.000Z',
    gender: 'male',
    phone: '+233501234567',
  };

  it('POST /auth/register - creates a new patient', async () => {
    const res = await request(app).post('/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('email', testUser.email);
    expect(res.body.role).toBe('patient');
  });

  it('POST /auth/register - rejects duplicate email', async () => {
    const res = await request(app).post('/auth/register').send(testUser);
    expect(res.status).toBe(400);
  });

  it('POST /auth/register - rejects invalid input', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'not-email' });
    expect(res.status).toBe(400);
  });

  it('POST /auth/login - logs in registered user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.role).toBe('patient');
  });

  it('POST /auth/login - rejects wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('POST /auth/login - rejects unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'TestPass123' });
    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh - returns new tokens', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookies as any);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });
});
