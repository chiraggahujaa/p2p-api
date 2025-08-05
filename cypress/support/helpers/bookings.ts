// Booking management helper functions
/// <reference types="cypress" />

import { ApiClient } from '../request/api';
import { 
  testBookings, 
  BookingDataManager, 
  BookingDateHelper, 
  statusUpdates, 
  ratingsAndFeedback,
  type BookingStatus
} from '../../data/bookings';

export class BookingHelper {
  /**
   * Create a new test booking
   */
  static createTestBooking(itemId: string, bookingData?: any): Cypress.Chainable<any> {
    const createPayload = BookingDataManager.generateCreatePayload(itemId, bookingData);
    
    return ApiClient.createBooking(createPayload)
      .then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('id');
        
        const createdBooking = response.body.data;
        expect(BookingDataManager.validateBookingStructure(createdBooking)).to.be.true;
        
        cy.log(`Created test booking: ${createdBooking.id} for item ${itemId}`);
        return createdBooking;
      });
  }

  /**
   * Create booking with predefined test data
   */
  static createPredefinedBooking(
    itemId: string, 
    bookingKey: keyof typeof testBookings
  ): Cypress.Chainable<any> {
    const bookingData = { ...testBookings[bookingKey], item_id: itemId };
    
    return ApiClient.createBooking(bookingData)
      .then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        return response.body.data;
      });
  }

  /**
   * Get booking by ID and validate structure
   */
  static getAndValidateBooking(bookingId: string): Cypress.Chainable<any> {
    return ApiClient.getBookingById(bookingId)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        const booking = response.body.data;
        expect(BookingDataManager.validateBookingStructure(booking)).to.be.true;
        
        return booking;
      });
  }

  /**
   * Update booking status and verify
   */
  static updateBookingStatus(
    bookingId: string, 
    status: BookingStatus, 
    notes?: string
  ): Cypress.Chainable<any> {
    return ApiClient.updateBookingStatus(bookingId, status, notes)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        const updatedBooking = response.body.data;
        expect(updatedBooking.status).to.eq(status);
        
        if (notes) {
          expect(updatedBooking.notes).to.include(notes);
        }
        
        cy.log(`Updated booking ${bookingId} status to: ${status}`);
        return updatedBooking;
      });
  }

  /**
   * Test complete booking workflow
   */
  static testCompleteBookingWorkflow(itemId: string): Cypress.Chainable<any> {
    let bookingId: string;
    
    return this.createTestBooking(itemId)
      .then((booking) => {
        bookingId = booking.id;
        expect(booking.status).to.eq('pending');
        
        cy.log('Step 1: Booking created with pending status');
        
        // Confirm booking
        return this.updateBookingStatus(bookingId, 'confirmed', 'Booking confirmed by owner');
      })
      .then((booking) => {
        expect(booking.status).to.eq('confirmed');
        cy.log('Step 2: Booking confirmed');
        
        // Start booking
        return this.updateBookingStatus(bookingId, 'active', 'Item picked up, rental started');
      })
      .then((booking) => {
        expect(booking.status).to.eq('active');
        cy.log('Step 3: Booking started (active)');
        
        // Complete booking
        return this.updateBookingStatus(bookingId, 'completed', 'Item returned successfully');
      })
      .then((booking) => {
        expect(booking.status).to.eq('completed');
        cy.log('Step 4: Booking completed');
        
        return booking;
      });
  }

  /**
   * Confirm booking
   */
  static confirmBooking(bookingId: string, notes?: string): Cypress.Chainable<any> {
    return ApiClient.confirmBooking(bookingId, notes)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data.status).to.eq('confirmed');
        
        cy.log(`Confirmed booking: ${bookingId}`);
        return response.body.data;
      });
  }

  /**
   * Start booking
   */
  static startBooking(bookingId: string, notes?: string): Cypress.Chainable<any> {
    return ApiClient.startBooking(bookingId, notes)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data.status).to.eq('active');
        
        cy.log(`Started booking: ${bookingId}`);
        return response.body.data;
      });
  }

  /**
   * Complete booking
   */
  static completeBooking(bookingId: string, notes?: string): Cypress.Chainable<any> {
    return ApiClient.completeBooking(bookingId, notes)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data.status).to.eq('completed');
        
        cy.log(`Completed booking: ${bookingId}`);
        return response.body.data;
      });
  }

  /**
   * Cancel booking
   */
  static cancelBooking(bookingId: string, reason?: string): Cypress.Chainable<any> {
    return ApiClient.cancelBooking(bookingId, reason)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data.status).to.eq('cancelled');
        
        cy.log(`Cancelled booking: ${bookingId}`);
        return response.body.data;
      });
  }

  /**
   * Add rating and feedback to booking
   */
  static addRatingAndFeedback(
    bookingId: string, 
    ratingKey: keyof typeof ratingsAndFeedback = 'good'
  ): Cypress.Chainable<any> {
    const ratingData = ratingsAndFeedback[ratingKey];
    
    return ApiClient.addRatingAndFeedback(bookingId, ratingData)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        const updatedBooking = response.body.data;
        expect(updatedBooking).to.have.property('rating', ratingData.rating);
        expect(updatedBooking).to.have.property('feedback', ratingData.feedback);
        
        cy.log(`Added ${ratingData.rating}-star rating to booking ${bookingId}`);
        return updatedBooking;
      });
  }

  /**
   * Get user's bookings
   */
  static getUserBookings(): Cypress.Chainable<any[]> {
    return ApiClient.getMyBookingsFromBookings()
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        
        // Validate each booking structure
        response.body.data.forEach((booking: any) => {
          expect(BookingDataManager.validateBookingStructure(booking)).to.be.true;
        });
        
        cy.log(`Retrieved ${response.body.data.length} user bookings`);
        return response.body.data;
      });
  }

  /**
   * Get user's booking statistics
   */
  static getUserBookingStats(): Cypress.Chainable<any> {
    return ApiClient.getMyBookingStats()
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('object');
        
        const stats = response.body.data;
        expect(stats).to.have.property('total_bookings');
        expect(stats).to.have.property('active_bookings');
        expect(stats).to.have.property('completed_bookings');
        
        cy.log('Retrieved user booking statistics', stats);
        return stats;
      });
  }

  /**
   * Test booking validation scenarios
   */
  static testInvalidBookingCreation(itemId: string, invalidData: any): Cypress.Chainable<any> {
    const bookingData = { ...invalidData, item_id: itemId };
    
    return ApiClient.createBooking(bookingData)
      .then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
        expect(response.body.success).to.be.false;
        expect(response.body).to.have.property('error');
        
        return response;
      });
  }

  /**
   * Test booking date conflicts
   */
  static testBookingDateConflict(itemId: string, conflictingDates: any): Cypress.Chainable<any> {
    // First create a booking
    return this.createTestBooking(itemId, {
      start_date: conflictingDates.start_date,
      end_date: conflictingDates.end_date
    })
      .then((firstBooking) => {
        // Try to create another booking with overlapping dates
        return this.testInvalidBookingCreation(itemId, {
          start_date: conflictingDates.start_date,
          end_date: conflictingDates.end_date,
          total_days: BookingDateHelper.calculateDays(
            conflictingDates.start_date, 
            conflictingDates.end_date
          ),
          total_amount: 100.00
        })
          .then((response) => {
            expect(response.body.error).to.include('conflict');
            return { firstBooking, conflictResponse: response };
          });
      });
  }

  /**
   * Calculate and verify booking total amount
   */
  static verifyBookingAmount(
    booking: any, 
    itemPricing: { daily: number; weekly?: number; monthly?: number }
  ): void {
    const expectedAmount = BookingDataManager.calculateExpectedAmount(
      itemPricing.daily,
      itemPricing.weekly || null,
      itemPricing.monthly || null,
      booking.total_days
    );
    
    expect(booking.total_amount).to.be.closeTo(expectedAmount, 0.01);
    cy.log(`Verified booking amount: $${booking.total_amount} for ${booking.total_days} days`);
  }

  /**
   * Test status transition validation
   */
  static testInvalidStatusTransition(bookingId: string, invalidStatus: BookingStatus): Cypress.Chainable<any> {
    return ApiClient.updateBookingStatus(bookingId, invalidStatus)
      .then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
        expect(response.body.success).to.be.false;
        expect(response.body.error).to.include('invalid');
        
        return response;
      });
  }

  /**
   * Create booking for specific date range
   */
  static createBookingForDateRange(
    itemId: string, 
    daysFromNow: number, 
    duration: number
  ): Cypress.Chainable<any> {
    const dates = BookingDateHelper.generateFutureDateRange(daysFromNow, duration);
    const totalDays = BookingDateHelper.calculateDays(dates.start, dates.end);
    
    const bookingData = {
      start_date: dates.start,
      end_date: dates.end,
      total_days: totalDays,
      total_amount: totalDays * 25.00 // Default rate
    };
    
    return this.createTestBooking(itemId, bookingData);
  }

  /**
   * Verify booking dates are valid
   */
  static verifyBookingDates(booking: any): void {
    expect(BookingDateHelper.isValidDateRange(booking.start_date, booking.end_date)).to.be.true;
    
    const calculatedDays = BookingDateHelper.calculateDays(booking.start_date, booking.end_date);
    expect(booking.total_days).to.eq(calculatedDays);
    
    cy.log(`Verified booking dates: ${booking.start_date} to ${booking.end_date} (${booking.total_days} days)`);
  }

  /**
   * Clean up test bookings
   */
  static cleanupTestBookings(bookingIds: string[]): Cypress.Chainable<any> {
    return cy.wrap(bookingIds).each((bookingId: string) => {
      return ApiClient.cancelBooking(bookingId, 'Cleanup - test completed')
        .then((response) => {
          if (response.status === 200) {
            cy.log(`Cleaned up booking: ${bookingId}`);
          } else {
            cy.log(`Failed to cleanup booking ${bookingId}: status ${response.status}`);
          }
        });
    });
  }

  /**
   * Test booking permissions (user can only see their bookings)
   */
  static testBookingPermissions(bookingId: string, shouldHaveAccess: boolean): Cypress.Chainable<any> {
    return ApiClient.getBookingById(bookingId)
      .then((response) => {
        if (shouldHaveAccess) {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
        } else {
          expect(response.status).to.be.oneOf([403, 404]);
          expect(response.body.success).to.be.false;
        }
      });
  }

  /**
   * Generate bookings for analytics testing
   */
  static generateBookingsForAnalytics(itemId: string, count: number = 5): Cypress.Chainable<any[]> {
    const bookingPromises: Cypress.Chainable<any>[] = [];
    
    for (let i = 0; i < count; i++) {
      const daysOffset = i * 7; // Spread bookings across different weeks
      bookingPromises.push(
        this.createBookingForDateRange(itemId, daysOffset + 1, 3)
      );
    }
    
    return cy.wrap(Promise.all(bookingPromises));
  }
}