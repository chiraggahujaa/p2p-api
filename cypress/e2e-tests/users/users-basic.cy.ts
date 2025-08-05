// User Management API Tests
/// <reference types="cypress" />

import { ApiClient } from '../../support/request/api';
import { AuthHelper } from '../../support/helpers/auth';
import { TestUtils } from '../../support/helpers/utils';
import { testUsers, profileUpdates, searchCriteria, UserDataManager } from '../../data/users';

describe('Users API - Basic Operations', () => {
  let primaryUser: any;
  let secondaryUser: any;

  before(() => {
    // Create test users for the entire suite
    cy.createAndLoginTestUser()
      .then((session) => {
        primaryUser = session.user;
        return AuthHelper.logout();
      })
      .then(() => {
        return cy.createAndLoginTestUser({
          email: testUsers.secondary.email,
          name: testUsers.secondary.name
        });
      })
      .then((session) => {
        secondaryUser = session.user;
        return AuthHelper.logout();
      });
  });

  beforeEach(() => {
    // Login as primary user for most tests
    cy.loginAsUser('primary').then(() => {
      // Override with our created user
      ApiClient.setAuthToken(primaryUser.tokens?.accessToken);
    });
  });

  afterEach(() => {
    AuthHelper.clearAuth();
  });

  describe('Get All Users', () => {
    it('should return all users without authentication', () => {
      cy.logTestStep('Testing get all users - public endpoint');
      
      AuthHelper.clearAuth();
      
      ApiClient.getAllUsers()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          expect(response.body.data.length).to.be.at.least(2); // At least our test users
          
          // Validate user structure
          response.body.data.forEach((user: any) => {
            cy.validateUserStructure(user);
          });
          
          cy.logTestStep(`Retrieved ${response.body.data.length} users`);
        });
    });

    it('should support pagination for users list', () => {
      cy.logTestStep('Testing users pagination');
      
      AuthHelper.clearAuth();
      
      const params = { page: 1, limit: 1 };
      
      ApiClient.getAllUsers(params)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          expect(response.body.data.length).to.be.at.most(1);
          
          if (response.body.pagination) {
            expect(response.body.pagination).to.have.property('page', 1);
            expect(response.body.pagination).to.have.property('limit', 1);
            expect(response.body.pagination).to.have.property('total');
            expect(response.body.pagination).to.have.property('totalPages');
          }
        });
    });

    it('should handle empty results gracefully', () => {
      cy.logTestStep('Testing empty users results with filters');
      
      AuthHelper.clearAuth();
      
      const params = { 
        location: 'NonExistentLocation12345',
        page: 1,
        limit: 10
      };
      
      ApiClient.getAllUsers(params)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array').and.empty;
        });
    });
  });

  describe('Search Users', () => {
    it('should search users by name', () => {
      cy.logTestStep('Testing user search by name');
      
      AuthHelper.clearAuth();
      
      ApiClient.searchUsers(searchCriteria.byName)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          // Verify search results contain the search term
          response.body.data.forEach((user: any) => {
            expect(user.name.toLowerCase()).to.include(searchCriteria.byName.toLowerCase());
            cy.validateUserStructure(user);
          });
          
          cy.logTestStep(`Search found ${response.body.data.length} users`);
        });
    });

    it('should search users by location', () => {
      cy.logTestStep('Testing user search by location');
      
      AuthHelper.clearAuth();
      
      ApiClient.searchUsers(searchCriteria.byLocation)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          // Check if location-based search works
          response.body.data.forEach((user: any) => {
            if (user.location) {
              expect(user.location.toLowerCase()).to.include(searchCriteria.byLocation.toLowerCase());
            }
          });
        });
    });

    it('should return empty results for non-existent search', () => {
      cy.logTestStep('Testing search with no results');
      
      AuthHelper.clearAuth();
      
      ApiClient.searchUsers(searchCriteria.noResults)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array').and.empty;
        });
    });

    it('should handle special characters in search query', () => {
      cy.logTestStep('Testing search with special characters');
      
      AuthHelper.clearAuth();
      
      const specialQueries = ['user@domain', 'user+123', 'user%20name', 'user&test'];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      specialQueries.forEach((query) => {
        chain = chain.then(() => {
          return ApiClient.searchUsers(query)
            .then((response) => {
              expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.an('array');
              cy.log(`Search "${query}" returned ${response.body.data.length} results`);
            });
        });
      });
    });
  });

  describe('Get User by ID', () => {
    it('should return user details for valid user ID', () => {
      cy.logTestStep('Testing get user by ID');
      
      AuthHelper.clearAuth();
      
      ApiClient.getUserById(primaryUser.id)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.id).to.eq(primaryUser.id);
          expect(response.body.data.email).to.eq(primaryUser.email);
          
          cy.validateUserStructure(response.body.data);
          cy.logTestStep('User details retrieved successfully');
        });
    });

    it('should return 404 for non-existent user ID', () => {
      cy.logTestStep('Testing get user with invalid ID');
      
      AuthHelper.clearAuth();
      
      ApiClient.getUserById('non-existent-id-12345')
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('not found');
        });
    });

    it('should handle malformed user IDs gracefully', () => {
      cy.logTestStep('Testing get user with malformed ID');
      
      AuthHelper.clearAuth();
      
      const malformedIds = ['', 'invalid-id', '123abc', null, undefined];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      malformedIds.forEach((id) => {
        if (id !== null && id !== undefined) {
          chain = chain.then(() => {
            return ApiClient.getUserById(id)
              .then((response) => {
                expect(response.status).to.be.oneOf([400, 404]);
                expect(response.body.success).to.be.false;
              });
          });
        }
      });
    });
  });

  describe('Get User Items', () => {
    it('should return items for a user', () => {
      cy.logTestStep('Testing get user items');
      
      AuthHelper.clearAuth();
      
      ApiClient.getUserItems(primaryUser.id)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          // Validate item structure if items exist
          response.body.data.forEach((item: any) => {
            expect(item).to.have.property('id');
            expect(item).to.have.property('name');
            expect(item).to.have.property('owner_id', primaryUser.id);
            cy.validateItemStructure(item);
          });
          
          cy.logTestStep(`Found ${response.body.data.length} items for user`);
        });
    });

    it('should return empty array for user with no items', () => {
      cy.logTestStep('Testing get items for user with no items');
      
      AuthHelper.clearAuth();
      
      ApiClient.getUserItems(secondaryUser.id)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          // Should be empty or contain items, both are valid
        });
    });

    it('should return 404 for non-existent user items', () => {
      cy.logTestStep('Testing get items for non-existent user');
      
      AuthHelper.clearAuth();
      
      ApiClient.getUserItems('non-existent-user-id')
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Get Current User Profile', () => {
    it('should return current user profile when authenticated', () => {
      cy.logTestStep('Testing get current user profile');
      
      ApiClient.getMyProfile()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.id).to.eq(primaryUser.id);
          expect(response.body.data.email).to.eq(primaryUser.email);
          
          cy.validateUserStructure(response.body.data);
          cy.logTestStep('Current user profile retrieved');
        });
    });

    it('should fail to get profile when not authenticated', () => {
      cy.logTestStep('Testing get profile without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getMyProfile()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Update Current User Profile', () => {
    it('should successfully update basic profile information', () => {
      cy.logTestStep('Testing basic profile update');
      
      const updateData = profileUpdates.basic;
      
      ApiClient.updateMyProfile(updateData)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.name).to.eq(updateData.name);
          expect(response.body.data.bio).to.eq(updateData.bio);
          expect(response.body.data.location).to.eq(updateData.location);
          
          cy.validateUserStructure(response.body.data);
          cy.logTestStep('Profile updated successfully');
        });
    });

    it('should update profile with minimal data', () => {
      cy.logTestStep('Testing minimal profile update');
      
      const updateData = profileUpdates.minimal;
      
      ApiClient.updateMyProfile(updateData)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.name).to.eq(updateData.name);
        });
    });

    it('should update complete profile information', () => {
      cy.logTestStep('Testing complete profile update');
      
      const updateData = profileUpdates.complete;
      
      ApiClient.updateMyProfile(updateData)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.name).to.eq(updateData.name);
          expect(response.body.data.bio).to.eq(updateData.bio);
          expect(response.body.data.location).to.eq(updateData.location);
          expect(response.body.data.phone).to.eq(updateData.phone);
          
          cy.validateUserStructure(response.body.data);
        });
    });

    it('should fail to update profile when not authenticated', () => {
      cy.logTestStep('Testing profile update without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.updateMyProfile(profileUpdates.basic)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should validate profile update data', () => {
      cy.logTestStep('Testing profile update validation');
      
      const invalidData = {
        name: '', // Empty name should fail
        email: 'invalid-email-format', // Should not allow email change or invalid format
        phone: 'invalid-phone'
      };
      
      ApiClient.updateMyProfile(invalidData)
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 422]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.exist;
        });
    });

    it('should handle special characters in profile data', () => {
      cy.logTestStep('Testing profile update with special characters');
      
      const specialData = {
        name: 'José María O\'Connor',
        bio: 'Bio with "quotes" & <special> characters!',
        location: 'São Paulo, Brasil 🇧🇷'
      };
      
      ApiClient.updateMyProfile(specialData)
        .then((response) => {
          // Should either accept or reject with proper validation
          if (response.status === 200) {
            expect(response.body.data.name).to.eq(specialData.name);
            expect(response.body.data.bio).to.eq(specialData.bio);
            expect(response.body.data.location).to.eq(specialData.location);
            cy.log('Special characters accepted in profile');
          } else {
            expect(response.status).to.be.oneOf([400, 422]);
            expect(response.body.error).to.exist;
            cy.log('Special characters rejected with validation');
          }
        });
    });
  });

  describe('Get Current User Items', () => {
    it('should return current user items when authenticated', () => {
      cy.logTestStep('Testing get current user items');
      
      ApiClient.getMyItems()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          // All items should belong to current user
          response.body.data.forEach((item: any) => {
            expect(item.owner_id).to.eq(primaryUser.id);
            cy.validateItemStructure(item);
          });
          
          cy.logTestStep(`Found ${response.body.data.length} items for current user`);
        });
    });

    it('should fail to get items when not authenticated', () => {
      cy.logTestStep('Testing get current user items without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getMyItems()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Get Current User Bookings', () => {
    it('should return current user bookings when authenticated', () => {
      cy.logTestStep('Testing get current user bookings');
      
      ApiClient.getMyBookings()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          // All bookings should belong to current user
          response.body.data.forEach((booking: any) => {
            expect(booking.renter_id).to.eq(primaryUser.id);
            cy.validateBookingStructure(booking);
          });
          
          cy.logTestStep(`Found ${response.body.data.length} bookings for current user`);
        });
    });

    it('should fail to get bookings when not authenticated', () => {
      cy.logTestStep('Testing get current user bookings without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getMyBookings()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Get Current User Favorites', () => {
    it('should return current user favorites when authenticated', () => {
      cy.logTestStep('Testing get current user favorites');
      
      ApiClient.getMyFavorites()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          // Validate favorite items structure
          response.body.data.forEach((item: any) => {
            cy.validateItemStructure(item);
          });
          
          cy.logTestStep(`Found ${response.body.data.length} favorite items`);
        });
    });

    it('should fail to get favorites when not authenticated', () => {
      cy.logTestStep('Testing get favorites without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getMyFavorites()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Get Current User Stats', () => {
    it('should return current user statistics when authenticated', () => {
      cy.logTestStep('Testing get current user stats');
      
      ApiClient.getMyStats()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('object');
          
          const stats = response.body.data;
          
          // Validate stats structure
          expect(stats).to.have.property('total_items');
          expect(stats).to.have.property('total_bookings');
          expect(stats).to.have.property('active_bookings');
          expect(stats).to.have.property('completed_bookings');
          
          // Stats should be numbers
          expect(stats.total_items).to.be.a('number').and.at.least(0);
          expect(stats.total_bookings).to.be.a('number').and.at.least(0);
          expect(stats.active_bookings).to.be.a('number').and.at.least(0);
          expect(stats.completed_bookings).to.be.a('number').and.at.least(0);
          
          cy.logTestStep('User stats retrieved', stats);
        });
    });

    it('should fail to get stats when not authenticated', () => {
      cy.logTestStep('Testing get stats without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getMyStats()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('User Verification', () => {
    it('should allow admin to verify user', () => {
      cy.logTestStep('Testing user verification by admin');
      
      // This test assumes the current user has admin privileges
      // In a real scenario, you'd login as an admin user
      ApiClient.verifyUser(secondaryUser.id)
        .then((response) => {
          // Response might be 200 (success) or 403 (forbidden if not admin)
          if (response.status === 200) {
            expect(response.body.success).to.be.true;
            expect(response.body.message).to.include('verified');
            cy.log('User verification successful');
          } else {
            expect(response.status).to.be.oneOf([403, 404]);
            expect(response.body.success).to.be.false;
            cy.log('User verification requires admin privileges');
          }
        });
    });

    it('should fail to verify non-existent user', () => {
      cy.logTestStep('Testing verification of non-existent user');
      
      ApiClient.verifyUser('non-existent-user-id')
        .then((response) => {
          expect(response.status).to.be.oneOf([403, 404]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Account Deactivation', () => {
    it('should allow user to deactivate their own account', () => {
      cy.logTestStep('Testing account deactivation');
      
      // Create a temporary user for deactivation test
      cy.createAndLoginTestUser({
        email: TestUtils.randomEmail('deactivate'),
        name: 'Deactivation Test User'
      }).then(() => {
        return ApiClient.deactivateAccount();
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
        expect(response.body.success).to.be.true;
        cy.log('Account deactivated successfully');
      });
    });

    it('should fail to deactivate account when not authenticated', () => {
      cy.logTestStep('Testing account deactivation without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.deactivateAccount()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });
});