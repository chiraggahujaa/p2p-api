// Booking and Payment-related type definitions

import { BaseEntity, Location, BookingStatus, DeliveryMode, PaymentMethod, PaymentStatus } from './common.js';
import { User } from './user.js';
import { Item } from './item.js';

// Booking interface
export interface Booking extends BaseEntity {
  id: string;
  itemId: string;
  lenderUserId: string;
  borrowerUserId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyRate: number;
  totalRent: number;
  securityAmount?: number;
  platformFee?: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  deliveryMode?: DeliveryMode;
  pickupLocation?: string;
  deliveryLocation?: string;
  specialInstructions?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  ratingByLender?: number;
  ratingByBorrower?: number;
  feedbackByLender?: string;
  feedbackByBorrower?: string;
  
  // Relations
  item?: Item;
  lender?: User;
  borrower?: User;
  pickupLocationDetails?: Location;
  deliveryLocationDetails?: Location;
  payments?: Payment[];
}

// Payment interface
export interface Payment extends BaseEntity {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentStatus: PaymentStatus;
  gatewayResponse?: Record<string, any>;
  paidAt?: string;
  refundId?: string;
  refundedAt?: string;
  refundAmount?: number;
  platformFee: number;
  
  // Relations
  booking?: Booking;
  user?: User;
}

// Booking filter types
export interface BookingFilters {
  status?: BookingStatus[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  role?: 'lender' | 'borrower' | 'both';
  page?: number;
  limit?: number;
}

// Create/Update DTOs
export interface CreateBookingDto {
  itemId: string;
  startDate: string;
  endDate: string;
  deliveryMode?: DeliveryMode;
  pickupLocation?: string;
  deliveryLocation?: string;
  specialInstructions?: string;
}