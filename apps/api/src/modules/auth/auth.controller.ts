import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  registerPatientSchema,
  loginSchema,
  requestResetSchema,
  resetPasswordSchema,
} from './auth.schema.js';

const authService = new AuthService();

const COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const parsedInput = registerPatientSchema.parse(req.body);
      const user = await authService.registerPatient(parsedInput);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const parsedInput = loginSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await authService.login(parsedInput);

      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());
      res.json({ accessToken, user });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(401).json({ message: error.message || 'Login failed' });
    }
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies[COOKIE_NAME];
    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token missing' });
      return;
    }

    try {
      const result = await authService.refresh(refreshToken);
      res.cookie(COOKIE_NAME, result.refreshToken, getCookieOptions());
      res.json({ accessToken: result.accessToken, user: result.user });
    } catch (error: any) {
      res.status(401).json({ message: error.message || 'Invalid refresh token' });
    }
  }

  async logout(req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    });
    res.json({ message: 'Logout successful' });
  }

  async requestReset(req: Request, res: Response) {
    try {
      const parsedInput = requestResetSchema.parse(req.body);
      
      try {
        const token = await authService.generateResetToken(parsedInput.email);
        // Under production, we would send this link via email.
        // For local development, we print it to console and return the token in response,
        // so that tests and developers can use it easily without an email server.
        console.log(`[DEV] Password reset link: http://localhost:5173/reset-password?token=${token}`);
        res.json({
          message: 'If the email exists, a password reset link has been generated.',
          token, // Exposed for dev testing
        });
      } catch (error: any) {
        // Obfuscate user existence on error
        res.json({ message: 'If the email exists, a password reset link has been generated.' });
      }
    } catch (error: any) {
      res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const parsedInput = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(parsedInput.token, parsedInput.newPassword);
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ message: error.message || 'Password reset failed' });
    }
  }

  // Helper route to get current user details
  async me(req: Request, res: Response) {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    res.json(req.user);
  }
}
