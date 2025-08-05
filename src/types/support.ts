import { BaseEntity, SupportStatus, IssueType } from './common.js';
import { User } from './user.js';
import { Booking } from './booking.js';

// Support Request interface
export interface SupportRequest extends BaseEntity {
  id: string;
  userId: string;
  issueType: IssueType;
  subject: string;
  description: string;
  bookingId?: string;
  priority: number;
  status: SupportStatus;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  
  // Relations
  user?: User;
  booking?: Booking;
  assignedUser?: User;
}

// Create/Update DTOs
export interface CreateSupportRequestDto {
  issueType: IssueType;
  subject: string;
  description: string;
  bookingId?: string;
  priority?: number;
}