// Custom Cypress commands for P2P API testing
/// <reference types="cypress" />

import { ApiClient } from './request/api';
import { AuthHelper } from './helpers/auth';
import { ItemHelper } from './helpers/items';
import { BookingHelper } from './helpers/bookings';
import { TestUtils } from './helpers/utils';
import { testUsers } from '../data/users';

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      // Authentication commands
      loginAsUser(userKey?: keyof typeof testUsers): Chainable<any>;
      createAndLoginTestUser(userData?: any): Chainable<any>;
      logoutUser(): Chainable<any>;
      verifyAuthenticated(): Chainable<any>;
      verifyNotAuthenticated(): Chainable<any>;
      
      // Item commands
      createTestItem(itemData?: any): Chainable<any>;
      createMultipleTestItems(count?: number): Chainable<any[]>;
      deleteTestItem(itemId: string): Chainable<any>;
      
      // Booking commands
      createTestBooking(itemId: string, bookingData?: any): Chainable<any>;
      completeBookingWorkflow(itemId: string): Chainable<any>;
      
      // Utility commands
      waitForAPI(ms?: number): Chainable<undefined>;
      logTestStep(stepName: string, details?: any): void;
      // assertApiResponse removed - using standard assertions
      cleanupTestData(): void;
      
      // Validation commands
      validateUserStructure(user: any): void;
      validateItemStructure(item: any): void;
      validateBookingStructure(booking: any): void;
      
      // Custom API commands
      apiGet(url: string, options?: any): Chainable<any>;
      apiPost(url: string, body?: any, options?: any): Chainable<any>;
      apiPut(url: string, body?: any, options?: any): Chainable<any>;
      apiDelete(url: string, options?: any): Chainable<any>;
      
      // Additional custom commands
      checkApiHealth(): Chainable<any>;
      setupTestEnvironment(): void;
      generateTestReport(testName: string, results: any): Chainable<any>;
    }
  }
}

// Authentication Commands
Cypress.Commands.add('loginAsUser', (userKey: keyof typeof testUsers = 'primary') => {
  return AuthHelper.loginWithTestUser(userKey);
});

Cypress.Commands.add('createAndLoginTestUser', (userData?: any) => {
  return AuthHelper.createAndLoginTestUser(userData);
});

Cypress.Commands.add('logoutUser', () => {
  return AuthHelper.logout();
});

Cypress.Commands.add('verifyAuthenticated', () => {
  return AuthHelper.assertAuthenticated();
});

Cypress.Commands.add('verifyNotAuthenticated', () => {
  return AuthHelper.assertNotAuthenticated();
});

// Item Commands
Cypress.Commands.add('createTestItem', (itemData?: any) => {
  return ItemHelper.createTestItem(itemData);
});

Cypress.Commands.add('createMultipleTestItems', (count: number = 3) => {
  return ItemHelper.createMultipleTestItems(count);
});

Cypress.Commands.add('deleteTestItem', (itemId: string) => {
  return ItemHelper.deleteItem(itemId);
});

// Booking Commands
Cypress.Commands.add('createTestBooking', (itemId: string, bookingData?: any) => {
  return BookingHelper.createTestBooking(itemId, bookingData);
});

Cypress.Commands.add('completeBookingWorkflow', (itemId: string) => {
  return BookingHelper.testCompleteBookingWorkflow(itemId);
});

// Utility Commands
Cypress.Commands.add('waitForAPI', (ms: number = 1000) => {
  return cy.wait(ms);
});

Cypress.Commands.add('logTestStep', (stepName: string, details?: any) => {
  TestUtils.logStep(stepName, details);
});

// assertApiResponse command removed - using standard assertions directly in tests

Cypress.Commands.add('cleanupTestData', () => {
  cy.log('Starting test data cleanup...');
  
  // Clear authentication
  AuthHelper.clearAuth();
  
  // Additional cleanup logic would go here
  // For now, just clear auth as other entities might be needed for other tests
  
  cy.log('Test data cleanup completed');
});

