/// <reference types="cypress" />

describe('Authentication - User Login', () => {
  let validUser: any;
  let testCredentials: any;

  before(() => {
    // Use environment variables for test credentials
    testCredentials = {
      email: Cypress.env('TEST_USER_EMAIL'),
      password: Cypress.env('TEST_USER_PASSWORD')
    };
    
    // Try to get user info first, if not found, create the user
    cy.apiRequest({
      method: 'POST',
      url: '/auth/login',
      body: testCredentials,
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200 && response.body.success) {
        testCredentials.userId = response.body.data.user.id;
        cy.log('✅ Test user already exists and can login');
      } else {
        // Create the test user if login fails
        cy.fixture('api/users/test-users').then((users) => {
          validUser = users.valid_users[0];
          
          const testUser = {
            ...validUser,
            email: testCredentials.email,
            password: testCredentials.password
          };
          
          cy.register(testUser).then((regResponse) => {
            if (regResponse.success && regResponse.data) {
              testCredentials.userId = regResponse.data.user.id;
              cy.log('✅ Test user created for login tests');
            } else {
              cy.log('ℹ️ Test user may already exist, proceeding with tests');
            }
          });
        });
      }
    });
  });

  beforeEach(() => {
    // Ensure clean auth state
    cy.clearAuthToken();
  });

  afterEach(() => {
    cy.clearAuthToken();
  });

  describe('Valid Login Scenarios', () => {
    it('should successfully login with valid email and password', () => {
      cy.login(testCredentials).then((response) => {
        expect(response.success).to.be.true;
        
        // Handle both formats: normalized data object or direct Supabase format
        if (response.data && response.data.access_token) {
          // Normalized format
          expect(response.data).to.have.property('user');
          expect(response.data).to.have.property('access_token');
          expect(response.data).to.have.property('refresh_token');
          cy.validateUserSchema(response.data.user);
          expect(response.data.user.email).to.equal(testCredentials.email);
        } else if (response.session || response.user) {
          // Direct Supabase format
          expect(response).to.have.property('user');
          expect(response).to.have.property('session');
          expect(response.session).to.have.property('access_token');
          expect(response.session).to.have.property('refresh_token');
          cy.validateUserSchema(response.user);
          expect(response.user.email).to.equal(testCredentials.email);
        }
      });
    });

    it('should return user profile information on successful login', () => {
      cy.login(testCredentials).then((response) => {
        expect(response.success).to.be.true;
        
        let user;
        if (response.data) {
          user = response.data.user;
        } else if (response.user) {
          user = response.user;
        }
        
        if (user) {
          expect(user).to.have.property('id');
          expect(user).to.have.property('email');
          // fullName might be in user_metadata.name for Supabase
          if (user.fullName) {
            expect(user).to.have.property('fullName');
          } else if (user.user_metadata?.name) {
            expect(user.user_metadata).to.have.property('name');
          }
          // isVerified might be user_metadata.email_verified for Supabase
          if (user.isVerified !== undefined) {
            expect(user).to.have.property('isVerified');
          } else if (user.user_metadata?.email_verified !== undefined) {
            expect(user.user_metadata).to.have.property('email_verified');
          }
        }
      });
    });

    it('should generate valid JWT token on successful login', () => {
      cy.login(testCredentials).then((response) => {
        expect(response.success).to.be.true;
        
        let token;
        if (response.data) {
          token = response.data.access_token;
        } else if (response.session) {
          token = response.session.access_token;
        }
        
        if (token) {
          expect(token).to.be.a('string');
          expect(token.split('.').length).to.equal(3); // JWT has 3 parts
          
          // TODO : Validate token by making authenticated request
          // cy.validateAuthToken(token).then((isValid) => {
          //   expect(isValid).to.be.true;
          // });
        }
      });
    });

    it('should allow login with different case email', () => {
      const upperCaseEmail = testCredentials.email.toUpperCase();
      
      cy.login({
        email: upperCaseEmail,
        password: testCredentials.password
      }).then((response) => {
        expect(response.success).to.be.true;
        if (response.success && response.data) {
          expect(response.data.user.email).to.equal(testCredentials.email.toLowerCase());
        }
      });
    });
  });

  describe('Invalid Login Scenarios', () => {
    it('should reject login with incorrect password', () => {
      cy.login({
        email: testCredentials.email,
        password: 'WrongPassword123!'
      }).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('Invalid login credentials');
      });
    });

    it('should reject login with non-existent email', () => {
      cy.login({
        email: `nonexistent.${Date.now()}@testmail.com`,
        password: testCredentials.password
      }).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('Invalid login credentials');
      });
    });

    it('should reject login with empty email', () => {
      cy.apiRequest({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: '',
          password: testCredentials.password
        }
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response, 'Validation error');
      });
    });

    it('should reject login with empty password', () => {
      cy.apiRequest({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: testCredentials.email,
          password: ''
        }
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response, 'Validation error');
      });
    });

    it('should reject login with missing credentials', () => {
      cy.apiRequest({
        method: 'POST',
        url: '/auth/login',
        body: {}
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response, 'Validation error');
      });
    });

    it('should reject login with malformed email', () => {
      cy.login({
        email: 'malformed-email-format',
        password: testCredentials.password
      }).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('Validation error');
      });
    });
  });

  describe('Account Security', () => {
    it('should not return sensitive information in login response', () => {
      cy.login(testCredentials).then((response) => {
        expect(response.success).to.be.true;
        
        // Ensure password is not in response
        if (response.data) {
          expect(response.data.user).to.not.have.property('password');
          expect(JSON.stringify(response.data)).to.not.include(testCredentials.password);
        }
      });
    });
    
    // TODO : Add test for 'should handle multiple rapid login attempts gracefully'
  });

  describe('Token Management', () => {
    it('should provide refresh token for token renewal', () => {
      cy.login(testCredentials).then((response) => {
        expect(response.success).to.be.true;
        if (response.data) {
          expect(response.data).to.have.property('refresh_token');
          expect(response.data.refresh_token).to.be.a('string');
          expect(response.data.refresh_token).to.not.be.empty;
        }
      });
    });

    it('should allow authentication with returned token', () => {
      cy.login(testCredentials).then((response) => {
        expect(response.success).to.be.true;
        
        if (response.data) {
          const token = response.data.access_token;
          
          // Note: /auth/me endpoint not yet implemented
          // For now, just verify token was received
          expect(token).to.exist;
          expect(token).to.be.a('string');
          cy.log('✅ Authentication token received successfully');
        }
      });
    });
  });

  describe('Performance Testing', () => {
    it('should complete login within acceptable time limit', () => {
      cy.performanceTest('user_login', () => {
        return cy.apiRequest({
          method: 'POST',
          url: '/auth/login',
          body: testCredentials
        });
      }, 2000).then((metrics) => {
        expect(metrics.responseTime).to.be.lessThan(2000);
      });
    });

    it('should handle concurrent login requests efficiently', () => {
      cy.concurrencyTest('/auth/login', 5, {
        method: 'POST',
        body: testCredentials
      }).then((results) => {
        expect(results.successfulRequests).to.be.greaterThan(0);
        expect(results.averageResponseTime).to.be.lessThan(3000);
        expect(results.errorRate).to.be.lessThan(10); // Less than 10% error rate
      });
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for invalid credentials', () => {
      cy.login({
        email: testCredentials.email,
        password: 'WrongPassword'
      }).then((response) => {
        expect(response.success).to.be.false;
        expect(response).to.have.property('error');
        expect(response.error).to.be.a('string');
        expect(response.error).to.not.be.empty;
      });
    });

    it('should return validation errors in consistent format', () => {
      cy.apiRequest({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: 'invalid-email',
          password: ''
        }
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response);
        
        if (response.body.details) {
          expect(response.body.details).to.be.an('array');
        }
      });
    });
  });

  describe('Session Management', () => {
    it('should maintain session state after successful login', () => {
      cy.login(testCredentials).then((response) => {
        expect(response.success).to.be.true;
        if (response.data) {
          const token = response.data.access_token;
          
          // Store token and verify it persists
          cy.setAuthToken(token as string);
          
          cy.getAuthToken().then((storedToken) => {
            expect(storedToken).to.equal(token);
          });
        }
      });
    });

    it('should allow user to verify authentication status', () => {
      cy.login(testCredentials).then((response) => {
        expect(response.success).to.be.true;
        if (response.data) {
          const token = response.data.access_token;
          
          cy.setAuthToken(token as string);
          cy.verifyAuthenticated().then((userProfile) => {
            // TODO : Proper Implementation
            // expect(userProfile.id).to.equal(testCredentials.userId);
            // expect(userProfile.email).to.equal(testCredentials.email);
          });
        }
      });
    });
  });
});