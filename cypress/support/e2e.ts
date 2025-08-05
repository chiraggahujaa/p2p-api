// Main E2E support file for P2P API testing
/// <reference types="cypress" />

// Import commands
import './commands';

// Import all helper modules to ensure they're available
import { ApiClient } from './request/api';
import { AuthHelper } from './helpers/auth';
import { ItemHelper } from './helpers/items';
import { BookingHelper } from './helpers/bookings';
import { TestUtils } from './helpers/utils';

// Import data modules
import { testUsers } from '../data/users';
import { testItems } from '../data/items';
import { testBookings } from '../data/bookings';
import { mainCategories } from '../data/categories';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions that might come from the API
  // This is common in API testing where we're testing error conditions
  cy.log('Uncaught exception intercepted:', err.message);
  return false;
});

// Global before hook - runs once before all tests
before(() => {
  cy.log('🚀 Starting P2P API Test Suite');
  cy.log(`Environment: ${Cypress.env('NODE_ENV') || 'development'}`);
  cy.log(`API Base URL: ${Cypress.env('API_BASE_URL')}`);
  cy.log(`Test Run ID: ${Cypress.env('TEST_RUN_ID') || 'local'}`);
  
  // Verify API is accessible
  cy.request({
    method: 'GET',
    url: Cypress.env('API_BASE_URL').replace('/api', '/health'),
    timeout: 10000,
    retryOnNetworkFailure: true
  }).then((response) => {
    expect(response.status).to.eq(200);
    cy.log('✅ API health check passed');
  });
});

// Global after hook - runs once after all tests
after(() => {
  cy.log('🏁 P2P API Test Suite completed');
  
  // Generate final test report
  const testReport = {
    timestamp: new Date().toISOString(),
    environment: Cypress.env('NODE_ENV') || 'development',
    apiBaseUrl: Cypress.env('API_BASE_URL'),
    totalTests: Cypress.env('totalTests') || 'unknown',
    passedTests: Cypress.env('passedTests') || 'unknown',
    failedTests: Cypress.env('failedTests') || 'unknown'
  };
  
  cy.task('log', `Final Test Report: ${JSON.stringify(testReport, null, 2)}`);
});

// Enhanced error handling and logging
Cypress.on('fail', (err, runnable) => {
  cy.log('❌ Test failed:', runnable.title);
  cy.log('Error details:', err.message);
  
  // Log current auth state
  const currentToken = ApiClient.getAuthToken();
  cy.log('Auth state at failure:', currentToken ? 'Authenticated' : 'Not authenticated');
  
  // Take screenshot on failure (if not already done)
  cy.screenshot(`failure-${runnable.title.replace(/\s+/g, '-')}`);
  
  throw err;
});

// Network failure handling
Cypress.on('window:before:load', (win) => {
  // Handle network failures gracefully
  win.addEventListener('error', (e) => {
    if (e.message.includes('Network')) {
      cy.log('Network error detected, this might be expected for negative tests');
    }
  });
});

// Custom assertions for API testing
chai.use((chai, utils) => {
  // Custom assertions removed - using standard Cypress assertions instead
  
  // Custom assertion for pagination structure
  chai.Assertion.addMethod('paginatedResponse', function() {
    const obj = this._obj;
    
    new chai.Assertion(obj).to.have.property('body');
    new chai.Assertion(obj.body).to.have.property('data').that.is.an('array');
    new chai.Assertion(obj.body).to.have.property('pagination');
    
    const pagination = obj.body.pagination;
    new chai.Assertion(pagination).to.have.property('page').that.is.a('number');
    new chai.Assertion(pagination).to.have.property('limit').that.is.a('number');
    new chai.Assertion(pagination).to.have.property('total').that.is.a('number');
    new chai.Assertion(pagination).to.have.property('totalPages').that.is.a('number');
  });
  
  // Custom assertion for date format
  chai.Assertion.addMethod('validDate', function() {
    const obj = this._obj;
    const date = new Date(obj);
    
    new chai.Assertion(date.toString()).to.not.equal('Invalid Date');
    new chai.Assertion(obj).to.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?$/);
  });
  
  // Custom assertion for email format
  chai.Assertion.addMethod('validEmail', function() {
    const obj = this._obj;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    new chai.Assertion(emailRegex.test(obj)).to.be.true;
  });
  
  // Custom assertion for price format
  chai.Assertion.addMethod('validPrice', function() {
    const obj = this._obj;
    
    new chai.Assertion(obj).to.be.a('number');
    new chai.Assertion(obj).to.be.above(0);
    new chai.Assertion(obj).to.satisfy((price: number) => {
      // Check if price has at most 2 decimal places
      return Number.isInteger(price * 100);
    });
  });
});

