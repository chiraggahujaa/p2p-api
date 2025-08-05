// Advanced Authentication API Tests
/// <reference types="cypress" />

import { ApiClient } from '../../support/request/api';
import { AuthHelper } from '../../support/helpers/auth';
import { TestUtils } from '../../support/helpers/utils';
import { testUsers, UserDataManager } from '../../data/users';

describe('Authentication API - Advanced Scenarios', () => {
  beforeEach(() => {
    AuthHelper.clearAuth();
  });

  afterEach(() => {
    AuthHelper.clearAuth();
  });

  describe('Email Verification', () => {
    let unverifiedUser: any;
    let verificationToken: string;

    beforeEach(() => {
      // Create user and simulate verification token
      const userData = UserDataManager.generateRegistrationPayload();
      
      ApiClient.register(userData)
        .then((response) => {
          unverifiedUser = { ...userData, id: response.body.data.id };
          // In a real scenario, this would come from email
          verificationToken = 'mock_verification_token_' + unverifiedUser.id;
        });
    });

    it('should successfully verify email with valid token', () => {
      // Note: This test may need to be adjusted based on actual implementation
      cy.logTestStep('Testing email verification');
      
      // Since we don't have real email integration in tests, 
      // this is more of a placeholder for the verification flow
      cy.log('Email verification test - implementation dependent on actual email system');
      
      // If the API has a test endpoint for verification, use it here
      // ApiClient.verifyEmail(verificationToken)
      //   .then((response) => {
      //     expect(response).to.be.apiResponse(200);
      //     expect(response.body.message).to.include('verified');
      //   });
    });

    it('should fail verification with invalid token', () => {
      cy.logTestStep('Testing email verification with invalid token');
      
      ApiClient.verifyEmail('invalid_token')
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 404]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('invalid');
        });
    });

    it('should fail verification with expired token', () => {
      cy.logTestStep('Testing email verification with expired token');
      
      ApiClient.verifyEmail('expired_token')
        .then((response) => {
          expect(response.status).to.be.oneOf([400, 410]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('expired');
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should handle login rate limiting', () => {
      cy.logTestStep('Testing login rate limiting');
      
      const invalidEmail = 'nonexistent@example.com';
      const invalidPassword = 'wrongpassword';
      const maxAttempts = 5;
      
      // Make multiple failed login attempts
      const attempts = Array(maxAttempts).fill(null).map((_, index) => {
        return () => {
          cy.log(`Login attempt ${index + 1}/${maxAttempts}`);
          return ApiClient.post('/auth/login', { 
            email: invalidEmail, 
            password: invalidPassword 
          }, { failOnStatusCode: false });
        };
      });
      
      // Execute attempts sequentially
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      attempts.forEach((attempt, index) => {
        chain = chain.then(() => {
          return attempt().then((response) => {
            if (index < maxAttempts - 1) {
              // First few attempts should return 401
              expect(response.status).to.eq(401);
            } else {
              // Last attempt might be rate limited (429) or still 401
              expect(response.status).to.be.oneOf([401, 429]);
              if (response.status === 429) {
                expect(response.body.error).to.include('rate limit');
                cy.log('Rate limiting detected');
              }
            }
          });
        });
      });
    });

    it('should handle registration rate limiting', () => {
      cy.logTestStep('Testing registration rate limiting');
      
      const attempts = Array(6).fill(null).map((_, index) => {
        return UserDataManager.generateRegistrationPayload({
          email: `ratelimit${index}@example.com`
        });
      });
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      attempts.forEach((userData, index) => {
        chain = chain.then(() => {
          cy.log(`Registration attempt ${index + 1}/${attempts.length}`);
          return ApiClient.register(userData)
            .then((response) => {
              if (index < 4) {
                // First few should succeed
                expect(response.status).to.eq(200);
              } else {
                // Later attempts might be rate limited
                expect(response.status).to.be.oneOf([200, 429]);
                if (response.status === 429) {
                  cy.log('Registration rate limiting detected');
                }
              }
            });
        });
      });
    });
  });

  describe('Security Headers and CORS', () => {
    it('should include proper security headers in responses', () => {
      cy.logTestStep('Testing security headers');
      
      const userData = UserDataManager.generateRegistrationPayload();
      
      ApiClient.register(userData)
        .then((response) => {
          // Check for security headers (implementation specific)
          const headers = response.headers;
          
          // Common security headers to check for
          if (headers['x-content-type-options']) {
            expect(headers['x-content-type-options']).to.include('nosniff');
          }
          
          if (headers['x-frame-options']) {
            expect(headers['x-frame-options']).to.be.oneOf(['DENY', 'SAMEORIGIN']);
          }
          
          if (headers['x-xss-protection']) {
            expect(headers['x-xss-protection']).to.include('1');
          }
          
          cy.log('Security headers validated');
        });
    });

    it('should handle CORS properly for API endpoints', () => {
      cy.logTestStep('Testing CORS handling');
      
      // Make an OPTIONS request to check CORS headers
      cy.request({
        method: 'OPTIONS',
        url: `${Cypress.env('API_BASE_URL')}/auth/login`,
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
        
        // Check CORS headers
        const headers = response.headers;
        if (headers['access-control-allow-origin']) {
          cy.log('CORS headers present');
        }
      });
    });
  });

  describe('Token Security', () => {
    let userSession: any;

    beforeEach(() => {
      cy.createAndLoginTestUser()
        .then((session) => {
          userSession = session;
        });
    });

    it('should invalidate token after logout', () => {
      cy.logTestStep('Testing token invalidation after logout');
      
      const accessToken = userSession.tokens.accessToken;
      
      // Verify token works
      cy.verifyAuthenticated()
        .then(() => {
          // Logout
          return AuthHelper.logout();
        })
        .then(() => {
          // Try to use the old token
          ApiClient.setAuthToken(accessToken);
          return ApiClient.getProfile();
        })
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
          cy.log('Token invalidated after logout');
        });
    });

    it('should reject malformed tokens', () => {
      cy.logTestStep('Testing malformed token rejection');
      
      const malformedTokens = [
        'invalid.token',
        'bearer-token-here',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        ''
      ];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      malformedTokens.forEach((token, index) => {
        chain = chain.then(() => {
          cy.log(`Testing malformed token ${index + 1}: ${token.substring(0, 20)}...`);
          ApiClient.setAuthToken(token);
          
          return ApiClient.getProfile()
            .then((response) => {
              expect(response.status).to.be.oneOf([401, 403]);
              expect(response.body.success).to.be.false;
            });
        });
      });
    });

    it('should handle token expiration gracefully', () => {
      cy.logTestStep('Testing token expiration handling');
      
      // Set an obviously expired token (this is a mock scenario)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      ApiClient.setAuthToken(expiredToken);
      
      ApiClient.getProfile()
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('token');
        });
    });
  });

  describe('Concurrent Authentication', () => {
    it('should handle multiple simultaneous login attempts for same user', () => {
      cy.logTestStep('Testing concurrent login attempts');
      
      const userData = UserDataManager.generateRegistrationPayload();
      
      // Register user first
      ApiClient.register(userData)
        .then(() => {
          // Make multiple concurrent login requests
          const concurrentLogins = Array(3).fill(null).map(() => 
            ApiClient.login(userData.email, userData.password)
          );
          
          return cy.wrap(Promise.all(concurrentLogins));
        })
        .then((sessions) => {
          // All should succeed and return valid tokens
          (sessions as any[]).forEach((session, index) => {
            expect(session.user.email).to.eq(userData.email);
            expect(session.tokens.accessToken).to.be.a('string').and.not.empty;
            
            // Tokens should be different (or this might be implementation dependent)
            if (index > 0) {
              const previousToken = (sessions as any[])[index - 1].tokens.accessToken;
              // Tokens might be the same or different depending on implementation
              cy.log(`Token ${index + 1}: ${session.tokens.accessToken.substring(0, 20)}...`);
            }
          });
        });
    });

    it('should handle concurrent registration attempts with same email', () => {
      cy.logTestStep('Testing concurrent registration with same email');
      
      const userData = UserDataManager.generateRegistrationPayload();
      
      // Make multiple concurrent registration requests with same email
      const concurrentRegistrations = Array(3).fill(null).map(() => 
        ApiClient.post('/auth/register', userData, { failOnStatusCode: false })
      );
      
      cy.wrap(Promise.allSettled(concurrentRegistrations))
        .then((results) => {
          let successCount = 0;
          let duplicateErrorCount = 0;
          
          (results as any[]).forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const response = result.value;
              if (response.status === 201) {
                successCount++;
              } else if (response.status === 400 || response.status === 409) {
                duplicateErrorCount++;
              }
              cy.log(`Registration ${index + 1}: Status ${response.status}`);
            }
          });
          
          // Only one should succeed, others should fail with duplicate error
          expect(successCount).to.eq(1);
          expect(duplicateErrorCount).to.be.at.least(1);
          
          cy.log(`Concurrent registration results: ${successCount} success, ${duplicateErrorCount} duplicate errors`);
        });
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle special characters in passwords', () => {
      cy.logTestStep('Testing passwords with special characters');
      
      const specialCharPasswords = [
        'P@ssw0rd!#$%',
        'Test"Password\'123',
        'Pass<word>123&',
        'Пароль123!', // Cyrillic characters
        '密码123!' // Chinese characters
      ];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      specialCharPasswords.forEach((password, index) => {
        chain = chain.then(() => {
          const userData = UserDataManager.generateRegistrationPayload({
            email: `special${index}@example.com`,
            password: password
          });
          
          cy.log(`Testing password ${index + 1}: ${password.substring(0, 5)}...`);
          
          return ApiClient.register(userData)
            .then((response) => {
              expect(response.status).to.eq(200);
              expect(response.body.success).to.be.true;
              
              // Test login with special character password
              return ApiClient.login(userData.email, password);
            })
            .then((session) => {
              expect(session.user.email).to.eq(userData.email);
              expect(session.tokens.accessToken).to.be.a('string');
            });
        });
      });
    });

    it('should handle very long email addresses', () => {
      cy.logTestStep('Testing long email addresses');
      
      const longLocalPart = 'a'.repeat(60); // Very long local part
      const longEmail = `${longLocalPart}@example.com`;
      
      const userData = UserDataManager.generateRegistrationPayload({
        email: longEmail
      });
      
      ApiClient.register(userData)
        .then((response) => {
          // Should either succeed or fail gracefully with proper error
          if (response.status === 200) {
            expect(response.body.data.email).to.eq(longEmail);
            cy.log('Long email registration succeeded');
          } else {
            expect(response.status).to.be.oneOf([400, 422]);
            expect(response.body.error).to.include('email');
            cy.log('Long email registration failed with proper validation');
          }
        });
    });

    it('should handle Unicode characters in user names', () => {
      cy.logTestStep('Testing Unicode characters in names');
      
      const unicodeNames = [
        'José María',
        'François Müller',
        '田中太郎',
        'Владимир Петров',
        'محمد علي',
        '🎉 John Doe 🎉'
      ];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      unicodeNames.forEach((name, index) => {
        chain = chain.then(() => {
          const userData = UserDataManager.generateRegistrationPayload({
            email: `unicode${index}@example.com`,
            name: name
          });
          
          cy.log(`Testing name: ${name}`);
          
          return ApiClient.register(userData)
            .then((response) => {
              // Should handle Unicode names properly
              if (response.status === 200) {
                expect(response.body.data.name).to.eq(name);
                cy.log(`Unicode name "${name}" accepted`);
              } else {
                expect(response.status).to.be.oneOf([400, 422]);
                cy.log(`Unicode name "${name}" rejected with validation`);
              }
            });
        });
      });
    });
  });

  describe('Performance and Load', () => {
    it('should handle rapid successive authentication requests', () => {
      cy.logTestStep('Testing rapid authentication requests');
      
      const userData = UserDataManager.generateRegistrationPayload();
      
      // Register user first
      ApiClient.register(userData)
        .then(() => {
          // Make rapid successive login requests
          const rapidRequests = Array(10).fill(null).map((_, index) => {
            return () => {
              return TestUtils.measurePerformance(
                () => ApiClient.login(userData.email, userData.password),
                `Login attempt ${index + 1}`
              );
            };
          });
          
          // Execute requests with minimal delay
          let chain: Cypress.Chainable<any> = cy.wrap(null);
          rapidRequests.forEach((request, index) => {
            chain = chain.then(() => {
              return request().then((result) => {
                expect(result.result.user.email).to.eq(userData.email);
                if (result.duration > 5000) {
                  cy.log(`⚠️ Slow authentication detected: ${result.duration}ms`);
                }
              });
            });
          });
          
          return chain;
        });
    });

    it('should maintain performance under authentication load', () => {
      cy.logTestStep('Testing authentication performance');
      
      const performanceThreshold = 3000; // 3 seconds
      
      TestUtils.measurePerformance(
        () => {
          const userData = UserDataManager.generateRegistrationPayload();
          return ApiClient.register(userData)
            .then(() => ApiClient.login(userData.email, userData.password));
        },
        'Complete registration and login flow'
      ).then((result) => {
        expect(result.duration).to.be.below(performanceThreshold);
        cy.log(`Authentication flow completed in ${result.duration}ms`);
      });
    });
  });
});