// Main E2E support file for P2P API testing
/// <reference types="cypress" />
/// <reference path="./index.d.ts" />

// Import commands
import './commands';

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
  return cy.request({
    method: 'GET',
    url: Cypress.env('API_BASE_URL').replace('/api', '/health'),
    timeout: 10000,
    retryOnNetworkFailure: true,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('✅ API health check passed');
    } else {
      cy.log('⚠️ API health check failed, tests may fail');
    }
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
  cy.clearAuthToken();
});

// Test data cleanup helper
Cypress.env('cleanup', {
  users: [] as string[],
  items: [] as string[],
  bookings: [] as string[]
});

// Configuration validation
if (!Cypress.env('API_BASE_URL')) {
  throw new Error('API_BASE_URL environment variable is required');
}

export {};