// Global test data setup
Cypress.env('testUsers', testUsers);
Cypress.env('testItems', testItems);
Cypress.env('testBookings', testBookings);
Cypress.env('mainCategories', mainCategories);

// Performance monitoring
let testStartTime: number;

beforeEach(() => {
  testStartTime = Date.now();
  
  // Set unique test identifier
  const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  Cypress.env('currentTestId', testId);
  
  cy.log(`🧪 Starting test: ${Cypress.currentTest.title}`);
  cy.log(`Test ID: ${testId}`);
});

afterEach(() => {
  const testDuration = Date.now() - testStartTime;
  const testTitle = Cypress.currentTest.title;
  const testState = 'completed';
  
  cy.log(`⏱️ Test "${testTitle}" ${testState} in ${testDuration}ms`);
  
  // Log performance warning for slow tests
  if (testDuration > 10000) {
    cy.log(`⚠️ Slow test detected: ${testDuration}ms (>10s)`);
  }
  
  // Clear auth token after each test to ensure clean state
  AuthHelper.clearAuth();
});

// Utility functions available globally
Cypress.env('utils', {
  randomString: TestUtils.randomString,
  randomEmail: TestUtils.randomEmail,
  randomPhoneNumber: TestUtils.randomPhoneNumber,
  randomPrice: TestUtils.randomPrice,
  formatDate: TestUtils.formatDate,
  getRelativeDate: TestUtils.getRelativeDate
});

// Test data cleanup helper
Cypress.env('cleanup', {
  users: [] as string[],
  items: [] as string[],
  bookings: [] as string[]
});

// Global error handler for API requests
const originalRequest = cy.request;
cy.request = function(options: any) {
  const startTime = Date.now();
  
  return originalRequest.call(this, options).then((response) => {
    const duration = Date.now() - startTime;
    
    // Log slow API calls
    if (duration > 5000) {
      cy.log(`🐌 Slow API call: ${options.method || 'GET'} ${options.url} took ${duration}ms`);
    }
    
    return response;
  });
};

// Test data validation helpers
const validators = {
  user: (user: any) => {
    expect(user).to.have.property('id');
    expect(user).to.have.property('email').that.matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(user).to.have.property('name').that.is.a('string').and.not.empty;
    expect(user).to.have.property('created_at').that.matches(/^\d{4}-\d{2}-\d{2}/);
  },
  
  item: (item: any) => {
    expect(item).to.have.property('id');
    expect(item).to.have.property('name').that.is.a('string').and.not.empty;
    expect(item).to.have.property('price_per_day').that.is.a('number').and.above(0);
    expect(item).to.have.property('created_at').that.matches(/^\d{4}-\d{2}-\d{2}/);
  },
  
  booking: (booking: any) => {
    expect(booking).to.have.property('id');
    expect(booking).to.have.property('start_date').that.matches(/^\d{4}-\d{2}-\d{2}/);
    expect(booking).to.have.property('end_date').that.matches(/^\d{4}-\d{2}-\d{2}/);
    expect(booking).to.have.property('total_amount').that.is.a('number').and.above(0);
    expect(booking).to.have.property('created_at').that.matches(/^\d{4}-\d{2}-\d{2}/);
  }
};

Cypress.env('validators', validators);

// Make helpers available globally for easy access in tests
(globalThis as any).ApiClient = ApiClient;
(globalThis as any).AuthHelper = AuthHelper;
(globalThis as any).ItemHelper = ItemHelper;
(globalThis as any).BookingHelper = BookingHelper;
(globalThis as any).TestUtils = TestUtils;

// Configuration validation
if (!Cypress.env('API_BASE_URL')) {
  throw new Error('API_BASE_URL environment variable is required');
}

export {};