// Validation Commands
Cypress.Commands.add('validateUserStructure', (user: any) => {
  const requiredFields = ['id', 'email', 'name', 'created_at'];
  const optionalFields = ['phone', 'location', 'bio', 'profile_image', 'updated_at', 'email_verified'];
  
  // Check required fields
  requiredFields.forEach(field => {
    expect(user, `User should have ${field}`).to.have.property(field);
  });
  
  // Validate email format
  expect(TestUtils.isValidEmail(user.email), 'Email should be valid').to.be.true;
  
  // Validate optional phone if present
  if (user.phone) {
    expect(TestUtils.isValidPhoneNumber(user.phone), 'Phone should be valid if provided').to.be.true;
  }
});

Cypress.Commands.add('validateItemStructure', (item: any) => {
  const requiredFields = ['id', 'name', 'description', 'category', 'price_per_day', 'location', 'condition', 'owner_id', 'created_at'];
  
  // Check required fields
  requiredFields.forEach(field => {
    expect(item, `Item should have ${field}`).to.have.property(field);
  });
  
  // Validate pricing
  expect(item.price_per_day, 'Daily price should be positive').to.be.above(0);
  
  // Validate condition
  const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
  expect(validConditions, 'Condition should be valid').to.include(item.condition);
});

Cypress.Commands.add('validateBookingStructure', (booking: any) => {
  const requiredFields = ['id', 'item_id', 'renter_id', 'start_date', 'end_date', 'total_days', 'total_amount', 'status', 'created_at'];
  
  // Check required fields
  requiredFields.forEach(field => {
    expect(booking, `Booking should have ${field}`).to.have.property(field);
  });
  
  // Validate dates
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  expect(endDate.getTime(), 'End date should be after start date').to.be.at.least(startDate.getTime());
  
  // Validate amounts
  expect(booking.total_amount, 'Total amount should be positive').to.be.above(0);
  expect(booking.total_days, 'Total days should be positive').to.be.above(0);
  
  // Validate status
  const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'];
  expect(validStatuses, 'Status should be valid').to.include(booking.status);
});

// Custom API Commands (wrappers around ApiClient for easier use in tests)
Cypress.Commands.add('apiGet', (url: string, options: any = {}) => {
  return ApiClient.get(url, options);
});

Cypress.Commands.add('apiPost', (url: string, body?: any, options: any = {}) => {
  return ApiClient.post(url, body, options);
});

Cypress.Commands.add('apiPut', (url: string, body?: any, options: any = {}) => {
  return ApiClient.put(url, body, options);
});

Cypress.Commands.add('apiDelete', (url: string, options: any = {}) => {
  return ApiClient.delete(url, options);
});

// Use apiGet, apiPost, etc. commands for API testing

// Command to check API health before tests
Cypress.Commands.add('checkApiHealth', () => {
  return ApiClient.healthCheck()
    .then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status', 'OK');
      cy.log('API health check passed');
    });
});

// Command to setup test environment
Cypress.Commands.add('setupTestEnvironment', () => {
  cy.log('Setting up test environment...');
  
  // Check API health
  ApiClient.healthCheck().then((response) => {
    expect(response.status).to.eq(200);
  });
  
  // Clear any existing auth
  AuthHelper.clearAuth();
  
  // Log environment info
  cy.log(`Test Environment: ${TestUtils.getTestEnvironment()}`);
  cy.log(`API Base URL: ${Cypress.env('API_BASE_URL')}`);
});

// Command to generate test report data
Cypress.Commands.add('generateTestReport', (testName: string, results: any) => {
  const report = {
    testName,
    timestamp: new Date().toISOString(),
    environment: TestUtils.getTestEnvironment(),
    apiBaseUrl: Cypress.env('API_BASE_URL'),
    results,
    userAgent: navigator.userAgent
  };
  
  cy.log('Test Report Generated:', report);
  
  // Could save to file or send to reporting service
  cy.task('log', `Test Report: ${JSON.stringify(report, null, 2)}`);
  
  return cy.wrap(report);
});





export {};