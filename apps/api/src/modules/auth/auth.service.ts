import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma.js';
import { RegisterPatientInput, LoginInput } from './auth.schema.js';
import { UserRole } from '@hms/shared';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService {
  private getAccessSecret() {
    return process.env.JWT_SECRET || 'hms_local_jwt_access_secret_2026_super_secure_key';
  }

  private getRefreshSecret() {
    return process.env.JWT_REFRESH_SECRET || 'hms_local_jwt_refresh_secret_2026_super_secure_key';
  }

  async registerPatient(input: RegisterPatientInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Create User and Patient in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: 'patient',
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          dateOfBirth: new Date(input.dateOfBirth),
          gender: input.gender,
          phone: input.phone,
          address: input.address,
          nhisNumber: input.nhisNumber,
          emergencyContact: input.emergencyContact,
        },
      });

      return { user, patient };
    });

    return {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.getAccessSecret(),
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.getRefreshSecret(),
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, this.getRefreshSecret()) as {
        id: string;
        email: string;
        role: UserRole;
        departmentId?: string | null;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          doctor: { select: { departmentId: true } },
          staff: { select: { departmentId: true } },
        },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const departmentId = user.doctor?.departmentId || user.staff?.departmentId || null;

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, departmentId },
        this.getAccessSecret(),
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const newRefreshToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, departmentId },
        this.getRefreshSecret(),
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          departmentId,
        },
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async generateResetToken(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't leak user existence; return a dummy token or standard success message in controller,
      // but inside service we can return a signed token.
      throw new Error('If the email exists, a reset link will be sent.');
    }

    // Embed user info and a hash of the current password hash to invalidate token once password is changed
    const resetSecret = this.getAccessSecret() + user.passwordHash;
    const token = jwt.sign(
      { id: user.id, email: user.email },
      resetSecret,
      { expiresIn: '1h' }
    );

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    // Decode token first without verification to find the user
    const decoded = jwt.decode(token) as { id?: string; email?: string } | null;
    if (!decoded || !decoded.id) {
      throw new Error('Invalid reset token.');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    // Verify token with user-specific secret (access secret + current password hash)
    const resetSecret = this.getAccessSecret() + user.passwordHash;
    try {
      jwt.verify(token, resetSecret);
    } catch (err) {
      throw new Error('Invalid or expired reset token.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Password reset successful' };
  }
}
