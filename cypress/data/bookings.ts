// Centralized booking data for all tests
export interface TestBooking {
  item_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_amount: number;
  deposit_amount?: number;
  delivery_required?: boolean;
  delivery_address?: string;
  pickup_instructions?: string;
  notes?: string;
}

export interface CreateBookingPayload extends Omit<TestBooking, 'id' | 'renter_id' | 'status' | 'created_at' | 'updated_at'> {}

// Booking status types
export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

// Valid test booking scenarios
export const testBookings = {
  // Short-term rental (3 days)
  shortTerm: {
    start_date: '2024-02-01',
    end_date: '2024-02-04',
    total_days: 3,
    total_amount: 75.00,
    deposit_amount: 200.00,
    delivery_required: false,
    notes: 'Short-term rental for weekend project'
  } as Omit<TestBooking, 'item_id'>,

  // Medium-term rental (1 week)
  weeklyRental: {
    start_date: '2024-02-05',
    end_date: '2024-02-12',
    total_days: 7,
    total_amount: 150.00,
    deposit_amount: 300.00,
    delivery_required: true,
    delivery_address: '123 Main St, San Francisco, CA 94102',
    notes: 'Weekly rental with delivery requested'
  } as Omit<TestBooking, 'item_id'>,

  // Long-term rental (1 month)
  monthlyRental: {
    start_date: '2024-03-01',
    end_date: '2024-03-31',
    total_days: 30,
    total_amount: 500.00,
    deposit_amount: 1000.00,
    delivery_required: false,
    pickup_instructions: 'Pickup from garage, ring doorbell',
    notes: 'Long-term rental for extended project'
  } as Omit<TestBooking, 'item_id'>,

  // Same-day rental
  sameDay: {
    start_date: '2024-02-15',
    end_date: '2024-02-15',
    total_days: 1,
    total_amount: 25.00,
    deposit_amount: 100.00,
    delivery_required: false,
    notes: 'Same-day rental for urgent need'
  } as Omit<TestBooking, 'item_id'>,

  // Future booking (far in advance)
  futureBooking: {
    start_date: '2024-06-01',
    end_date: '2024-06-07',
    total_days: 6,
    total_amount: 150.00,
    deposit_amount: 200.00,
    delivery_required: true,
    delivery_address: '456 Oak Ave, Los Angeles, CA 90210',
    notes: 'Advance booking for summer vacation'
  } as Omit<TestBooking, 'item_id'>,

  // Minimal booking data
  minimal: {
    start_date: '2024-02-20',
    end_date: '2024-02-21',
    total_days: 1,
    total_amount: 15.00
  } as Omit<TestBooking, 'item_id'>
} as const;

// Invalid booking data for negative testing
export const invalidBookings = {
  // Past dates
  pastDates: {
    start_date: '2023-01-01',
    end_date: '2023-01-02',
    total_days: 1,
    total_amount: 25.00
  },

  // End date before start date
  invalidDateRange: {
    start_date: '2024-02-10',
    end_date: '2024-02-05',
    total_days: -5,
    total_amount: 25.00
  },

  // Negative amount
  negativeAmount: {
    start_date: '2024-02-15',
    end_date: '2024-02-16',
    total_days: 1,
    total_amount: -25.00
  },

  // Zero days
  zeroDays: {
    start_date: '2024-02-15',
    end_date: '2024-02-15',
    total_days: 0,
    total_amount: 0
  },

  // Invalid date format
  invalidDateFormat: {
    start_date: '2024/02/15',
    end_date: '2024/02/16',
    total_days: 1,
    total_amount: 25.00
  }
} as const;

// Booking status update scenarios
export const statusUpdates = {
  confirm: {
    status: 'confirmed' as BookingStatus,
    notes: 'Booking confirmed by owner'
  },

  start: {
    status: 'active' as BookingStatus,
    notes: 'Item picked up, rental started'
  },

  complete: {
    status: 'completed' as BookingStatus,
    notes: 'Item returned successfully'
  },

  cancel: {
    status: 'cancelled' as BookingStatus,
    notes: 'Booking cancelled by user'
  },

  dispute: {
    status: 'disputed' as BookingStatus,
    notes: 'Dispute raised regarding item condition'
  }
} as const;

