import request from 'supertest';
import express from 'express';
import authRoutes from '../src/modules/auth/auth.routes';
import referralsRoutes from '../src/modules/referrals/referrals.routes';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/referrals', referralsRoutes);

describe('Referral Status Transitions', () => {
  let doctorToken: string;
  let doctorId: string;
  let patientId: string;
  let deptId: string;

  beforeAll(async () => {
    // Login as doctor
    const docRes = await request(app)
      .post('/auth/login')
      .send({ email: 'gen.doc@caresync.com', password: 'Password123' });
    doctorToken = docRes.body.accessToken;

    const adminRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@caresync.com', password: 'Password123' });
    const adminToken = adminRes.body.accessToken;

    // Get doctor profiles
    const docListRes = await request(app)
      .get('/users/doctors')
      .set('Authorization', `Bearer ${adminToken}`);
    if (docListRes.body.length > 0) {
      const genDoc = docListRes.body.find((d: any) => d.specialization === 'General Practitioner');
      doctorId = genDoc?.id || docListRes.body[0].id;
    }

    // Get departments
    const deptRes = await request(app)
      .get('/departments')
      .set('Authorization', `Bearer ${adminToken}`);
    if (deptRes.body.length > 0) {
      const cardio = deptRes.body.find((d: any) => d.name === 'Cardiology');
      deptId = cardio?.id || deptRes.body[0].id;
    }

    // Get a patient
    const usersRes = await request(app)
      .get('/users?role=patient&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);
    if (usersRes.body.users?.length > 0 && usersRes.body.users[0].patient) {
      patientId = usersRes.body.users[0].patient.id;
    }
  });

  it('Doctor can create a referral', async () => {
    if (!patientId || !deptId) return;

    const res = await request(app)
      .post('/referrals')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId,
        referredToDepartmentId: deptId,
        reason: 'Patient needs specialized cardiac evaluation',
      });

    expect(res.status).toBe(201);
  });

  it('Cannot create referral without patient', async () => {
    const res = await request(app)
      .post('/referrals')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: '00000000-0000-0000-0000-000000000000',
        referredToDepartmentId: deptId,
        reason: 'Test',
      });

    expect(res.status).toBe(400);
  });
});
