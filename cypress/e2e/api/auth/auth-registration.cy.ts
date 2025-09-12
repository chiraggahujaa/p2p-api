/// <reference types="cypress" />

describe('Authentication - User Registration', () => {
  let testUsers: any[];
  let invalidUsers: any[];

  before(() => {
    cy.fixture('api/users/test-users').then((users) => {
      testUsers = users.valid_users;
      invalidUsers = users.invalid_users;
    });
  });

  beforeEach(() => {
    // Clean up any existing auth state
    cy.clearAuthToken();
  });

  afterEach(() => {
    // Clean up after each test
    cy.clearAuthToken();
  });

  describe('Valid Registration Scenarios', () => {
    it('should successfully register a new user with all required fields', () => {
      const userData = testUsers[0];
      
      cy.register(userData).then((response) => {
        expect(response.success).to.be.true;
        expect(response.data).to.have.property('user');
        expect(response.data).to.have.property('access_token');
        
        // Validate user data structure
        cy.validateUserSchema(response.data?.user);
        
        // Verify email matches
        expect(response.data?.user.email).to.equal(userData.email);
        expect(response.data?.user.fullName).to.equal(userData.fullName);
      });
    });

    it('should register user with minimal required fields', () => {
      const minimalUserData = {
        fullName: 'Minimal User',
        email: `minimal.${Date.now()}@testmail.com`,
        password: 'SecurePass123!',
        gender: 'prefer_not_to_say',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.register(minimalUserData).then((response) => {
        expect(response.success).to.be.true;
        expect(response.data?.user.fullName).to.equal(minimalUserData.fullName);
        expect(response.data?.user.email).to.equal(minimalUserData.email);
      });
    });

    it('should register user with optional fields', () => {
      const userData = {
        ...testUsers[1],
        email: `optional.${Date.now()}@testmail.com`,
        phoneNumber: '+1987654321',
        bio: 'Test user with optional fields'
      };

      cy.register(userData).then((response) => {
        expect(response.success).to.be.true;
        // expect(response.data?.user.phoneNumber).to.equal(userData.phoneNumber);
        // expect(response.data?.user.bio).to.equal(userData.bio);
      });
    });

    it('should set default values for optional fields', () => {
      const userData = {
        fullName: 'Default Values User',
        email: `defaults.${Date.now()}@testmail.com`,
        password: 'SecurePass123!',
        gender: 'prefer_not_to_say',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.register(userData).then((response) => {
        expect(response.success).to.be.true;
        expect(response.data?.user.isVerified).to.be.false;
        // expect(response.data?.user.isActive).to.be.true;
        // expect(response.data?.user.trustScore).to.equal(0);
      });
    });
  });

  describe('Invalid Registration Scenarios', () => {
    it('should reject registration with invalid email format', () => {
      const userData = {
        fullName: 'Test User',
        email: 'invalid-email-format',
        password: 'SecurePass123!',
        gender: 'male',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.register(userData).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('email');
      });
    });

    it('should reject registration with weak password', () => {
      const userData = {
        fullName: 'Test User',
        email: `weak.password.${Date.now()}@testmail.com`,
        password: '123',
        gender: 'male',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.register(userData).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('password');
      });
    });

    it('should reject registration with missing required fields', () => {
      const incompleteData = {
        fullName: 'Test User'
        // Missing email, password, etc.
      };

      cy.apiRequest({
        method: 'POST',
        url: '/auth/register',
        body: incompleteData
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response, 'Validation error');
      });
    });

    it('should reject registration with duplicate email', () => {
      const userData = {
        fullName: 'Duplicate User',
        email: `duplicate.${Date.now()}@testmail.com`,
        password: 'SecurePass123!',
        gender: 'female',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      // Register user first time
      cy.register(userData).then((firstResponse) => {
        expect(firstResponse.success).to.be.true;
        
        // Attempt to register same email again
        cy.register(userData).then((secondResponse) => {
          expect(secondResponse.success).to.be.false;
          expect(secondResponse.error).to.include('email');
        });
      });
    });

    it('should reject registration with invalid phone number format', () => {
      const userData = {
        fullName: 'Invalid Phone User',
        email: `invalid.phone.${Date.now()}@testmail.com`,
        password: 'SecurePass123!',
        phoneNumber: 'invalid-phone-format',
        gender: 'male',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.register(userData).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('phone');
      });
    });

    it('should reject registration with invalid date format', () => {
      const userData = {
        fullName: 'Invalid Date User',
        email: `invalid.date.${Date.now()}@testmail.com`,
        password: 'SecurePass123!',
        gender: 'male',
        dob: 'invalid-date-format',
        dobVisibility: 'private'
      };

      cy.register(userData).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('date');
      });
    });
  });

  describe('Password Security Requirements', () => {
    const passwordTests = [
      { password: 'short', reason: 'too short' },
      { password: 'nouppercaselower123!', reason: 'no uppercase' },
      { password: 'NOLOWERCASEUPPER123!', reason: 'no lowercase' },
      { password: 'NoNumbers!', reason: 'no numbers' },
      { password: 'NoSpecialChars123', reason: 'no special characters' }
    ];

    passwordTests.forEach(({ password, reason }) => {
      it(`should reject password that is ${reason}`, () => {
        const userData = {
          fullName: 'Password Test User',
          email: `password.test.${Date.now()}@testmail.com`,
          password,
          gender: 'prefer_not_to_say',
          dob: '1990-01-01',
          dobVisibility: 'private'
        };

        cy.register(userData).then((response) => {
          expect(response.success).to.be.false;
          expect(response.error).to.include('password');
        });
      });
    });
  });

  describe('Field Validation', () => {
    it('should validate gender enum values', () => {
      const userData = {
        fullName: 'Gender Test User',
        email: `gender.test.${Date.now()}@testmail.com`,
        password: 'SecurePass123!',
        gender: 'invalid_gender',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.register(userData).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('gender');
      });
    });

    it('should validate dobVisibility enum values', () => {
      const userData = {
        fullName: 'DOB Visibility Test User',
        email: `dob.visibility.test.${Date.now()}@testmail.com`,
        password: 'SecurePass123!',
        gender: 'male',
        dob: '1990-01-01',
        dobVisibility: 'invalid_visibility'
      };

      cy.register(userData).then((response) => {
        expect(response.success).to.be.false;
        expect(response.error).to.include('visibility');
      });
    });
  });

  describe('Performance Testing', () => {
    it('should complete registration within acceptable time limit', () => {
      const userData = {
        fullName: 'Performance Test User',
        email: `performance.${Date.now()}@testmail.com`,
        password: 'SecurePass123!',
        gender: 'female',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.performanceTest('user_registration', () => {
        return cy.apiRequest({
          method: 'POST',
          url: '/auth/register',
          body: userData
        });
      }, 3000).then((metrics) => {
        expect(metrics.response.status).to.equal(201);
      });
    });
  });
});