import { z } from 'zod';
import { emailSchema, passwordSchema } from './common.js';

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'), // Don't validate existing passwords on login
});

// Registration validation
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name too long'),
  email: emailSchema,
  password: passwordSchema, // Use strict password validation for new registrations
});

// Refresh token validation
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Email verification validation
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  type: z.enum(['signup', 'email', 'recovery']),
  email: emailSchema.optional(),
});

// Password reset request validation
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Password update validation (for authenticated users)
export const updatePasswordSchema = z.object({
  password: passwordSchema, // Use strict validation for password updates
  currentPassword: z.string().min(1, 'Current password is required').optional(), // Optional for reset flows
});

// Change email validation
export const changeEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, 'Password is required for email change'),
});

// Account deletion validation
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
  confirmation: z.literal('DELETE', {
    message: 'Please type "DELETE" to confirm account deletion'
  }),
});

// Phone number validation
export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be less than 15 digits')
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');

// Phone login validation
export const phoneLoginSchema = z.object({
  phone: phoneSchema,
});

// OTP validation
export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Phone OTP verification validation
export const phoneOtpVerificationSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Phone update validation (for authenticated users)
export const phoneUpdateSchema = z.object({
  phone: phoneSchema,
});

// Google OAuth validation schemas
export const googleOAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  accessToken: z.string().min(1, 'Access token is required').optional(),
});

// Unified Google authentication validation (allows empty accessToken)
export const googleUnifiedAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  accessToken: z.string().optional(),
});


export const resendVerificationEmailSchema = z.object({
  email: emailSchema,
});