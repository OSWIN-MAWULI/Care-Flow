import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import departmentsRoutes from './modules/departments/departments.routes.js';
import appointmentsRoutes from './modules/appointments/appointments.routes.js';
import medicalRecordsRoutes from './modules/medical-records/medical-records.routes.js';
import referralsRoutes from './modules/referrals/referrals.routes.js';
import messagingRoutes from './modules/messaging/messaging.routes.js';
import admissionsRoutes from './modules/admissions/admissions.routes.js';
import labOrdersRoutes from './modules/lab-orders/lab-orders.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Make io accessible in route controllers
app.set('io', io);

// Mount routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/departments', departmentsRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/medical-records', medicalRecordsRoutes);
app.use('/referrals', referralsRoutes);
app.use('/messaging', messagingRoutes);
app.use('/admissions', admissionsRoutes);
app.use('/lab-orders', labOrdersRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/documents', documentsRoutes);
app.use('/notifications', notificationsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Live queue estimation — track consult durations
const consultHistory: Record<string, number[]> = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a conversation room for messaging
  socket.on('conversation:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('conversation:leave', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Queue tracking — patient subscribes to their queue position
  socket.on('queue:subscribe', (appointmentId: string) => {
    socket.join(`queue:${appointmentId}`);
  });

  // Doctor marks appointment complete → recalc queue for that doctor
  socket.on('appointment:complete', async (data: { doctorId: string; durationMin: number }) => {
    if (!consultHistory[data.doctorId]) consultHistory[data.doctorId] = [];
    consultHistory[data.doctorId].push(data.durationMin);
    // Keep last 10
    if (consultHistory[data.doctorId].length > 10) {
      consultHistory[data.doctorId] = consultHistory[data.doctorId].slice(-10);
    }

    const avg =
      consultHistory[data.doctorId].reduce((a, b) => a + b, 0) /
      consultHistory[data.doctorId].length;

    // Broadcast updated estimates to all queue subscribers for this doctor
    io.emit(`queue:update:${data.doctorId}`, { averageConsultMin: avg });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`HMS API Server on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
