import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { createUserProfile, isEmailTaken, isPhoneTaken } from '../utils/database.js';
import { UserService } from '../services/UserService.js';

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

      // Uniqueness checks in our DB (users table)
      if (email) {
        const taken = await isEmailTaken(email);
        if (taken) {
          return res.status(409).json({ success: false, error: 'Email already exists' });
        }
      }

      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${process.env.FRONTEND_URL}/verify-email`,
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
        try {
          const profileResult = await createUserProfile(data.user.id, {
            name,
            email,
            email_confirmed_at: data.user.email_confirmed_at,
          });

          if (profileResult.error) {
            console.error('Profile creation error:', profileResult.error);
          } else {
            console.log('User profile created successfully:', profileResult.data);
          }
        } catch (profileError) {
          console.error('Profile creation exception:', profileError);
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

      const userService = new UserService();
      const result = await userService.getUserWithDetails(user.id);

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
          profile: result.success ? result.data : null,
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

  // Mobile OTP Authentication Methods
  static async sendPhoneOtp(req: Request, res: Response) {
    try {
      const { phone } = req.body;

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

      // Use Supabase's built-in phone OTP functionality
      const { data, error } = await supabaseAdmin.auth.signInWithOtp({
        phone: cleanPhone,
      });

      if (error) {
        console.error('Error sending OTP:', error);
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message === 'Unsupported phone provider') {
          errorMessage = 'Phone authentication is not configured. Please contact support.';
        } else if (error.message.includes('phone_provider_disabled')) {
          errorMessage = 'Phone authentication is disabled. Please contact support.';
        }
        
        return res.status(400).json({
          success: false,
          error: errorMessage,
          code: error.status || 400,
        });
      }

      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone: cleanPhone,
          message: 'OTP sent to your phone number',
        },
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP',
      });
    }
  }

  static async verifyPhoneOtp(req: Request, res: Response) {
    try {
      const { phone, otp } = req.body;

      // Clean phone number
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

      // Uniqueness check in our DB before creating profile
      const phoneTaken = await isPhoneTaken(cleanPhone);
      if (phoneTaken) {
        return res.status(409).json({ success: false, error: 'Phone number already exists' });
      }

      // Use Supabase's built-in OTP verification
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        phone: cleanPhone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        console.error('Error verifying OTP:', error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      // If this is a new user (first time phone verification), create a profile
      if (data.user && !data.user.user_metadata?.profile_created) {
        try {
          const profileResult = await createUserProfile(data.user.id, {
            name: data.user.user_metadata?.name || 'Phone User',
            email: data.user.email || null,
            phone: cleanPhone,
            email_confirmed_at: data.user.email_confirmed_at,
          });

          if (profileResult.error) {
            console.error('Profile creation error for phone user:', profileResult.error);
          } else {            
            // Update user metadata to mark profile as created
            await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
              user_metadata: {
                ...data.user.user_metadata,
                profile_created: true,
                phone: cleanPhone,
              }
            });
          }
        } catch (profileError) {
          console.error('Profile creation exception for phone user:', profileError);
        }
      }

      // If successful, user is now authenticated and we have a session
      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
        message: 'Phone verification successful',
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify OTP',
      });
    }
  }

  static async updatePhone(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // Clean phone number
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

      // Ensure phone not used by another account
      const takenByAnother = await isPhoneTaken(cleanPhone, userId);
      if (takenByAnother) {
        return res.status(409).json({ success: false, error: 'Phone number already in use' });
      }

      // Use Supabase's built-in phone update functionality
      const { data, error } = await supabaseAdmin.auth.updateUser({
        phone: cleanPhone,
      });

      if (error) {
        console.error('Error updating phone:', error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      // Also update the phone number in the users table
      try {
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .update({ 
            phone_number: cleanPhone,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating phone in users table:', profileError);
        }
      } catch (profileError) {
        console.error('Exception updating phone in users table:', profileError);
      }

      res.json({
        success: true,
        data: {
          user: data.user,
        },
        message: 'Phone number updated. Please verify your new phone number.',
      });
    } catch (error) {
      console.error('Update phone error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update phone number',
      });
    }
  }

  static async verifyPhoneChange(req: Request, res: Response) {
    try {
      const { phone, otp } = req.body;

      // Clean phone number
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

      // Use Supabase's built-in OTP verification for phone change
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        phone: cleanPhone,
        token: otp,
        type: 'phone_change',
      });

      if (error) {
        console.error('Error verifying phone change:', error);
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.json({
        success: true,
        data: {
          user: data.user,
        },
        message: 'Phone number verified successfully',
      });
    } catch (error) {
      console.error('Verify phone change error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify phone number change',
      });
    }
  }

  // Google OAuth Methods
  static async signInWithGoogle(req: Request, res: Response) {
    try {
      const { accessToken, idToken } = req.body as { accessToken?: string; idToken?: string };

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'ID token is required',
        });
      }

      // Sign in with Google using Supabase
      const params: any = { provider: 'google', token: idToken };
      if (accessToken && accessToken.length > 0) params.access_token = accessToken;
      const { data, error } = await supabaseAdmin.auth.signInWithIdToken(params);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      // If this is a new user (first time Google sign-in), create a profile
      if (data.user && !data.user.user_metadata?.profile_created) {
        try {
          console.log('Creating Google user profile for:', data.user.id);
          
          const profileResult = await createUserProfile(data.user.id, {
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Google User',
            email: data.user.email,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            email_confirmed_at: data.user.email_confirmed_at,
          });

          if (profileResult.error) {
            console.error('Google user profile creation error:', profileResult.error);
          } else {
            console.log('Google user profile created successfully:', profileResult.data);
            
            // Update user metadata to mark profile as created
            await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
              user_metadata: {
                ...data.user.user_metadata,
                profile_created: true,
                provider: 'google',
              }
            });
          }
        } catch (profileError) {
          console.error('Google profile creation exception:', profileError);
        }
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
        message: 'Google sign-in successful',
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sign in with Google',
      });
    }
  }

  static async signUpWithGoogle(req: Request, res: Response) {
    try {
      const { accessToken, idToken } = req.body as { accessToken?: string; idToken?: string };

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'ID token is required',
        });
      }

      // Sign up with Google using Supabase
      const params: any = { provider: 'google', token: idToken };
      if (accessToken && accessToken.length > 0) params.access_token = accessToken;
      const { data, error } = await supabaseAdmin.auth.signInWithIdToken(params);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      // For Google sign-up, enforce email uniqueness in our users table and create profile
      if (data.user) {
        if (data.user.email) {
          const taken = await isEmailTaken(data.user.email);
          if (taken) {
            return res.status(409).json({ success: false, error: 'Email already exists' });
          }
        }
        try {
          console.log('Creating Google sign-up profile for:', data.user.id);
          
          const profileResult = await createUserProfile(data.user.id, {
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Google User',
            email: data.user.email,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            email_confirmed_at: data.user.email_confirmed_at,
          });

          if (profileResult.error) {
            console.error('Google sign-up profile creation error:', profileResult.error);
          } else {
            console.log('Google sign-up profile created successfully:', profileResult.data);
            
            // Update user metadata to mark profile as created
            await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
              user_metadata: {
                ...data.user.user_metadata,
                profile_created: true,
                provider: 'google',
              }
            });
          }
        } catch (profileError) {
          console.error('Google sign-up profile creation exception:', profileError);
        }
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
        message: 'Google sign-up successful',
      });
    } catch (error) {
      console.error('Google sign-up error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sign up with Google',
      });
    }
  }

  static async resendVerificationEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      const { error } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.FRONTEND_URL}/verify-email`,
        },
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      console.error('Resend verification email error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}