import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { createUserProfile, getUserProfile } from '../utils/database.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      // Create user profile if user was successfully created
      if (data.user) {
        const profileResult = await createUserProfile(data.user.id, {
          name,
          email,
        });

        if (profileResult.error) {
          console.warn('Profile creation warning:', profileResult.error);
          // Don't fail the registration if profile creation fails
        }
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
        message: data.user?.email_confirmed_at 
          ? 'Registration successful' 
          : 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided',
        });
      }

      // Sign out the specific session
      const { error } = await supabaseAdmin.auth.admin.signOut(token);

      if (error) {
        // Even if there's an error, we might want to consider the logout successful
        // from the client's perspective if the token is invalid
        console.warn('Logout warning:', error.message);
      }

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      // User should be attached to req by the authenticateToken middleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // Get additional user profile data from database
      const { data: profile, error } = await getUserProfile(user.id);

      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Profile fetch error:', error);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || null,
            emailConfirmedAt: user.email_confirmed_at,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
          profile: profile || null,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token, type, email } = req.body;

      if (!token || !type) {
        return res.status(400).json({
          success: false,
          error: 'Token and type are required',
        });
      }

      // Prepare verification parameters based on type
      let verifyParams: any = { token, type };
      
      if (type === 'email' && email) {
        verifyParams.email = email;
      }

      const { data, error } = await supabaseAdmin.auth.verifyOtp(verifyParams);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
        message: 'Email verified successfully',
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async updatePassword(req: Request, res: Response) {
    try {
      const { password } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long',
        });
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password }
      );

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.json({
        success: true,
        message: 'Password updated successfully',
        data: {
          user: data.user,
        },
      });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}