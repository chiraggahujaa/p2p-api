/// <reference types="cypress" />

// Import all command interfaces
import type { ApiRequestOptions, ApiResponse } from './commands/api-commands';
import type { AuthCredentials, AuthResponse, UserProfile } from './commands/auth-commands';

declare global {
  namespace Cypress {
    interface Chainable {
      // API Commands
      apiRequest(options: ApiRequestOptions): Chainable<ApiResponse>;
      apiRequestWithRetry(options: ApiRequestOptions, maxRetries?: number): Chainable<ApiResponse>;
      validateApiResponse(response: ApiResponse, expectedSchema?: any): Chainable<ApiResponse>;
      validateStatusCode(response: ApiResponse, expectedStatus: number): Chainable<ApiResponse>;
      validateResponseTime(response: ApiResponse, maxTime: number): Chainable<ApiResponse>;
      validatePaginatedResponse(response: ApiResponse): Chainable<ApiResponse>;
      validateErrorResponse(response: ApiResponse, expectedErrorType?: string): Chainable<ApiResponse>;

      // Auth Commands
      login(credentials: AuthCredentials): Chainable<AuthResponse>;
      loginAsTestUser(userType?: 'borrower' | 'lender' | 'admin'): Chainable<AuthResponse>;
      register(userData: any): Chainable<AuthResponse>;
      logout(): Chainable<void>;
      getAuthToken(): Chainable<string | null>;
      setAuthToken(token: string): Chainable<void>;
      clearAuthToken(): Chainable<void>;
      verifyAuthenticated(): Chainable<UserProfile>;
      verifyNotAuthenticated(): Chainable<void>;
      switchUserRole(role: 'borrower' | 'lender' | 'admin'): Chainable<AuthResponse>;
      refreshAuthToken(): Chainable<AuthResponse>;
      validateAuthToken(token: string): Chainable<boolean>;

      // Database Commands
      seedDatabase(options?: any): Chainable<void>;
      cleanDatabase(options?: any): Chainable<void>;
      seedTestUsers(): Chainable<void>;
      seedTestCategories(): Chainable<void>;
      seedTestItems(): Chainable<void>;
      seedTestBookings(): Chainable<void>;
      seedTestLocations(): Chainable<void>;
      createTestUser(userData?: any): Chainable<any>;
      createTestItem(itemData?: any, userId?: string): Chainable<any>;
      createTestBooking(bookingData?: any): Chainable<any>;
      deleteTestData(entityType: string, entityId: string): Chainable<void>;
      resetDatabase(): Chainable<void>;
      verifyDatabaseState(): Chainable<boolean>;

      // Validation Commands
      validateSchema(data: any, schema: any): Chainable<void>;
      validateUserSchema(user: any): Chainable<void>;
      validateItemSchema(item: any): Chainable<void>;
      validateBookingSchema(booking: any): Chainable<void>;
      validateCategorySchema(category: any): Chainable<void>;
      validateLocationSchema(location: any): Chainable<void>;
      validateFileSchema(file: any): Chainable<void>;
      validateDateFormat(date: string): Chainable<void>;
      validateEmailFormat(email: string): Chainable<void>;
      validatePhoneFormat(phone: string): Chainable<void>;
      validateUuidFormat(uuid: string): Chainable<void>;
      validatePriceFormat(price: number): Chainable<void>;
      validateArrayResponse(data: any[], itemValidator: (item: any) => void): Chainable<void>;
      validateRequiredFields(data: any, requiredFields: string[]): Chainable<void>;

      // Performance Commands
      measureResponseTime(requestCallback: () => Cypress.Chainable<any>): Chainable<{ response: any; responseTime: number }>;
      validateResponseTime(maxTime: number, actualTime: number): Chainable<void>;
      performanceTest(testName: string, requestCallback: () => Cypress.Chainable<any>, maxTime: number): Chainable<{ response: any; responseTime: number; passed: boolean }>;
      loadTest(config: any): Chainable<any>;
      stressTest(endpoint: string, duration: number): Chainable<any>;
      concurrencyTest(endpoint: string, concurrentRequests: number, options?: { method?: string; body?: any; headers?: { [key: string]: string } }): Chainable<any>;
      benchmarkEndpoint(endpoint: string, samples?: number): Chainable<any>;
      monitorMemoryUsage(): Chainable<any>;
      validatePerformanceBaseline(metrics: any, baseline: number): Chainable<any>;
    }
  }
}

export {};