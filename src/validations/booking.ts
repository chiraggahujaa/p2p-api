import { z } from 'zod';
import { 
  uuidSchema, 
  positiveNumberSchema, 
  bookingStatusSchema, 
  deliveryModeSchema, 
  paymentMethodSchema, 
  paymentStatusSchema 
} from './common.js';

// Booking validation schemas
export const createBookingSchema = z.object({
  itemId: uuidSchema,
  startDate: z.string().date('Invalid start date format (YYYY-MM-DD)'),
  endDate: z.string().date('Invalid end date format (YYYY-MM-DD)'),
  deliveryMode: deliveryModeSchema.optional(),
  pickupLocation: uuidSchema.optional(),
  deliveryLocation: uuidSchema.optional(),
  specialInstructions: z.string().max(1000, 'Special instructions too long').optional(),
}).refine(data => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return startDate >= today;
}, {
  message: 'Start date cannot be in the past',
  path: ['startDate'],
}).refine(data => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  
  return endDate >= startDate;
}, {
  message: 'End date must be greater than or equal to start date',
  path: ['endDate'],
});

export const updateBookingSchema = z.object({
  bookingStatus: bookingStatusSchema.optional(),
  pickupLocation: uuidSchema.optional(),
  deliveryLocation: uuidSchema.optional(),
  specialInstructions: z.string().max(1000, 'Special instructions too long').optional(),
  cancellationReason: z.string().max(500, 'Cancellation reason too long').optional(),
  ratingByLender: z.number().int().min(1).max(5, 'Rating must be between 1 and 5').optional(),
  ratingByBorrower: z.number().int().min(1).max(5, 'Rating must be between 1 and 5').optional(),
  feedbackByLender: z.string().max(1000, 'Feedback too long').optional(),
  feedbackByBorrower: z.string().max(1000, 'Feedback too long').optional(),
});

// Booking status update validation
export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
  reason: z.string().max(500, 'Reason too long').optional(),
});

// Booking cancellation validation
export const cancelBookingSchema = z.object({
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500, 'Reason too long'),
});

// Booking rating validation
export const rateBookingSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  feedback: z.string().max(1000, 'Feedback too long').optional(),
});

// Booking filter validation
export const bookingFilterSchema = z.object({
  status: z.array(bookingStatusSchema).optional(),
  dateRange: z.object({
    start: z.string().date().optional(),
    end: z.string().date().optional(),
  }).optional(),
  role: z.enum(['lender', 'borrower', 'both']).default('both'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Item availability check validation
export const checkAvailabilitySchema = z.object({
  startDate: z.string().date('Invalid start date format (YYYY-MM-DD)'),
  endDate: z.string().date('Invalid end date format (YYYY-MM-DD)'),
}).refine(data => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return startDate >= today;
}, {
  message: 'Start date cannot be in the past',
  path: ['startDate'],
}).refine(data => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  
  return endDate >= startDate;
}, {
  message: 'End date must be greater than or equal to start date',
  path: ['endDate'],
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  bookingId: uuidSchema,
  amount: positiveNumberSchema,
  paymentMethod: paymentMethodSchema,
  transactionId: z.string().max(255, 'Transaction ID too long').optional(),
  gatewayResponse: z.record(z.string(), z.any()).optional(),
});

export const updatePaymentSchema = z.object({
  paymentStatus: paymentStatusSchema.optional(),
  transactionId: z.string().max(255, 'Transaction ID too long').optional(),
  gatewayResponse: z.record(z.string(), z.any()).optional(),
  refundId: z.string().max(255, 'Refund ID too long').optional(),
  refundAmount: z.number().min(0, 'Refund amount cannot be negative').optional(),
});