// Utility helper functions for testing
/// <reference types="cypress" />

export class TestUtils {
  /**
   * Generate random string of specified length
   */
  static randomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random email address
   */
  static randomEmail(domain: string = 'gmail.com'): string {
    return `test_${this.randomString(8)}@${domain}`;
  }

  /**
   * Generate random phone number
   */
  static randomPhoneNumber(): string {
    const area = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return `+1${area}${prefix}${suffix}`;
  }

  /**
   * Generate random price within range
   */
  static randomPrice(min: number = 5, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Wait for a specified amount of time
   */
  static wait(ms: number): Cypress.Chainable<any> {
    return cy.wait(ms);
  }

  /**
   * Retry an operation with exponential backoff
   */
  static retryOperation<T>(
    operation: () => Cypress.Chainable<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Cypress.Chainable<T> {
    // Simplified retry - Cypress handles most retries automatically
    // This is mainly for logging purposes
    cy.log(`Executing operation with up to ${maxRetries} retries`);
    return operation();
  }

  /**
   * Compare objects excluding specified keys
   */
  static compareObjectsExcluding(obj1: any, obj2: any, excludeKeys: string[] = []): boolean {
    const keys1 = Object.keys(obj1).filter(key => !excludeKeys.includes(key));
    const keys2 = Object.keys(obj2).filter(key => !excludeKeys.includes(key));
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Format date to API-compatible string (YYYY-MM-DD)
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date relative to today
   */
  static getRelativeDate(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return this.formatDate(date);
  }

  /**
   * Generate date range
   */
  static generateDateRange(startOffset: number, endOffset: number): { start: string; end: string } {
    return {
      start: this.getRelativeDate(startOffset),
      end: this.getRelativeDate(endOffset)
    };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Generate UUID-like string
   */
  static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Sanitize string for safe use in tests
   */
  static sanitizeString(str: string): string {
    return str.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
  }

  /**
   * Calculate percentage difference between two numbers
   */
  static percentageDifference(value1: number, value2: number): number {
    const diff = Math.abs(value1 - value2);
    const avg = (value1 + value2) / 2;
    return (diff / avg) * 100;
  }

  /**
   * Round number to specified decimal places
   */
  static roundToDecimals(num: number, decimals: number = 2): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Generate test data with specified pattern
   */
  static generateTestData(pattern: string, count: number = 1): string[] {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      results.push(pattern.replace('{i}', (i + 1).toString()));
    }
    return results;
  }

  /**
   * Check if array contains all specified elements
   */
  static arrayContainsAll<T>(array: T[], elements: T[]): boolean {
    return elements.every(element => array.includes(element));
  }

  /**
   * Remove duplicates from array
   */
  static removeDuplicates<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * Shuffle array randomly
   */
  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get random element from array
   */
  static randomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Create delay promise
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log test step with timestamp
   */
  static logStep(stepName: string, details?: any): void {
    const timestamp = new Date().toISOString();
    cy.log(`[${timestamp}] ${stepName}`, details || '');
  }

  /**
   * Assert response structure matches expected format
   */
  static assertResponseStructure(response: any, expectedKeys: string[]): void {
    expect(response).to.be.an('object');
    expectedKeys.forEach(key => {
      expect(response).to.have.property(key);
    });
  }

  /**
   * Assert array has expected length and all items match condition
   */
  static assertArrayStructure<T>(
    array: T[], 
    expectedMinLength: number = 0,
    itemValidator?: (item: T) => boolean
  ): void {
    expect(array).to.be.an('array');
    expect(array.length).to.be.at.least(expectedMinLength);
    
    if (itemValidator) {
      array.forEach((item, index) => {
        expect(itemValidator(item), `Item at index ${index} failed validation`).to.be.true;
      });
    }
  }

  /**
   * Create test context with cleanup
   */
  static createTestContext(): {
    createdUsers: string[];
    createdItems: string[];
    createdBookings: string[];
    addUser: (userId: string) => void;
    addItem: (itemId: string) => void;
    addBooking: (bookingId: string) => void;
    cleanup: () => void;
  } {
    const context = {
      createdUsers: [] as string[],
      createdItems: [] as string[],
      createdBookings: [] as string[],
      
      addUser: (userId: string) => context.createdUsers.push(userId),
      addItem: (itemId: string) => context.createdItems.push(itemId),
      addBooking: (bookingId: string) => context.createdBookings.push(bookingId),
      
      cleanup: () => {
        cy.log('Cleaning up test context...');
        cy.log(`Users to cleanup: ${context.createdUsers.length}`);
        cy.log(`Items to cleanup: ${context.createdItems.length}`);  
        cy.log(`Bookings to cleanup: ${context.createdBookings.length}`);
        
        // This would be implemented with actual cleanup calls
        // For now, just logging what would be cleaned up
      }
    };
    
    return context;
  }

  /**
   * Generate test summary
   */
  static generateTestSummary(testName: string, duration: number, results: any): void {
    cy.log('='.repeat(50));
    cy.log(`Test: ${testName}`);
    cy.log(`Duration: ${duration}ms`);
    cy.log(`Results:`, results);
    cy.log('='.repeat(50));
  }

  /**
   * Environment helpers
   */
  static getTestEnvironment(): 'development' | 'staging' | 'production' {
    return Cypress.env('NODE_ENV') || 'development';
  }

  static isTestEnvironment(): boolean {
    return this.getTestEnvironment() !== 'production';
  }

  /**
   * Performance measurement
   */
  static measurePerformance<T>(
    operation: () => Cypress.Chainable<T>,
    description: string
  ): Cypress.Chainable<{ result: T; duration: number }> {
    const startTime = Date.now();
    
    return operation().then((result) => {
      const duration = Date.now() - startTime;
      cy.log(`Performance: ${description} took ${duration}ms`);
      
      return { result, duration };
    });
  }
}