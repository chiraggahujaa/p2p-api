// Booking service with specialized operations

import { BaseService } from './BaseService.js';
import { supabaseAdmin } from '../utils/database.js';
import { Booking, CreateBookingDto, BookingFilters } from '../types/booking.js';
import { ApiResponse, PaginatedResponse, BookingStatus } from '../types/common.js';
import { differenceInDays, parseISO, isBefore, isAfter } from 'date-fns';

export class BookingService extends BaseService {
  constructor() {
    super('booking');
  }

  /**
   * Create a new booking
   */
  async createBooking(userId: string, bookingData: CreateBookingDto): Promise<ApiResponse<Booking>> {
    try {
      // First, get item details and verify availability
      const { data: item, error: itemError } = await supabaseAdmin
        .from('item')
        .select(`
          *,
          owner:users(id, full_name, email)
        `)
        .eq('id', bookingData.itemId)
        .eq('is_active', true)
        .eq('status', 'available')
        .single();

      if (itemError) {
        return {
          success: false,
          error: 'Item not found or not available',
        };
      }

      // Check if user is trying to book their own item
      if (item.user_id === userId) {
        return {
          success: false,
          error: 'You cannot book your own item',
        };
      }

      // Check availability for the requested dates
      const availabilityCheck = await this.checkItemAvailability(
        bookingData.itemId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (!availabilityCheck.success) {
        return {
          success: false,
          error: availabilityCheck.error || 'Item not available for selected dates',
        };
      }

      // Calculate rental duration and costs
      const startDate = parseISO(bookingData.startDate);
      const endDate = parseISO(bookingData.endDate);
      const totalDays = differenceInDays(endDate, startDate) + 1;

      // Validate rental duration
      if (totalDays < item.min_rental_days) {
        return {
          success: false,
          error: `Minimum rental period is ${item.min_rental_days} days`,
        };
      }

      if (totalDays > item.max_rental_days) {
        return {
          success: false,
          error: `Maximum rental period is ${item.max_rental_days} days`,
        };
      }

      // Calculate costs
      const dailyRate = item.rent_price_per_day;
      const totalRent = dailyRate * totalDays;
      const securityAmount = item.security_amount ?? 0;
      const platformFee = this.calculatePlatformFee(totalRent);

      // Create booking
      const bookingCreateData = {
        item_id: bookingData.itemId,
        lender_user_id: item.user_id,
        borrower_user_id: userId,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        daily_rate: dailyRate,
        total_rent: totalRent,
        security_amount: securityAmount,
        platform_fee: platformFee,
        booking_status: 'pending' as BookingStatus,
        delivery_mode: bookingData.deliveryMode ?? 'none',
        pickup_location: bookingData.pickupLocation,
        delivery_location: bookingData.deliveryLocation,
        special_instructions: bookingData.specialInstructions,
      };

      const result = await this.create(bookingCreateData);

      if (result.success) {
        // Update item status to booked (optional, depends on business logic)
        // await supabaseAdmin
        //   .from('d_items')
        //   .update({ status: 'booked' })
        //   .eq('item_id', bookingData.item_id);

        // TODO: Send notification to lender
        // await this.sendBookingNotification(result.data.booking_id, 'new_booking');
      }

      return result;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    userId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<ApiResponse<Booking>> {
    try {
      // Get booking details and verify user permission
      const booking = await this.getBookingWithDetails(bookingId, userId);
      if (!booking.success || !booking.data) {
        return booking;
      }

      const bookingData = booking.data;
      const isLender = bookingData.lender_user_id === userId;
      const isBorrower = bookingData.borrower_user_id === userId;

      // Validate status transitions based on user role
      if (!this.isValidStatusTransition(bookingData.booking_status, status, isLender, isBorrower)) {
        return {
          success: false,
          error: 'Invalid status transition',
        };
      }

      const updateData: any = {
        booking_status: status,
      };

      // Set timestamps based on status
      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString();
          if (reason) {
            updateData.cancellation_reason = reason;
          }
          break;
      }

      const result = await this.update(bookingId, updateData);

      if (result.success) {
        // Update item status based on booking status
        let itemStatus = 'available';
        if (status === 'confirmed') itemStatus = 'booked';
        else if (status === 'inProgress') itemStatus = 'inTransit';
        else if (status === 'completed' || status === 'cancelled') itemStatus = 'available';

        await supabaseAdmin
          .from('item')
          .update({ status: itemStatus })
          .eq('item_id', bookingData.item_id);

        // TODO: Send notification
        // await this.sendBookingNotification(bookingId, `booking_${status}`);
      }

      return result;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  /**
   * Add rating and feedback to booking
   */
  async addRatingAndFeedback(
    bookingId: string,
    userId: string,
    rating: number,
    feedback?: string
  ): Promise<ApiResponse<Booking>> {
    try {
      // Get booking details and verify user permission
      const booking = await this.getBookingWithDetails(bookingId, userId);
      if (!booking.success || !booking.data) {
        return booking;
      }

      const bookingData = booking.data;
      const isLender = bookingData.lender_user_id === userId;
      const isBorrower = bookingData.borrower_user_id === userId;

      // Only allow rating after booking is completed
      if (bookingData.booking_status !== 'completed') {
        return {
          success: false,
          error: 'Can only rate completed bookings',
        };
      }

      const updateData: any = {};

      if (isLender) {
        if (bookingData.rating_by_lender) {
          return {
            success: false,
            error: 'You have already rated this booking',
          };
        }
        updateData.rating_by_lender = rating;
        updateData.feedback_by_lender = feedback;
      } else if (isBorrower) {
        if (bookingData.rating_by_borrower) {
          return {
            success: false,
            error: 'You have already rated this booking',
          };
        }
        updateData.rating_by_borrower = rating;
        updateData.feedback_by_borrower = feedback;
      } else {
        return {
          success: false,
          error: 'You are not authorized to rate this booking',
        };
      }

      const result = await this.update(bookingId, updateData);

      // The trust score update will be handled by the database trigger

      return result;
    } catch (error) {
      console.error('Error adding rating and feedback:', error);
      throw error;
    }
  }

  /**
   * Get booking with full details
   */
  async getBookingWithDetails(bookingId: string, userId?: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('booking')
        .select(`
          *,
          item:item(
            *,
            category:categories(category_name),
            location:location(*),
            images:item_image(
              file:file(url),
              is_primary
            )
          ),
          lender:lender_user_id!inner(id, full_name, email, phone_number, avatar_url, trust_score),
          borrower:borrower_user_id!inner(id, full_name, email, phone_number, avatar_url, trust_score),
          pickup_location_details:pickup_location!left(address_line, city, state),
          delivery_location_details:delivery_location!left(address_line, city, state),
          payments:payment(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Booking not found',
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      // Check if user has permission to view this booking
      if (userId && data.lender_user_id !== userId && data.borrower_user_id !== userId) {
        return {
          success: false,
          error: 'You are not authorized to view this booking',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error getting booking details:', error);
      throw error;
    }
  }

  /**
   * Get user bookings with filters
   */
  async getUserBookings(
    userId: string,
    filters: BookingFilters
  ): Promise<PaginatedResponse<any>> {
    try {
      const {
        status = [],
        dateRange,
        role = 'both',
        page = 1,
        limit = 20
      } = filters;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('booking')
        .select(`
          *,
          item:item(item_id, title, image_urls),
          lender:lender_user_id!inner(full_name, avatar_url),
          borrower:borrower_user_id!inner(full_name, avatar_url)
        `, { count: 'exact' });

      // Apply role filter
      if (role === 'lender') {
        query = query.eq('lender_user_id', userId);
      } else if (role === 'borrower') {
        query = query.eq('borrower_user_id', userId);
      } else {
        query = query.or(`lender_user_id.eq.${userId},borrower_user_id.eq.${userId}`);
      }

      // Apply status filter
      if (status.length > 0) {
        query = query.in('booking_status', status);
      }

      // Apply date range filter
      if (dateRange?.start) {
        query = query.gte('start_date', dateRange.start);
      }
      if (dateRange?.end) {
        query = query.lte('end_date', dateRange.end);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error getting user bookings:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics for user
   */
  async getUserBookingStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const [lenderStats, borrowerStats, recentBookings] = await Promise.all([
        // Lender statistics
        supabaseAdmin
          .from('booking')
          .select('booking_status, total_rent, rating_by_borrower')
          .eq('lender_user_id', userId),
        
        // Borrower statistics
        supabaseAdmin
          .from('booking')
          .select('booking_status, total_rent, rating_by_lender')
          .eq('borrower_user_id', userId),
        
        // Recent bookings
        supabaseAdmin
          .from('booking')
          .select(`
            id,
            booking_status,
            start_date,
            item:item(title)
          `)
          .or(`lender_user_id.eq.${userId},borrower_user_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const lenderData = lenderStats.data || [];
      const borrowerData = borrowerStats.data || [];

      const stats = {
        asLender: {
          totalBookings: lenderData.length,
          completedBookings: lenderData.filter(b => b.booking_status === 'completed').length,
          pendingBookings: lenderData.filter(b => b.booking_status === 'pending').length,
          totalEarnings: lenderData.reduce((sum, b) => sum + (b.total_rent || 0), 0),
          averageRating: this.calculateAverageRating(lenderData.map(b => b.rating_by_borrower)),
        },
        asBorrower: {
          totalBookings: borrowerData.length,
          completedBookings: borrowerData.filter(b => b.booking_status === 'completed').length,
          pendingBookings: borrowerData.filter(b => b.booking_status === 'pending').length,
          totalSpent: borrowerData.reduce((sum, b) => sum + (b.total_rent || 0), 0),
          averageRating: this.calculateAverageRating(borrowerData.map(b => b.rating_by_lender)),
        },
        recentBookings: recentBookings.data || [],
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error getting booking stats:', error);
      throw error;
    }
  }

  /**
   * Check item availability for given dates
   */
  private async checkItemAvailability(
    itemId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('booking')
        .select('id')
        .eq('item_id', itemId)
        .in('booking_status', ['confirmed', 'in_progress'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (data && data.length > 0) {
        return {
          success: false,
          error: 'Item is not available for the selected dates',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Calculate platform fee
   */
  private calculatePlatformFee(totalRent: number): number {
    // Platform fee: 5% of total rent, minimum ₹10, maximum ₹500
    const feePercentage = 0.05;
    const minFee = 10;
    const maxFee = 500;
    
    const calculatedFee = totalRent * feePercentage;
    return Math.min(Math.max(calculatedFee, minFee), maxFee);
  }

  /**
   * Validate status transitions
   */
  private isValidStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
    isLender: boolean,
    isBorrower: boolean
  ): boolean {
    const transitions: Record<BookingStatus, { allowed: BookingStatus[], roles: string[] }> = {
      pending: {
        allowed: ['confirmed', 'cancelled'],
        roles: ['lender', 'borrower'], // Both can cancel, only lender can confirm
      },
      confirmed: {
        allowed: ['inProgress', 'cancelled'],
        roles: ['lender', 'borrower'],
      },
      inProgress: {
        allowed: ['completed', 'disputed'],
        roles: ['lender', 'borrower'],
      },
      completed: {
        allowed: [], // Terminal state
        roles: [],
      },
      cancelled: {
        allowed: [], // Terminal state
        roles: [],
      },
      disputed: {
        allowed: ['completed', 'cancelled'], // Admin can resolve
        roles: ['admin'],
      },
    };

    const transition = transitions[currentStatus];
    if (!transition || !transition.allowed.includes(newStatus)) {
      return false;
    }

    // Special cases for role-based transitions
    if (newStatus === 'confirmed' && !isLender) {
      return false; // Only lender can confirm
    }

    if (newStatus === 'cancelled' && currentStatus === 'pending' && !isLender && !isBorrower) {
      return false; // Both can cancel pending bookings
    }

    return true;
  }

  /**
   * Calculate average rating from array of ratings
   */
  private calculateAverageRating(ratings: (number | null)[]): number {
    const validRatings = ratings.filter((rating): rating is number => rating !== null);
    if (validRatings.length === 0) return 0;
    
    return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
  }
}