// Rating and feedback data
export const ratingsAndFeedback = {
  excellent: {
    rating: 5,
    feedback: 'Excellent item and smooth rental process. Highly recommended!',
    communication_rating: 5,
    item_condition_rating: 5
  },

  good: {
    rating: 4,
    feedback: 'Good experience overall. Item worked as expected.',
    communication_rating: 4,
    item_condition_rating: 4
  },

  average: {
    rating: 3,
    feedback: 'Average experience. Item was okay but could be better maintained.',
    communication_rating: 3,
    item_condition_rating: 3
  },

  poor: {
    rating: 2,
    feedback: 'Item condition was not as described. Communication could be improved.',
    communication_rating: 2,
    item_condition_rating: 2
  },

  terrible: {
    rating: 1,
    feedback: 'Very poor experience. Item was damaged and owner was unresponsive.',
    communication_rating: 1,
    item_condition_rating: 1
  },

  minimal: {
    rating: 4,
    feedback: 'Good rental experience'
  }
} as const;

// Date calculation helpers
export class BookingDateHelper {
  /**
   * Get dates for today + offset days
   */
  static getDatesFromToday(startOffset: number, endOffset: number): { start: string; end: string } {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    
    startDate.setDate(today.getDate() + startOffset);
    endDate.setDate(today.getDate() + endOffset);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }

  /**
   * Calculate total days between dates
   */
  static calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if dates are valid for booking
   */
  static isValidDateRange(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return start >= today && end >= start;
  }

  /**
   * Generate future date range
   */
  static generateFutureDateRange(daysFromNow: number, duration: number): { start: string; end: string } {
    return this.getDatesFromToday(daysFromNow, daysFromNow + duration);
  }
}

// Helper functions for booking data management
export class BookingDataManager {
  /**
   * Generate booking payload for creation
   */
  static generateCreatePayload(
    itemId: string, 
    overrides: Partial<CreateBookingPayload> = {}
  ): CreateBookingPayload {
    const dates = BookingDateHelper.generateFutureDateRange(1, 3); // Tomorrow for 3 days
    const totalDays = BookingDateHelper.calculateDays(dates.start, dates.end);
    
    return {
      item_id: itemId,
      start_date: dates.start,
      end_date: dates.end,
      total_days: totalDays,
      total_amount: totalDays * 25.00, // Default $25/day
      deposit_amount: 100.00,
      delivery_required: false,
      ...overrides
    };
  }

  /**
   * Calculate expected total amount based on item pricing
   */
  static calculateExpectedAmount(
    dailyPrice: number, 
    weeklyPrice: number | null, 
    monthlyPrice: number | null, 
    totalDays: number
  ): number {
    if (totalDays >= 30 && monthlyPrice) {
      const months = Math.floor(totalDays / 30);
      const remainingDays = totalDays % 30;
      return (months * monthlyPrice) + (remainingDays * dailyPrice);
    } else if (totalDays >= 7 && weeklyPrice) {
      const weeks = Math.floor(totalDays / 7);
      const remainingDays = totalDays % 7;
      return (weeks * weeklyPrice) + (remainingDays * dailyPrice);
    } else {
      return totalDays * dailyPrice;
    }
  }

  /**
   * Validate booking data structure
   */
  static validateBookingStructure(booking: any): boolean {
    const requiredFields = [
      'id', 'item_id', 'renter_id', 'start_date', 'end_date', 
      'total_days', 'total_amount', 'status', 'created_at'
    ];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!(field in booking)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get next valid booking status transition
   */
  static getValidStatusTransitions(currentStatus: BookingStatus): BookingStatus[] {
    const transitions: Record<BookingStatus, BookingStatus[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['active', 'cancelled'],
      'active': ['completed', 'disputed'],
      'completed': ['disputed'],
      'cancelled': [],
      'disputed': ['completed', 'cancelled']
    };
    
    return transitions[currentStatus] || [];
  }
}