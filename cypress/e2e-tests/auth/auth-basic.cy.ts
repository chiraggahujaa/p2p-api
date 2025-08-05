// Basic Authentication API Tests
/// <reference types="cypress" />

import { ApiClient } from '../../support/request/api';
import { AuthHelper } from '../../support/helpers/auth';
import { testUsers, invalidUsers, UserDataManager } from '../../data/users';

describe('Authentication API - Basic Operations', () => {
  beforeEach(() => {
    // Clear any existing authentication
    AuthHelper.clearAuth();
  });

  afterEach(() => {
    // Clean up after each test
    AuthHelper.clearAuth();
  });

  describe('User Registration', () => {
    it('should successfully register a new user with valid data', () => {
      const userData = UserDataManager.generateRegistrationPayload();
      
      cy.logTestStep('Testing user registration with valid data');
      
      ApiClient.register(userData)
        .then((response) => {
          expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
          expect(response.body.data).to.have.property('id');
          expect(response.body.data).to.have.property('email', userData.email);
          expect(response.body.data).to.have.property('name', userData.name);
          expect(response.body.message).to.include('registered');
          
          cy.validateUserStructure(response.body.data);
          cy.logTestStep('User registration successful', response.body.data);
        });
    });

    it('should register user with minimal required data', () => {
      const minimalData = {
        email: UserDataManager.generateUniqueEmail('minimal'),
        password: 'TestPassword123!',
        name: 'Minimal User'
      };
      
      cy.logTestStep('Testing user registration with minimal data');
      
      ApiClient.register(minimalData)
        .then((response) => {
          expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
          expect(response.body.data.email).to.eq(minimalData.email);
          expect(response.body.data.name).to.eq(minimalData.name);
          
          // Optional fields should be null or undefined
          expect(response.body.data.phone).to.be.oneOf([null, undefined]);
          expect(response.body.data.location).to.be.oneOf([null, undefined]);
        });
    });

    it('should fail to register user with invalid email format', () => {
      cy.logTestStep('Testing registration with invalid email');
      
      AuthHelper.testRegistrationValidation(invalidUsers.invalidEmail)
        .then((response) => {
          expect(response.body.error).to.include('email');
        });
    });

    it('should fail to register user with weak password', () => {
      cy.logTestStep('Testing registration with weak password');
      
      AuthHelper.testRegistrationValidation(invalidUsers.weakPassword)
        .then((response) => {
          expect(response.body.error).to.include('password');
        });
    });

    it('should fail to register user with empty name', () => {
      cy.logTestStep('Testing registration with empty name');
      
      AuthHelper.testRegistrationValidation(invalidUsers.emptyName)
        .then((response) => {
          expect(response.body.error).to.include('name');
        });
    });

    it('should fail to register user with duplicate email', () => {
      const userData = UserDataManager.generateRegistrationPayload();
      
      cy.logTestStep('Testing duplicate email registration');
      
      // First registration should succeed
      ApiClient.register(userData)
        .then((response) => {
          expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
          
          // Second registration with same email should fail
          return AuthHelper.testRegistrationValidation(userData);
        })
        .then((response) => {
          expect(response.body.error).to.include('already exists');
        });
    });
  });

  describe('User Login', () => {
    let testUser: any;

    beforeEach(() => {
      // Create a test user for login tests
      cy.createAndLoginTestUser()
        .then((session) => {
          testUser = session.user;
          // Logout so we can test login
          return AuthHelper.logout();
        });
    });

    it('should successfully login with valid credentials', () => {
      cy.logTestStep('Testing login with valid credentials');
      
      ApiClient.login(testUser.email, 'TestPassword123!')
        .then((session) => {
          expect(session).to.have.property('user');
          expect(session).to.have.property('tokens');
          expect(session.tokens).to.have.property('accessToken');
          expect(session.user.id).to.eq(testUser.id);
          expect(session.user.email).to.eq(testUser.email);
          
          cy.logTestStep('Login successful', { userId: session.user.id });
        });
    });

    it('should fail login with invalid email', () => {
      cy.logTestStep('Testing login with invalid email');
      
      AuthHelper.testInvalidLogin('nonexistent@example.com', 'TestPassword123!')
        .then((response) => {
          expect(response.body.error).to.include('Invalid');
        });
    });

    it('should fail login with incorrect password', () => {
      cy.logTestStep('Testing login with incorrect password');
      
      AuthHelper.testInvalidLogin(testUser.email, 'WrongPassword123!')
        .then((response) => {
          expect(response.body.error).to.include('Invalid');
        });
    });

    it('should fail login with empty credentials', () => {
      cy.logTestStep('Testing login with empty credentials');
      
      AuthHelper.testInvalidLogin('', '')
        .then((response) => {
          expect(response.body.error).to.include('required');
        });
    });

    it('should return refresh token on successful login', () => {
      cy.logTestStep('Testing refresh token in login response');
      
      ApiClient.login(testUser.email, 'TestPassword123!')
        .then((session) => {
          expect(session.tokens).to.have.property('refreshToken');
          expect(session.tokens.refreshToken).to.be.a('string').and.not.empty;
        });
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      // Login before each logout test
      cy.createAndLoginTestUser();
    });

    it('should successfully logout authenticated user', () => {
      cy.logTestStep('Testing user logout');
      
      // Verify user is authenticated first
      cy.verifyAuthenticated()
        .then(() => {
          return AuthHelper.logout();
        })
        .then(() => {
          // Verify user is no longer authenticated
          cy.verifyNotAuthenticated();
          cy.logTestStep('Logout successful');
        });
    });

    it('should fail logout for unauthenticated user', () => {
      cy.logTestStep('Testing logout without authentication');
      
      // Clear auth first
      AuthHelper.clearAuth();
      
      ApiClient.logout()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Get User Profile', () => {
    let userSession: any;

    beforeEach(() => {
      cy.createAndLoginTestUser()
        .then((session) => {
          userSession = session;
        });
    });

    it('should return user profile for authenticated user', () => {
      cy.logTestStep('Testing get user profile');
      
      ApiClient.getProfile()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.id).to.eq(userSession.user.id);
          expect(response.body.data.email).to.eq(userSession.user.email);
          
          cy.validateUserStructure(response.body.data);
          cy.logTestStep('Profile retrieved successfully');
        });
    });

    it('should fail to return profile for unauthenticated user', () => {
      cy.logTestStep('Testing get profile without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getProfile()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail with invalid authentication token', () => {
      cy.logTestStep('Testing get profile with invalid token');
      
      AuthHelper.testExpiredToken();
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;

    beforeEach(() => {
      cy.createAndLoginTestUser()
        .then((session) => {
          refreshToken = session.tokens.refreshToken;
        });
    });

    it('should successfully refresh access token with valid refresh token', () => {
      cy.logTestStep('Testing token refresh');
      
      AuthHelper.refreshAuthToken(refreshToken)
        .then((tokenData) => {
          expect(tokenData).to.have.property('accessToken');
          expect(tokenData.accessToken).to.be.a('string').and.not.empty;
          expect(tokenData.accessToken).to.not.eq(refreshToken);
          
          cy.logTestStep('Token refresh successful');
        });
    });

    it('should fail to refresh token with invalid refresh token', () => {
      cy.logTestStep('Testing token refresh with invalid token');
      
      ApiClient.refreshToken('invalid.refresh.token')
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('invalid');
        });
    });

    it('should fail to refresh token with empty refresh token', () => {
      cy.logTestStep('Testing token refresh with empty token');
      
      ApiClient.refreshToken('')
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 401]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Password Reset', () => {
    let testUser: any;

    beforeEach(() => {
      cy.createAndLoginTestUser()
        .then((session) => {
          testUser = session.user;
          return AuthHelper.logout();
        });
    });

    it('should successfully request password reset for existing user', () => {
      cy.logTestStep('Testing password reset request');
      
      AuthHelper.requestPasswordReset(testUser.email)
        .then((response) => {
          expect(response.body.message).to.include('reset');
          cy.logTestStep('Password reset requested successfully');
        });
    });

    it('should handle password reset request for non-existent user gracefully', () => {
      cy.logTestStep('Testing password reset for non-existent user');
      
      ApiClient.resetPassword('nonexistent@example.com')
        .then((response) => {
          // Should not reveal whether user exists or not for security
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.message).to.include('sent');
        });
    });

    it('should fail password reset request with invalid email format', () => {
      cy.logTestStep('Testing password reset with invalid email');
      
      ApiClient.resetPassword('invalid-email')
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 422]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('email');
        });
    });
  });

  describe('Password Update', () => {
    const newPassword = 'NewTestPassword123!';

    beforeEach(() => {
      cy.createAndLoginTestUser();
    });

    it('should successfully update password with valid current password', () => {
      cy.logTestStep('Testing password update');
      
      AuthHelper.changePassword('TestPassword123!', newPassword)
        .then((response) => {
          expect(response.body.message).to.include('updated');
          cy.logTestStep('Password updated successfully');
          
          // Logout and try to login with new password
          return AuthHelper.logout();
        })
        .then(() => {
          return cy.verifyNotAuthenticated();
        });
    });

    it('should fail to update password with incorrect current password', () => {
      cy.logTestStep('Testing password update with wrong current password');
      
      ApiClient.updatePassword('WrongCurrentPassword', newPassword)
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 401]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('current password');
        });
    });

    it('should fail to update password without authentication', () => {
      cy.logTestStep('Testing password update without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.updatePassword('TestPassword123!', newPassword)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to update password with weak new password', () => {
      cy.logTestStep('Testing password update with weak password');
      
      ApiClient.updatePassword('TestPassword123!', '123')
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 422]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('password');
        });
    });
  });

  describe('Authentication Session Persistence', () => {
    it('should maintain authentication across multiple API calls', () => {
      cy.logTestStep('Testing session persistence');
      
      cy.createAndLoginTestUser()
        .then(() => {
          // Make multiple authenticated calls
          return cy.verifyAuthenticated();
        })
        .then(() => {
          return cy.verifyAuthenticated();
        })
        .then(() => {
          return cy.verifyAuthenticated();
        })
        .then(() => {
          cy.logTestStep('Session persistence verified');
        });
    });

    it('should handle concurrent authentication requests', () => {
      cy.logTestStep('Testing concurrent authentication');
      
      const userData = UserDataManager.generateRegistrationPayload();
      
      // Register user first
      ApiClient.register(userData)
        .then(() => {
          // Make multiple concurrent login requests
          const loginPromises = Array(3).fill(null).map(() => 
            ApiClient.login(userData.email, userData.password)
          );
          
          return cy.wrap(Promise.all(loginPromises));
        })
        .then((sessions) => {
          // All should succeed
          (sessions as any[]).forEach((session, index) => {
            expect(session.user.email).to.eq(userData.email);
            expect(session.tokens.accessToken).to.be.a('string');
            cy.log(`Concurrent login ${index + 1} successful`);
          });
        });
    });
  });
});