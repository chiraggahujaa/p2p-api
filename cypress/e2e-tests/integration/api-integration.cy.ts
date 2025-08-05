// End-to-End API Integration Tests
/// <reference types="cypress" />

import { ApiClient } from '../../support/request/api';
import { AuthHelper } from '../../support/helpers/auth';
import { ItemHelper } from '../../support/helpers/items';
import { BookingHelper } from '../../support/helpers/bookings';
import { TestUtils } from '../../support/helpers/utils';

describe('API Integration Tests - Complete User Journeys', () => {
  let ownerUser: any;
  let renterUser: any;
  let createdItems: string[] = [];
  let createdBookings: string[] = [];

  before(() => {
    cy.log('🚀 Starting API Integration Tests');
    
    // Check API health before starting
    ApiClient.healthCheck()
      .then((response) => {
        expect(response.status).to.eq(200);
        cy.log('✅ API health check passed');
      });
  });

  after(() => {
    cy.log('🧹 Cleaning up integration test data...');
    
    // Clean up bookings
    if (createdBookings.length > 0 && renterUser?.tokens?.accessToken) {
      ApiClient.setAuthToken(renterUser.tokens.accessToken);
      BookingHelper.cleanupTestBookings(createdBookings);
    }
    
    // Clean up items
    if (createdItems.length > 0 && ownerUser?.tokens?.accessToken) {
      ApiClient.setAuthToken(ownerUser.tokens.accessToken);
      ItemHelper.cleanupTestItems(createdItems);
    }
    
    cy.log('✅ Integration test cleanup completed');
  });

  describe('Complete User Journey: Item Owner', () => {
    it('should complete the full item owner journey', () => {
      cy.logTestStep('🏁 Starting Item Owner Journey');
      
      const ownerData = {
        email: TestUtils.randomEmail('owner'),
        password: 'OwnerPassword123!',
        name: 'Integration Test Owner',
        location: 'San Francisco, CA'
      };

      // Step 1: Register as item owner
      cy.logTestStep('Step 1: Owner Registration');
      AuthHelper.createTestUser(ownerData)
        .then((user) => {
          expect(user.email).to.eq(ownerData.email);
          cy.log('✅ Owner registered successfully');
          
          // Step 2: Login as owner
          cy.logTestStep('Step 2: Owner Login');
          return AuthHelper.loginWithCredentials(ownerData.email, ownerData.password);
        })
        .then((session) => {
          ownerUser = session;
          expect(session.user.email).to.eq(ownerData.email);
          cy.log('✅ Owner logged in successfully');
          
          // Step 3: Update profile
          cy.logTestStep('Step 3: Update Owner Profile');
          const profileUpdate = {
            bio: 'I rent out high-quality electronics and tools',
            phone: '+1-555-0123'
          };
          
          return ApiClient.updateMyProfile(profileUpdate);
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.bio).to.include('electronics');
          cy.log('✅ Owner profile updated');
          
          // Step 4: Create multiple items
          cy.logTestStep('Step 4: Create Multiple Items');
          const itemPromises = [
            ItemHelper.createTestItem({
              name: 'MacBook Pro for Rent',
              description: 'High-performance laptop perfect for creative work',
              category: 'Electronics',
              price_per_day: 50.00,
              condition: 'like_new'
            }),
            ItemHelper.createTestItem({
              name: 'Professional Camera Kit',
              description: 'Complete photography setup with lenses',
              category: 'Electronics',
              price_per_day: 75.00,
              condition: 'good'
            }),
            ItemHelper.createTestItem({
              name: 'Power Tools Set',
              description: 'Complete set of power tools for construction',
              category: 'Tools & Equipment',
              price_per_day: 30.00,
              condition: 'good'
            })
          ];
          
          return cy.wrap(Promise.all(itemPromises));
        })
        .then((items) => {
          expect((items as any[]).length).to.eq(3);
          (items as any[]).forEach((item, index) => {
            expect(item.owner_id).to.eq(ownerUser.user.id);
            createdItems.push(item.id);
            cy.log(`✅ Item ${index + 1} created: ${item.name}`);
          });
          
          // Step 5: Verify items appear in owner's items list
          cy.logTestStep('Step 5: Verify Owner Items');
          return ApiClient.getMyItems();
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.length).to.be.at.least(3);
          
          const ownedItemIds = response.body.data.map((item: any) => item.id);
          createdItems.forEach(itemId => {
            expect(ownedItemIds).to.include(itemId);
          });
          
          cy.log('✅ All items appear in owner\'s item list');
          
          // Step 6: Check owner stats
          cy.logTestStep('Step 6: Check Owner Stats');
          return ApiClient.getMyStats();
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.total_items).to.be.at.least(3);
          cy.log(`✅ Owner stats: ${response.body.data.total_items} items`);
          
          cy.logTestStep('🎉 Item Owner Journey Completed Successfully!');
        });
    });
  });

  describe('Complete User Journey: Item Renter', () => {
    it('should complete the full item renter journey', () => {
      cy.logTestStep('🏁 Starting Item Renter Journey');
      
      const renterData = {
        email: TestUtils.randomEmail('renter'),
        password: 'RenterPassword123!',
        name: 'Integration Test Renter',
        location: 'Los Angeles, CA'
      };

      let targetItem: any;

      // Step 1: Register as renter
      cy.logTestStep('Step 1: Renter Registration');
      AuthHelper.createTestUser(renterData)
        .then((user) => {
          expect(user.email).to.eq(renterData.email);
          cy.log('✅ Renter registered successfully');
          
          // Step 2: Login as renter
          cy.logTestStep('Step 2: Renter Login');
          return AuthHelper.loginWithCredentials(renterData.email, renterData.password);
        })
        .then((session) => {
          renterUser = session;
          expect(session.user.email).to.eq(renterData.email);
          cy.log('✅ Renter logged in successfully');
          
          // Step 3: Browse available items
          cy.logTestStep('Step 3: Browse Available Items');
          return ApiClient.getAllItems();
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.length).to.be.at.least(1);
          cy.log(`✅ Found ${response.body.data.length} available items`);
          
          // Step 4: Search for specific item
          cy.logTestStep('Step 4: Search for Electronics');
          return ItemHelper.searchItems('MacBook');
        })
        .then((items) => {
          expect(items.length).to.be.at.least(1);
          targetItem = items[0];
          cy.log(`✅ Found item to rent: ${targetItem.name}`);
          
          // Step 5: Check item availability
          cy.logTestStep('Step 5: Check Item Availability');
          const startDate = TestUtils.getRelativeDate(7);
          const endDate = TestUtils.getRelativeDate(10);
          
          return ItemHelper.checkAvailability(targetItem.id, startDate, endDate);
        })
        .then((availability) => {
          expect(availability.available).to.be.true;
          cy.log('✅ Item is available for desired dates');
          
          // Step 6: Add item to favorites
          cy.logTestStep('Step 6: Add Item to Favorites');
          return ItemHelper.addToFavorites(targetItem.id);
        })
        .then(() => {
          cy.log('✅ Item added to favorites');
          
          // Step 7: Verify favorites
          return ApiClient.getMyFavorites();
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          const favoriteIds = response.body.data.map((item: any) => item.id);
          expect(favoriteIds).to.include(targetItem.id);
          cy.log('✅ Item appears in favorites list');
          
          // Step 8: Create booking
          cy.logTestStep('Step 8: Create Booking');
          const bookingData = {
            start_date: TestUtils.getRelativeDate(7),
            end_date: TestUtils.getRelativeDate(10),
            total_days: 3,
            total_amount: targetItem.price_per_day * 3,
            notes: 'Need this for a weekend project'
          };
          
          return BookingHelper.createTestBooking(targetItem.id, bookingData);
        })
        .then((booking) => {
          expect(booking.item_id).to.eq(targetItem.id);
          expect(booking.renter_id).to.eq(renterUser.user.id);
          expect(booking.status).to.eq('pending');
          createdBookings.push(booking.id);
          cy.log(`✅ Booking created: ${booking.id}`);
          
          // Step 9: Check booking in user's bookings
          cy.logTestStep('Step 9: Verify Booking in List');
          return BookingHelper.getUserBookings();
        })
        .then((bookings) => {
          const bookingIds = bookings.map((b: any) => b.id);
          expect(bookingIds).to.include(createdBookings[0]);
          cy.log('✅ Booking appears in user\'s booking list');
          
          // Step 10: Check renter stats
          cy.logTestStep('Step 10: Check Renter Stats');
          return BookingHelper.getUserBookingStats();
        })
        .then((stats) => {
          expect(stats.total_bookings).to.be.at.least(1);
          cy.log(`✅ Renter stats: ${stats.total_bookings} total bookings`);
          
          cy.logTestStep('🎉 Item Renter Journey Completed Successfully!');
        });
    });
  });

  describe('Complete Booking Lifecycle', () => {
    it('should complete the full booking lifecycle with owner and renter interaction', () => {
      cy.logTestStep('🏁 Starting Complete Booking Lifecycle');
      
      let bookingId: string;
      let itemForBooking: any;

      // Use the first created item for this test
      itemForBooking = { id: createdItems[0] };

      // Step 1: Renter creates a booking
      cy.logTestStep('Step 1: Renter Creates Booking');
      ApiClient.setAuthToken(renterUser.tokens.accessToken);
      
      BookingHelper.createTestBooking(itemForBooking.id, {
        start_date: TestUtils.getRelativeDate(1),
        end_date: TestUtils.getRelativeDate(4),
        total_days: 3,
        total_amount: 150.00,
        notes: 'Integration test booking'
      })
        .then((booking) => {
          bookingId = booking.id;
          createdBookings.push(bookingId);
          expect(booking.status).to.eq('pending');
          cy.log('✅ Renter created booking (pending status)');
          
          // Step 2: Owner views and confirms booking
          cy.logTestStep('Step 2: Owner Confirms Booking');
          ApiClient.setAuthToken(ownerUser.tokens.accessToken);
          
          return BookingHelper.confirmBooking(bookingId, 'Confirmed by owner - ready for pickup');
        })
        .then((booking) => {
          expect(booking.status).to.eq('confirmed');
          cy.log('✅ Owner confirmed booking');
          
          // Step 3: Start the rental (item picked up)
          cy.logTestStep('Step 3: Start Rental (Pickup)');
          return BookingHelper.startBooking(bookingId, 'Item picked up by renter');
        })
        .then((booking) => {
          expect(booking.status).to.eq('active');
          cy.log('✅ Rental started (active status)');
          
          // Step 4: Complete the rental (item returned)
          cy.logTestStep('Step 4: Complete Rental (Return)');
          return BookingHelper.completeBooking(bookingId, 'Item returned in good condition');
        })
        .then((booking) => {
          expect(booking.status).to.eq('completed');
          cy.log('✅ Rental completed');
          
          // Step 5: Renter adds rating and feedback
          cy.logTestStep('Step 5: Renter Adds Rating');
          ApiClient.setAuthToken(renterUser.tokens.accessToken);
          
          return BookingHelper.addRatingAndFeedback(bookingId, 'excellent');
        })
        .then((booking) => {
          expect(booking.rating).to.eq(5);
          expect(booking.feedback).to.include('Excellent');
          cy.log('✅ Renter added 5-star rating');
          
          // Step 6: Verify final booking state
          cy.logTestStep('Step 6: Verify Final Booking State');
          return BookingHelper.getAndValidateBooking(bookingId);
        })
        .then((booking) => {
          expect(booking.status).to.eq('completed');
          expect(booking.rating).to.eq(5);
          expect(booking.feedback).to.exist;
          cy.log('✅ Booking lifecycle completed successfully');
          
          cy.logTestStep('🎉 Complete Booking Lifecycle Finished!');
        });
    });
  });

  describe('Cross-Entity Data Consistency', () => {
    it('should maintain data consistency across all entities', () => {
      cy.logTestStep('🏁 Testing Cross-Entity Data Consistency');
      
      // Step 1: Verify owner's stats reflect created items and bookings
      cy.logTestStep('Step 1: Verify Owner Stats Consistency');
      ApiClient.setAuthToken(ownerUser.tokens.accessToken);
      
      ApiClient.getMyStats()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          const stats = response.body.data;
          
          expect(stats.total_items).to.be.at.least(createdItems.length);
          cy.log(`✅ Owner has ${stats.total_items} items (expected >= ${createdItems.length})`);
          
          // Step 2: Verify renter's stats reflect bookings
          cy.logTestStep('Step 2: Verify Renter Stats Consistency');
          ApiClient.setAuthToken(renterUser.tokens.accessToken);
          
          return BookingHelper.getUserBookingStats();
        })
        .then((stats) => {
          expect(stats.total_bookings).to.be.at.least(createdBookings.length);
          expect(stats.completed_bookings).to.be.at.least(1);
          cy.log(`✅ Renter has ${stats.total_bookings} bookings (expected >= ${createdBookings.length})`);
          
          // Step 3: Verify item analytics for owner
          cy.logTestStep('Step 3: Verify Item Analytics');
          ApiClient.setAuthToken(ownerUser.tokens.accessToken);
          
          return ItemHelper.getItemAnalytics(createdItems[0]);
        })
        .then((analytics) => {
          // Analytics might have booking counts, views, etc.
          cy.log('✅ Item analytics retrieved', analytics);
          
          // Step 4: Cross-reference booking data
          cy.logTestStep('Step 4: Cross-Reference Booking Data');
          return BookingHelper.getAndValidateBooking(createdBookings[0]);
        })
        .then((booking) => {
          // Verify booking references correct item and users
          expect(createdItems).to.include(booking.item_id);
          expect(booking.renter_id).to.eq(renterUser.user.id);
          cy.log('✅ Booking data cross-references are consistent');
          
          // Step 5: Verify search functionality includes created items
          cy.logTestStep('Step 5: Verify Search Includes Created Items');
          AuthHelper.clearAuth(); // Search is public
          
          return ItemHelper.searchItems('MacBook');
        })
        .then((searchResults) => {
          const searchItemIds = searchResults.map((item: any) => item.id);
          const macbookItem = createdItems.find(id => searchItemIds.includes(id));
          
          expect(macbookItem).to.exist;
          cy.log('✅ Created items appear in search results');
          
          cy.logTestStep('🎉 Cross-Entity Data Consistency Verified!');
        });
    });
  });

  describe('Performance and Load Integration', () => {
    it('should handle multiple concurrent operations efficiently', () => {
      cy.logTestStep('🏁 Testing Performance Integration');
      
      // Step 1: Measure concurrent item creation
      cy.logTestStep('Step 1: Concurrent Item Operations');
      ApiClient.setAuthToken(ownerUser.tokens.accessToken);
      
      const startTime = Date.now();
      
      const concurrentOperations = [
        ItemHelper.createTestItem({ name: 'Concurrent Item 1' }),
        ItemHelper.createTestItem({ name: 'Concurrent Item 2' }),
        ItemHelper.createTestItem({ name: 'Concurrent Item 3' })
      ];
      
      cy.wrap(Promise.all(concurrentOperations))
        .then((items) => {
          const duration = Date.now() - startTime;
          
          expect((items as any[]).length).to.eq(3);
          (items as any[]).forEach(item => createdItems.push(item.id));
          
          cy.log(`✅ Created 3 items concurrently in ${duration}ms`);
          
          if (duration > 5000) {
            cy.log('⚠️ Slow concurrent operations detected');
          }
          
          // Step 2: Measure search performance
          cy.logTestStep('Step 2: Search Performance');
          AuthHelper.clearAuth();
          
          const searchStart = Date.now();
          
          return ItemHelper.searchItems('Concurrent');
        })
        .then((results) => {
          const searchDuration = Date.now() - startTime;
          
          expect(results.length).to.be.at.least(3);
          cy.log(`✅ Search completed in ${searchDuration}ms`);
          
          // Step 3: Test rapid booking operations
          cy.logTestStep('Step 3: Rapid Booking Operations');
          ApiClient.setAuthToken(renterUser.tokens.accessToken);
          
          const bookingOperations = results.slice(0, 2).map((item: any) => 
            BookingHelper.createTestBooking(item.id, {
              start_date: TestUtils.getRelativeDate(14),
              end_date: TestUtils.getRelativeDate(17),
              total_days: 3,
              total_amount: 75.00
            })
          );
          
          return cy.wrap(Promise.all(bookingOperations));
        })
        .then((bookings) => {
          expect((bookings as any[]).length).to.eq(2);
          (bookings as any[]).forEach(booking => createdBookings.push(booking.id));
          
          cy.log('✅ Multiple bookings created successfully');
          
          cy.logTestStep('🎉 Performance Integration Tests Completed!');
        });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors gracefully across the entire system', () => {
      cy.logTestStep('🏁 Testing Error Handling Integration');
      
      // Step 1: Test authentication errors
      cy.logTestStep('Step 1: Authentication Error Handling');
      AuthHelper.clearAuth();
      
      ApiClient.createItem({ name: 'Unauthorized Item' })
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
          cy.log('✅ Unauthorized item creation properly rejected');
          
          // Step 2: Test invalid data errors
          cy.logTestStep('Step 2: Invalid Data Error Handling');
          ApiClient.setAuthToken(ownerUser.tokens.accessToken);
          
          return ItemHelper.testInvalidItemCreation({
            name: '',
            price_per_day: -10,
            condition: 'invalid'
          });
        })
        .then((response) => {
          expect(response.body.error).to.exist;
          cy.log('✅ Invalid item data properly rejected');
          
          // Step 3: Test booking conflicts
          cy.logTestStep('Step 3: Booking Conflict Error Handling');
          ApiClient.setAuthToken(renterUser.tokens.accessToken);
          
          const conflictDates = {
            start_date: TestUtils.getRelativeDate(20),
            end_date: TestUtils.getRelativeDate(23)
          };
          
          return BookingHelper.testBookingDateConflict(createdItems[0], conflictDates);
        })
        .then((result) => {
          expect(result.conflictResponse.body.error).to.include('conflict');
          createdBookings.push(result.firstBooking.id);
          cy.log('✅ Booking conflicts properly detected');
          
          // Step 4: Test non-existent resource errors
          cy.logTestStep('Step 4: Non-Existent Resource Error Handling');
          return ApiClient.getItemById('non-existent-item-12345');
        })
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('not found');
          cy.log('✅ Non-existent resources properly handled');
          
          cy.logTestStep('🎉 Error Handling Integration Completed!');
        });
    });
  });

  describe('System Health and Monitoring', () => {
    it('should provide comprehensive system health information', () => {
      cy.logTestStep('🏁 Testing System Health Integration');
      
      // Step 1: Check API health
      cy.logTestStep('Step 1: API Health Check');
      ApiClient.healthCheck()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.status).to.eq('OK');
          
          if (response.body.uptime) {
            expect(response.body.uptime).to.be.a('number').and.above(0);
          }
          
          cy.log('✅ API health check passed');
          
          // Step 2: Check API info
          cy.logTestStep('Step 2: API Information');
          return ApiClient.getApiInfo();
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.message).to.include('running');
          
          if (response.body.version) {
            cy.log(`API Version: ${response.body.version}`);
          }
          
          cy.log('✅ API information retrieved');
          
          // Step 3: Performance summary
          cy.logTestStep('Step 3: Performance Summary');
          const testSummary = {
            totalItems: createdItems.length,
            totalBookings: createdBookings.length,
            testDuration: Date.now() - Cypress.env('testStartTime'),
            environment: TestUtils.getTestEnvironment()
          };
          
          cy.log('📊 Integration Test Summary:', testSummary);
          
          cy.logTestStep('🎉 System Health Integration Completed!');
        });
    });
  });
});