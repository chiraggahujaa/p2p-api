// Booking controller with booking management operations

import { Request, Response } from 'express';
import { BookingService } from '../services/BookingService.js';
import { createBookingSchema, updateBookingSchema, bookingFilterSchema } from '../validations/booking.js';
import { validateId, validatePagination } from '../validations/common.js';
import { CreateBookingDto } from '../types/booking.js';
import { BookingStatus } from '../types/common.js';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  /**
   * Create a new booking
   */
  async createBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const validatedData = createBookingSchema.parse(req.body) as CreateBookingDto;

      const result = await this.bookingService.createBooking(userId, validatedData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Create booking error:', error);
      
      if (error.name === 'ZodError') {
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
  }

  /**
   * Get booking by ID
   */
  async getBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: bookingId } = validateId(req.params);

      const result = await this.bookingService.getBookingWithDetails(bookingId, userId);

      if (!result.success) {
        return res.status(result.error === 'Booking not found' ? 404 : 403).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get booking error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: bookingId } = validateId(req.params);
      const { status, reason } = req.body;

      if (!status || !['confirmed', 'cancelled', 'inProgress', 'completed', 'disputed'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required',
        });
      }

      const result = await this.bookingService.updateBookingStatus(
        bookingId,
        userId,
        status as BookingStatus,
        reason
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Update booking status error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Add rating and feedback to booking
   */
  async addRatingAndFeedback(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: bookingId } = validateId(req.params);
      const { rating, feedback } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5',
        });
      }

      const result = await this.bookingService.addRatingAndFeedback(
        bookingId,
        userId,
        parseInt(rating),
        feedback
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Add rating and feedback error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get user's bookings with filters
   */
  async getUserBookings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const parsedFilters = {
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        status: req.query.status && typeof req.query.status === 'string' 
          ? req.query.status.split(',') 
          : req.query.status,
      };

      const validatedFilters = bookingFilterSchema.parse(parsedFilters);

      const cleanFilters = Object.fromEntries(
        Object.entries(validatedFilters).filter(([_, value]) => value !== undefined)
      );

      const result = await this.bookingService.getUserBookings(userId, cleanFilters as any);

      res.json(result);
    } catch (error: any) {
      console.error('Get user bookings error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid filter parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get user's booking statistics
   */
  async getUserBookingStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const result = await this.bookingService.getUserBookingStats(userId);

      res.json(result);
    } catch (error: any) {
      console.error('Get user booking stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: bookingId } = validateId(req.params);
      const { reason } = req.body;

      const result = await this.bookingService.updateBookingStatus(
        bookingId,
        userId,
        'cancelled',
        reason
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Confirm booking (lender only)
   */
  async confirmBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: bookingId } = validateId(req.params);

      const result = await this.bookingService.updateBookingStatus(
        bookingId,
        userId,
        'confirmed'
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Confirm booking error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Start booking (mark as in progress)
   */
  async startBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: bookingId } = validateId(req.params);

      const result = await this.bookingService.updateBookingStatus(
        bookingId,
        userId,
        'inProgress'
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Start booking error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Complete booking
   */
  async completeBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id: bookingId } = validateId(req.params);

      const result = await this.bookingService.updateBookingStatus(
        bookingId,
        userId,
        'completed'
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Complete booking error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking ID format',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get all bookings (admin/management)
   */
  async getAllBookings(req: Request, res: Response) {
    try {
      const { page, limit } = validatePagination(req.query);
      const { status, itemId, userId } = req.query;

      const filters: any = {};

      if (status) filters.booking_status = status;
      if (itemId) filters.item_id = itemId;
      if (userId) {
        // For userId filter, we need to check both lender and borrower
        // This would require a more complex query - for now, skip this filter
      }

      const result = await this.bookingService.findAll({
        page,
        limit,
        filters,
        orderBy: 'created_at',
        orderDirection: 'desc',
      });

      res.json(result);
    } catch (error: any) {
      console.error('Get all bookings error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}