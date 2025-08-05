// Authentication helper functions
/// <reference types="cypress" />

import { ApiClient } from '../request/api';
import { testUsers, TestUser, UserDataManager } from '../../data/users';

export interface AuthSession {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
}

export class AuthHelper {
  /**
   * Create a new test user and return user data
   */
  static createTestUser(userData?: Partial<TestUser>): Cypress.Chainable<any> {
    const registrationData = UserDataManager.generateRegistrationPayload(userData);
    
    return ApiClient.register(registrationData)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        return { ...registrationData, id: response.body.data?.id };
      });
  }

  /**
   * Login with test user and maintain session
   */
  static loginWithTestUser(userKey: keyof typeof testUsers = 'primary'): Cypress.Chainable<AuthSession> {
    const user = testUsers[userKey];
    
    return ApiClient.login(user.email, user.password)
      .then((session) => {
        cy.log(`Logged in as: ${user.email}`);
        return session;
      });
  }

  /**
   * Login with custom credentials
   */
  static loginWithCredentials(email: string, password: string): Cypress.Chainable<AuthSession> {
    return ApiClient.login(email, password);
  }

  /**
   * Create and login with a new test user
   */
  static createAndLoginTestUser(userData?: Partial<TestUser>): Cypress.Chainable<AuthSession> {
    return this.createTestUser(userData)
      .then((user) => {
        return ApiClient.login(user.email, user.password);
      });
  }

  /**
   * Logout current user
   */
  static logout(): Cypress.Chainable<any> {
    return ApiClient.logout()
      .then(() => {
        cy.log('User logged out successfully');
      });
  }

  /**
   * Verify authentication token is valid
   */
  static verifyToken(): Cypress.Chainable<any> {
    return ApiClient.getProfile()
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('id');
        return response.body.data;
      });
  }

  /**
   * Test invalid login scenarios
   */
  static testInvalidLogin(email: string, password: string, expectedStatus: number = 401): Cypress.Chainable<any> {
    return ApiClient.post('/auth/login', { email, password })
      .then((response) => {
        expect(response.status).to.eq(expectedStatus);
        expect(response.body.success).to.be.false;
        return response;
      });
  }

  /**
   * Test password reset flow
   */
  static requestPasswordReset(email: string): Cypress.Chainable<any> {
    return ApiClient.resetPassword(email)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        return response;
      });
  }

  /**
   * Change user password
   */
  static changePassword(currentPassword: string, newPassword: string): Cypress.Chainable<any> {
    return ApiClient.updatePassword(currentPassword, newPassword)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        return response;
      });
  }

  /**
   * Refresh authentication token
   */
  static refreshAuthToken(refreshToken: string): Cypress.Chainable<any> {
    return ApiClient.refreshToken(refreshToken)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('accessToken');
        return response.body.data;
      });
  }

  /**
   * Setup multiple test users for interaction testing
   */
  static setupMultipleUsers(count: number = 2): Cypress.Chainable<TestUser[]> {
    const userPromises: Cypress.Chainable<TestUser>[] = [];
    
    for (let i = 0; i < count; i++) {
      userPromises.push(this.createTestUser({
        email: UserDataManager.generateUniqueEmail(`testuser${i}`),
        name: `Test User ${i + 1}`
      }));
    }
    
    return cy.wrap(Promise.all(userPromises));
  }

  /**
   * Test session persistence
   */
  static testSessionPersistence(): Cypress.Chainable<void> {
    return this.verifyToken()
      .then((userData) => {
        cy.log('Session is persistent', userData.email);
      });
  }

  /**
   * Test authentication with expired token
   */
  static testExpiredToken(): Cypress.Chainable<any> {
    // Simulate expired token by setting an invalid one
    ApiClient.setAuthToken('expired.token.here');
    
    return ApiClient.getProfile()
      .then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.success).to.be.false;
      });
  }

  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    ApiClient.clearAuthToken();
    cy.log('Authentication data cleared');
  }

  /**
   * Assert user is authenticated
   */
  static assertAuthenticated(): Cypress.Chainable<any> {
    return this.verifyToken()
      .then((user) => {
        expect(user).to.not.be.null;
        expect(user).to.have.property('id');
        expect(user).to.have.property('email');
        return user;
      });
  }

  /**
   * Assert user is not authenticated
   */
  static assertNotAuthenticated(): Cypress.Chainable<any> {
    return ApiClient.getProfile()
      .then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
        expect(response.body.success).to.be.false;
      });
  }

  /**
   * Login as admin user (if admin endpoints are available)
   */
  static loginAsAdmin(): Cypress.Chainable<AuthSession> {
    return this.loginWithTestUser('admin');
  }

  /**
   * Test user registration validation
   */
  static testRegistrationValidation(invalidData: any): Cypress.Chainable<any> {
    return ApiClient.register(invalidData)
      .then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
        expect(response.body.success).to.be.false;
        expect(response.body).to.have.property('error');
        return response;
      });
  }

  /**
   * Clean up test user (if delete endpoint is available)
   */
  static cleanupTestUser(): Cypress.Chainable<undefined> {
    return cy.then(() => {
      ApiClient.deactivateAccount()
        .then((response) => {
          if (response.status === 200 || response.status === 204) {
            cy.log('Test user cleaned up');
          } else {
            cy.log('User cleanup not available or failed');
          }
        });
    });
  }

  /**
   * Set up user session in localStorage/sessionStorage (if frontend integration needed)
   */
  static setUserSession(session: AuthSession): void {
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify(session));
      win.localStorage.setItem('accessToken', session.tokens.accessToken);
      if (session.tokens.refreshToken) {
        win.localStorage.setItem('refreshToken', session.tokens.refreshToken);
      }
    });
  }

  /**
   * Clear user session from storage
   */
  static clearUserSession(): void {
    cy.window().then((win) => {
      win.localStorage.removeItem('userSession');
      win.localStorage.removeItem('accessToken');
      win.localStorage.removeItem('refreshToken');
      win.sessionStorage.clear();
    });
  }
}