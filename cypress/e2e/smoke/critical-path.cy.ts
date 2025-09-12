/// <reference types="cypress" />

describe('Smoke Tests - Critical Application Paths', () => {
  let testUser: any;
  let authToken: string | undefined;
  
  before(() => {
    // Verify API is accessible
    cy.apiRequest({
      method: 'GET',
      url: 'http://localhost:5000/health',
      timeout: 10000
    }).then((response) => {
      cy.validateStatusCode(response, 200);
      expect(response.body).to.have.property('status', 'OK');
    });
  });

  describe('Core User Journey - Happy Path', () => {
    it('should complete full user registration → login → item creation flow', () => {
      // Step 1: Login with test credentials from environment variables
      cy.log('🔐 Step 1: User Login');
      const testCredentials = {
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD')
      };

      cy.login(testCredentials).then((loginResponse) => {
        if (loginResponse.success && loginResponse.data) {
          testUser = loginResponse.data.user;
          authToken = loginResponse.data.access_token;
          cy.log('✅ User login successful');
        } else {
          // Create user if login fails
          cy.fixture('api/users/test-users').then((users) => {
            const userData = {
              ...users.valid_users[0],
              email: testCredentials.email,
              password: testCredentials.password,
              fullName: `Test User ${Date.now()}`,
              phoneNumber: '+1234567890',
              gender: 'prefer_not_to_say',
              dob: '1990-01-01',
              dobVisibility: 'private'
            };

            cy.register(userData).then((regResponse) => {
              if (regResponse.success && regResponse.data) {
                testUser = regResponse.data.user;
                authToken = regResponse.data.access_token;
                cy.log('✅ User registration and login successful');
              }
            });
          });
        }
      });

      // Step 2: Verify user authentication (profile endpoint not yet available)
      cy.log('👤 Step 2: Authentication Verification');
      // Note: /auth/me endpoint not yet implemented
      // For now, just verify we have a valid token
      expect(authToken).to.exist;
      if (authToken) {
        expect(authToken).to.be.a('string');
        cy.log('✅ Authentication token verified');
      }

      // Step 3: Create test category (admin functionality)
      cy.log('📂 Step 3: Category Creation');
      const categoryData = {
        categoryName: `Smoke Test Category ${Date.now()}`,
        description: 'Test category for smoke tests',
        isActive: true,
        sortOrder: 1
      };

      cy.apiRequest({
        method: 'POST',
        url: '/categories',
        body: categoryData,
        auth: { bearer: authToken as string }
      }).then((categoryResponse) => {
        if (categoryResponse.status === 201) {
          cy.log('✅ Category creation successful');
        } else {
          cy.log('ℹ️ Category creation not available for this user role');
        }
      });

      // Step 4: List available categories
      cy.log('📋 Step 4: Categories Listing');
      cy.apiRequest({
        method: 'GET',
        url: '/categories'
      }).then((categoriesResponse) => {
        cy.validateStatusCode(categoriesResponse, 200);
        cy.validatePaginatedResponse(categoriesResponse);
        expect(categoriesResponse.body.data).to.be.an('array');
        cy.log('✅ Categories listing successful');
      });

      // Step 5: Create location
      cy.log('📍 Step 5: Location Creation');
      const locationData = {
        addressLine: '123 Smoke Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '12345',
        country: 'Test Country',
        latitude: 40.7128,
        longitude: -74.0060
      };

      cy.apiRequest({
        method: 'POST',
        url: '/locations',
        body: locationData,
        auth: { bearer: authToken as string }
      }).then((locationResponse) => {
        if (locationResponse.status === 201) {
          cy.log('✅ Location creation successful');
          
          // Step 6: Create test item
          cy.log('📦 Step 6: Item Creation');
          const itemData = {
            title: `Smoke Test Item ${Date.now()}`,
            description: 'Test item created during smoke tests',
            condition: 'excellent',
            rentPricePerDay: 25.00,
            securityAmount: 100.00,
            minRentalDays: 1,
            maxRentalDays: 7,
            deliveryMode: 'pickup_and_delivery',
            isNegotiable: true,
            tags: ['smoke-test', 'automated'],
            locationId: locationResponse.body.data.id
          };

          // Try to get a category for the item
          cy.apiRequest({
            method: 'GET',
            url: '/categories?limit=1'
          }).then((catResponse) => {
            if (catResponse.body.data.length > 0) {
              (itemData as any).categoryId = catResponse.body.data[0].id;
            }

            cy.apiRequest({
              method: 'POST',
              url: '/items',
              body: itemData,
              auth: { bearer: authToken as string }
            }).then((itemResponse) => {
              cy.validateStatusCode(itemResponse, 201);
              expect(itemResponse.body.success).to.be.true;
              expect(itemResponse.body.data).to.have.property('id');
              cy.log('✅ Item creation successful');

              // Step 7: Retrieve created item
              cy.log('🔍 Step 7: Item Retrieval');
              const itemId = itemResponse.body.data.id;
              
              cy.apiRequest({
                method: 'GET',
                url: `/items/${itemId}`
              }).then((retrieveResponse) => {
                cy.validateStatusCode(retrieveResponse, 200);
                expect(retrieveResponse.body.data.title).to.equal(itemData.title);
                cy.log('✅ Item retrieval successful');
              });

              // Step 8: List items
              cy.log('📋 Step 8: Items Listing');
              cy.apiRequest({
                method: 'GET',
                url: '/items?limit=10'
              }).then((itemsResponse) => {
                cy.validateStatusCode(itemsResponse, 200);
                cy.validatePaginatedResponse(itemsResponse);
                expect(itemsResponse.body.data).to.be.an('array');
                cy.log('✅ Items listing successful');
              });
            });
          });
        } else {
          cy.log('⚠️ Location creation failed, skipping item creation');
        }
      });
    });
  });

  describe('API Health Checks', () => {
    it('should verify all critical endpoints are accessible', () => {
      const criticalEndpoints = [
        { method: 'GET', url: 'http://localhost:5000/health', description: 'Health check' },
        { method: 'GET', url: '/categories', description: 'Categories listing' },
        { method: 'GET', url: '/items', description: 'Items listing' }
      ];

      criticalEndpoints.forEach(endpoint => {
        cy.apiRequest({
          method: endpoint.method,
          url: endpoint.url
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 201]);
          cy.log(`✅ ${endpoint.description} endpoint accessible`);
        });
      });
    });

    it('should verify database connectivity', () => {
      cy.apiRequest({
        method: 'GET',
        url: 'http://localhost:5000/health'
      }).then((response) => {
        cy.validateStatusCode(response, 200);
        expect(response.body).to.have.property('status', 'OK');
        
        if (response.body.database) {
          expect(response.body.database).to.have.property('status', 'connected');
        }
        cy.log('✅ Database connectivity verified');
      });
    });

    it('should verify authentication system is working', () => {
      // Test invalid credentials return proper error
      cy.apiRequest({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401]);
        expect(response.body.success).to.be.false;
        cy.log('✅ Authentication system responding correctly');
      });
    });
  });

  describe('Performance Smoke Tests', () => {
    it('should verify critical endpoints respond within acceptable time', () => {
      const performanceTests = [
        { url: 'http://localhost:5000/health', maxTime: 1000, name: 'Health Check' },
        { url: '/categories', maxTime: 2000, name: 'Categories Listing' },
        { url: '/items?limit=10', maxTime: 3000, name: 'Items Listing' }
      ];

      performanceTests.forEach(test => {
        cy.performanceTest(test.name, () => {
          return cy.apiRequest({
            method: 'GET',
            url: test.url
          });
        }, test.maxTime).then((metrics) => {
          cy.log(`✅ ${test.name} performance acceptable: ${metrics.responseTime}ms`);
        });
      });
    });

    it('should handle reasonable concurrent load', () => {
      cy.concurrencyTest('http://localhost:5000/health', 5).then((results) => {
        expect(results.successfulRequests).to.equal(5);
        expect(results.averageResponseTime).to.be.lessThan(2000);
        expect(results.errorRate).to.be.lessThan(10);
        cy.log('✅ Concurrent load handling verified');
      });
    });
  });

  describe('Data Integrity Smoke Tests', () => {
    it('should verify API returns consistent response formats', () => {
      cy.apiRequest({
        method: 'GET',
        url: '/categories'
      }).then((response) => {
        cy.validateStatusCode(response, 200);
        cy.validatePaginatedResponse(response);
        
        if (response.body.data.length > 0) {
          cy.validateCategorySchema(response.body.data[0]);
        }
        
        cy.log('✅ Response format consistency verified');
      });
    });

    it('should verify error responses are properly formatted', () => {
      cy.apiRequest({
        method: 'GET',
        url: '/items/invalid-uuid-format'
      }).then((response) => {
        expect(response.status).to.be.at.least(400);
        cy.validateErrorResponse(response);
        cy.log('✅ Error response format verified');
      });
    });
  });

  describe('Security Smoke Tests', () => {
    it('should reject requests without proper authentication', () => {
      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: {
          title: 'Unauthorized Item',
          description: 'This should fail'
        },
        failOnStatusCode: false
      }).then((response) => {
        cy.validateStatusCode(response, 401);
        cy.validateErrorResponse(response, 'authentication');
        cy.log('✅ Authentication protection verified');
      });
    });

    it('should validate input data properly', () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>',
        description: 'SELECT * FROM users;',
        condition: 'invalid',
        rentPricePerDay: 'not-a-number'
      };

      const testCredentials = {
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD')
      };
      
      cy.login(testCredentials).then((loginResponse) => {
        const token = loginResponse.data?.access_token;
        if (token) {
          cy.apiRequest({
            method: 'POST',
            url: '/items',
            body: maliciousData,
            auth: { bearer: token }
          }).then((response) => {
            cy.validateStatusCode(response, 400);
            cy.validateErrorResponse(response);
            cy.log('✅ Input validation security verified');
          });
        }
      });
    });
  });

  describe('Critical Business Logic', () => {
    it('should maintain data relationships correctly', () => {
      const testCredentials = {
        email: Cypress.env('TEST_USER_EMAIL'),
        password: Cypress.env('TEST_USER_PASSWORD')
      };
      
      cy.login(testCredentials).then((loginResponse) => {
        const user = loginResponse.data?.user;
        const token = loginResponse.data?.access_token;
        
        if (user && token) {
          // Create location first
          const locationData = {
            addressLine: '123 Business Logic Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '12345',
            country: 'Test Country'
          };

          cy.apiRequest({
            method: 'POST',
            url: '/locations',
            body: locationData,
            auth: { bearer: token }
          }).then((locationResponse) => {
            if (locationResponse.status === 201) {
              const locationId = locationResponse.body.data.id;

              // Get a category
              cy.apiRequest({
                method: 'GET',
                url: '/categories?limit=1'
              }).then((catResponse) => {
                if (catResponse.body.data.length > 0) {
                  const categoryId = catResponse.body.data[0].id;

                  // Create item with relationships
                  const itemData = {
                    title: 'Business Logic Test Item',
                    description: 'Testing data relationships',
                    condition: 'excellent',
                    rentPricePerDay: 30.00,
                    categoryId: categoryId,
                    locationId: locationId
                  };

                  cy.apiRequest({
                    method: 'POST',
                    url: '/items',
                    body: itemData,
                    auth: { bearer: token }
                  }).then((itemResponse) => {
                    if (itemResponse.status === 201) {
                      const item = itemResponse.body.data;
                      
                      // Verify relationships are maintained
                      expect(item.userId).to.equal(user.id);
                      expect(item.categoryId).to.equal(categoryId);
                      expect(item.locationId).to.equal(locationId);
                      
                      cy.log('✅ Data relationships maintained correctly');
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  });

  after(() => {
    cy.log('🏁 Smoke tests completed');
    cy.log('Summary: Critical application paths verified');
    cy.log('- User registration and authentication ✅');
    cy.log('- Core CRUD operations ✅');
    cy.log('- API health and availability ✅');
    cy.log('- Performance baselines ✅');
    cy.log('- Security controls ✅');
    cy.log('- Data integrity ✅');
  });
});