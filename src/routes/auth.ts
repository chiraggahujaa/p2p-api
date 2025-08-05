import express, { Request, Response } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  updatePasswordSchema
} from '../validations/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request data with Zod
    loginSchema.parse(req.body);
    
    // Call the AuthController method
    await AuthController.login(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }
    
    // If it's not a validation error, re-throw to let AuthController handle it
    throw error;
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request data with Zod
    registerSchema.parse(req.body);
    
    // Call the AuthController method
    await AuthController.register(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }
    
    // If it's not a validation error, re-throw to let AuthController handle it
    throw error;
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Call the AuthController method
    await AuthController.logout(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/auth/profile - Protected route
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    await AuthController.getProfile(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate request data with Zod
    refreshTokenSchema.parse(req.body);
    
    await AuthController.refreshToken(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }
    
    throw error;
  }
});

// POST /api/auth/verify - Verify email
router.post('/verify', async (req: Request, res: Response) => {
  try {
    // Validate request data with Zod
    verifyEmailSchema.parse(req.body);
    
    await AuthController.verifyEmail(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/auth/reset-password - Request password reset
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    // Validate request data with Zod
    resetPasswordSchema.parse(req.body);
    
    await AuthController.resetPassword(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// PUT /api/auth/password - Update password (protected route)
router.put('/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Validate request data with Zod
    updatePasswordSchema.parse(req.body);
    
    await AuthController.updatePassword(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;