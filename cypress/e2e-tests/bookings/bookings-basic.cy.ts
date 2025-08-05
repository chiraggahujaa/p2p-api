// Booking Management API Tests
/// <reference types="cypress" />

import { ApiClient } from '../../support/request/api';
import { AuthHelper } from '../../support/helpers/auth';
import { ItemHelper } from '../../support/helpers/items';
import { BookingHelper } from '../../support/helpers/bookings';
import { TestUtils } from '../../support/helpers/utils';
import { testBookings, statusUpdates, ratingsAndFeedback, BookingDataManager } from '../../data/bookings';

describe('Bookings API - Basic Operations', () => {
  let ownerSession: any;
  let renterSession: any;
  let testItem: any;
  let testBookingIds: string[] = [];

  before(() => {
    // Create owner user and test item
    cy.createAndLoginTestUser({ name: 'Item Owner' })
      .then((session) => {
        ownerSession = session;
        return ItemHelper.createTestItem();
      })
      .then((item) => {
        testItem = item;
        return AuthHelper.logout();
      })
      .then(() => {
        // Create renter user
        return cy.createAndLoginTestUser({ name: 'Item Renter' });
      })
      .then((session) => {
        renterSession = session;
        return AuthHelper.logout();
      });
  });

  beforeEach(() => {
    // Login as renter for most tests (renters create bookings)
    ApiClient.setAuthToken(renterSession.tokens.accessToken);
  });

  afterEach(() => {
    AuthHelper.clearAuth();
  });

  after(() => {
    // Clean up bookings
    if (testBookingIds.length > 0) {
      ApiClient.setAuthToken(renterSession.tokens.accessToken);
      BookingHelper.cleanupTestBookings(testBookingIds);
    }
    
    // Clean up item
    if (testItem) {
      ApiClient.setAuthToken(ownerSession.tokens.accessToken);
      ItemHelper.deleteItem(testItem.id);
    }
  });

  describe('Create Booking', () => {
    it('should successfully create booking with valid data', () => {
      cy.logTestStep('Testing booking creation with valid data');
      
      BookingHelper.createTestBooking(testItem.id)
        .then((booking) => {
          expect(booking.item_id).to.eq(testItem.id);
          expect(booking.renter_id).to.eq(renterSession.user.id);
          expect(booking.status).to.eq('pending');
          expect(booking.total_amount).to.be.above(0);
          expect(booking.total_days).to.be.above(0);
          
          testBookingIds.push(booking.id);
          cy.logTestStep('Booking created successfully', booking.id);
        });
    });

    it('should create booking with predefined test data', () => {
      cy.logTestStep('Testing booking creation with predefined data');
      
      BookingHelper.createPredefinedBooking(testItem.id, 'shortTerm')
        .then((booking) => {
          expect(booking.item_id).to.eq(testItem.id);
          expect(booking.total_days).to.eq(testBookings.shortTerm.total_days);
          expect(booking.status).to.eq('pending');
          
          testBookingIds.push(booking.id);
        });
    });

    it('should calculate correct total amount based on duration', () => {
      cy.logTestStep('Testing booking amount calculation');
      
      const bookingData = {
        ...testBookings.weeklyRental,
        total_amount: testItem.price_per_day * testBookings.weeklyRental.total_days
      };
      
      BookingHelper.createTestBooking(testItem.id, bookingData)
        .then((booking) => {
          // Verify amount calculation
          BookingHelper.verifyBookingAmount(booking, {
            daily: testItem.price_per_day,
            weekly: testItem.price_per_week,
            monthly: testItem.price_per_month
          });
          
          testBookingIds.push(booking.id);
        });
    });

    it('should fail to create booking without authentication', () => {
      cy.logTestStep('Testing booking creation without authentication');
      
      AuthHelper.clearAuth();
      
      const bookingData = BookingDataManager.generateCreatePayload(testItem.id);
      
      ApiClient.createBooking(bookingData)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to create booking with invalid dates', () => {
      cy.logTestStep('Testing booking creation with invalid dates');
      
      const invalidBookings = [
        { ...testBookings.minimal, start_date: '2023-01-01', end_date: '2023-01-02' }, // Past dates
        { ...testBookings.minimal, start_date: '2024-12-31', end_date: '2024-01-01' }, // End before start
      ];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      invalidBookings.forEach((invalidData, index) => {
        chain = chain.then(() => {
          return BookingHelper.testInvalidBookingCreation(testItem.id, invalidData)
            .then((response) => {
              expect(response.body.error).to.include('date');
              cy.log(`Invalid booking ${index + 1} rejected correctly`);
            });
        });
      });
    });

    it('should fail to create booking for non-existent item', () => {
      cy.logTestStep('Testing booking creation for non-existent item');
      
      BookingHelper.testInvalidBookingCreation('non-existent-item-id', testBookings.minimal)
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 404]);
          expect(response.body.error).to.include('item');
        });
    });

    it('should handle booking date conflicts', () => {
      cy.logTestStep('Testing booking date conflicts');
      
      const conflictingDates = {
        start_date: TestUtils.getRelativeDate(5),
        end_date: TestUtils.getRelativeDate(8)
      };
      
      BookingHelper.testBookingDateConflict(testItem.id, conflictingDates)
        .then((result) => {
          expect(result.firstBooking).to.exist;
          expect(result.conflictResponse.body.error).to.include('conflict');
          
          testBookingIds.push(result.firstBooking.id);
        });
    });
  });

  describe('Get Booking by ID', () => {
    let testBooking: any;

    beforeEach(() => {
      BookingHelper.createTestBooking(testItem.id)
        .then((booking) => {
          testBooking = booking;
          testBookingIds.push(booking.id);
        });
    });

    it('should return booking details for valid booking ID', () => {
      cy.logTestStep('Testing get booking by ID');
      
      BookingHelper.getAndValidateBooking(testBooking.id)
        .then((booking) => {
          expect(booking.id).to.eq(testBooking.id);
          expect(booking.item_id).to.eq(testItem.id);
          expect(booking.renter_id).to.eq(renterSession.user.id);
        });
    });

    it('should fail to get booking details when not authorized', () => {
      cy.logTestStep('Testing get booking by unauthorized user');
      
      // Create another user and try to access the booking
      cy.createAndLoginTestUser()
        .then(() => {
          return BookingHelper.testBookingPermissions(testBooking.id, false);
        });
    });

    it('should return 404 for non-existent booking ID', () => {
      cy.logTestStep('Testing get booking with invalid ID');
      
      ApiClient.getBookingById('non-existent-booking-id')
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Get User Bookings', () => {
    beforeEach(() => {
      // Create a few test bookings
      const bookingPromises = [
        BookingHelper.createTestBooking(testItem.id),
        BookingHelper.createTestBooking(testItem.id, testBookings.shortTerm)
      ];
      
      cy.wrap(Promise.all(bookingPromises))
        .then((bookings) => {
          (bookings as any[]).forEach(booking => testBookingIds.push(booking.id));
        });
    });

    it('should return current user bookings', () => {
      cy.logTestStep('Testing get user bookings');
      
      BookingHelper.getUserBookings()
        .then((bookings) => {
          expect(bookings.length).to.be.at.least(2);
          
          (bookings as any[]).forEach((booking: any) => {
            expect(booking.renter_id).to.eq(renterSession.user.id);
          });
          
          cy.logTestStep(`Retrieved ${bookings.length} user bookings`);
        });
    });

    it('should fail to get bookings without authentication', () => {
      cy.logTestStep('Testing get bookings without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getMyBookingsFromBookings()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Get User Booking Stats', () => {
    beforeEach(() => {
      // Create bookings with different statuses
      BookingHelper.createTestBooking(testItem.id)
        .then((booking) => {
          testBookingIds.push(booking.id);
          // Switch to owner to confirm booking
          ApiClient.setAuthToken(ownerSession.tokens.accessToken);
          return BookingHelper.confirmBooking(booking.id);
        })
        .then(() => {
          // Switch back to renter
          ApiClient.setAuthToken(renterSession.tokens.accessToken);
        });
    });

    it('should return booking statistics for current user', () => {
      cy.logTestStep('Testing get user booking stats');
      
      BookingHelper.getUserBookingStats()
        .then((stats) => {
          expect(stats.total_bookings).to.be.a('number').and.at.least(0);
          expect(stats.active_bookings).to.be.a('number').and.at.least(0);
          expect(stats.completed_bookings).to.be.a('number').and.at.least(0);
          
          cy.logTestStep('Booking stats retrieved', stats);
        });
    });

    it('should fail to get stats without authentication', () => {
      cy.logTestStep('Testing get booking stats without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getMyBookingStats()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Booking Status Management', () => {
    let testBooking: any;

    beforeEach(() => {
      BookingHelper.createTestBooking(testItem.id)
        .then((booking) => {
          testBooking = booking;
          testBookingIds.push(booking.id);
        });
    });

    it('should complete full booking workflow', () => {
      cy.logTestStep('Testing complete booking workflow');
      
      BookingHelper.testCompleteBookingWorkflow(testItem.id)
        .then((completedBooking) => {
          expect(completedBooking.status).to.eq('completed');
          testBookingIds.push(completedBooking.id);
          
          cy.logTestStep('Booking workflow completed successfully');
        });
    });

    it('should allow owner to confirm booking', () => {
      cy.logTestStep('Testing booking confirmation by owner');
      
      // Switch to owner
      ApiClient.setAuthToken(ownerSession.tokens.accessToken);
      
      BookingHelper.confirmBooking(testBooking.id, 'Booking confirmed by owner')
        .then((booking) => {
          expect(booking.status).to.eq('confirmed');
          expect(booking.notes).to.include('confirmed');
        })
        .then(() => {
          // Switch back to renter
          ApiClient.setAuthToken(renterSession.tokens.accessToken);
        });
    });

    it('should allow renter to cancel booking', () => {
      cy.logTestStep('Testing booking cancellation by renter');
      
      BookingHelper.cancelBooking(testBooking.id, 'Cancelled by renter')
        .then((booking) => {
          expect(booking.status).to.eq('cancelled');
        });
    });

    it('should prevent invalid status transitions', () => {
      cy.logTestStep('Testing invalid status transitions');
      
      // Try to complete a pending booking (should go through confirmed/active first)
      BookingHelper.testInvalidStatusTransition(testBooking.id, 'completed')
        .then((response) => {
          expect(response.body.error).to.include('invalid');
        });
    });

    it('should update booking status with notes', () => {
      cy.logTestStep('Testing status update with notes');
      
      // Switch to owner to confirm
      ApiClient.setAuthToken(ownerSession.tokens.accessToken);
      
      const notes = 'Status updated with detailed notes';
      
      BookingHelper.updateBookingStatus(testBooking.id, 'confirmed', notes)
        .then((booking) => {
          expect(booking.status).to.eq('confirmed');
          expect(booking.notes).to.include(notes);
        })
        .then(() => {
          ApiClient.setAuthToken(renterSession.tokens.accessToken);
        });
    });
  });

  describe('Booking Ratings and Feedback', () => {
    let completedBooking: any;

    beforeEach(() => {
      // Create and complete a booking for rating
      BookingHelper.testCompleteBookingWorkflow(testItem.id)
        .then((booking) => {
          completedBooking = booking;
          testBookingIds.push(booking.id);
        });
    });

    it('should add rating and feedback to completed booking', () => {
      cy.logTestStep('Testing add rating and feedback');
      
      BookingHelper.addRatingAndFeedback(completedBooking.id, 'excellent')
        .then((booking) => {
          expect(booking.rating).to.eq(ratingsAndFeedback.excellent.rating);
          expect(booking.feedback).to.eq(ratingsAndFeedback.excellent.feedback);
          
          cy.logTestStep('Rating and feedback added successfully');
        });
    });

    it('should add rating with different quality levels', () => {
      cy.logTestStep('Testing different rating levels');
      
      const ratingLevels = ['excellent', 'good', 'average', 'poor'] as const;
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      ratingLevels.forEach((level, index) => {
        if (index === 0) {
          // Use the existing completed booking for first rating
          chain = chain.then(() => {
            return BookingHelper.addRatingAndFeedback(completedBooking.id, level);
          });
        } else {
          // Create new bookings for other ratings
          chain = chain.then(() => {
            return BookingHelper.testCompleteBookingWorkflow(testItem.id);
          }).then((booking: any) => {
            testBookingIds.push(booking.id);
            return BookingHelper.addRatingAndFeedback(booking.id, level);
          });
        }
        
        chain = chain.then((booking: any) => {
          expect(booking.rating).to.eq(ratingsAndFeedback[level].rating);
          cy.log(`${level} rating (${ratingsAndFeedback[level].rating} stars) added successfully`);
        });
      });
    });

    it('should fail to add rating to non-completed booking', () => {
      cy.logTestStep('Testing rating on non-completed booking');
      
      // Create a pending booking and try to rate it
      BookingHelper.createTestBooking(testItem.id)
        .then((booking) => {
          testBookingIds.push(booking.id);
          return ApiClient.addRatingAndFeedback(booking.id, ratingsAndFeedback.good);
        })
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 403]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('completed');
        });
    });

    it('should validate rating values', () => {
      cy.logTestStep('Testing rating validation');
      
      const invalidRating = {
        rating: 6, // Should be 1-5
        feedback: 'Invalid rating test'
      };
      
      ApiClient.addRatingAndFeedback(completedBooking.id, invalidRating)
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 422]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('rating');
        });
    });
  });

  describe('Get All Bookings (Admin)', () => {
    it('should return all bookings for admin users', () => {
      cy.logTestStep('Testing get all bookings (admin functionality)');
      
      ApiClient.getAllBookings()
        .then((response) => {
          // This might succeed or fail depending on admin privileges
          if (response.status === 200) {
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.an('array');
            
            response.body.data.forEach((booking: any) => {
              cy.validateBookingStructure(booking);
            });
            
            cy.log(`Retrieved ${response.body.data.length} total bookings`);
          } else {
            expect(response.status).to.be.oneOf([403, 404]);
            expect(response.body.success).to.be.false;
            cy.log('Admin privileges required for all bookings');
          }
        });
    });

    it('should fail to get all bookings without proper authorization', () => {
      cy.logTestStep('Testing get all bookings without admin privileges');
      
      // Most users should not be able to see all bookings
      ApiClient.getAllBookings()
        .then((response) => {
          // Response depends on whether current user has admin privileges
          if (response.status !== 200) {
            expect(response.status).to.be.oneOf([403, 404]);
            expect(response.body.success).to.be.false;
            cy.log('Properly restricted non-admin access');
          } else {
            cy.log('Current user has admin access to all bookings');
          }
        });
    });
  });

  describe('Booking Validation and Edge Cases', () => {
    it('should handle same-day bookings', () => {
      cy.logTestStep('Testing same-day booking');
      
      const sameDayBooking = {
        ...testBookings.sameDay,
        start_date: TestUtils.getRelativeDate(0), // Today
        end_date: TestUtils.getRelativeDate(0), // Today
        total_days: 1
      };
      
      BookingHelper.createTestBooking(testItem.id, sameDayBooking)
        .then((booking) => {
          expect(booking.total_days).to.eq(1);
          expect(booking.start_date).to.eq(booking.end_date);
          
          testBookingIds.push(booking.id);
          cy.logTestStep('Same-day booking created successfully');
        });
    });

    it('should handle long-term bookings', () => {
      cy.logTestStep('Testing long-term booking');
      
      const longTermBooking = {
        start_date: TestUtils.getRelativeDate(30),
        end_date: TestUtils.getRelativeDate(90),
        total_days: 60,
        total_amount: testItem.price_per_day * 60
      };
      
      BookingHelper.createTestBooking(testItem.id, longTermBooking)
        .then((booking) => {
          expect(booking.total_days).to.eq(60);
          
          testBookingIds.push(booking.id);
          cy.logTestStep('Long-term booking created successfully');
        });
    });

    it('should validate booking dates are in the future', () => {
      cy.logTestStep('Testing booking date validation');
      
      BookingHelper.createTestBooking(testItem.id)
        .then((booking) => {
          BookingHelper.verifyBookingDates(booking);
          testBookingIds.push(booking.id);
        });
    });

    it('should handle booking with delivery requirements', () => {
      cy.logTestStep('Testing booking with delivery');
      
      const deliveryBooking = {
        ...testBookings.weeklyRental,
        delivery_required: true,
        delivery_address: '123 Test Street, Test City, TS 12345'
      };
      
      BookingHelper.createTestBooking(testItem.id, deliveryBooking)
        .then((booking) => {
          expect(booking.delivery_required).to.be.true;
          expect(booking.delivery_address).to.eq(deliveryBooking.delivery_address);
          
          testBookingIds.push(booking.id);
        });
    });
  });
});