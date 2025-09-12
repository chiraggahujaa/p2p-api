/// <reference types="cypress" />

describe('Items - CRUD Operations', () => {
  let authToken: string;
  let testUser: any;
  let testCategory: any;
  let testLocation: any;
  let validItemData: any[];
  let invalidItemData: any[];

  before(() => {
    // Load test data
    cy.fixture('api/items/test-items').then((items) => {
      validItemData = items.valid_items;
      invalidItemData = items.invalid_items;
    });

    // Login with test credentials from environment variables
    const testCredentials = {
      email: Cypress.env('TEST_USER_EMAIL'),
      password: Cypress.env('TEST_USER_PASSWORD')
    };

    cy.login(testCredentials).then((response) => {
      cy.log(`Login response structure: ${JSON.stringify(Object.keys(response))}`);
      if (response.success) {
        // Handle the normalized format from our auth commands
        if (response.data && response.data.access_token) {
          testUser = response.data.user;
          authToken = response.data.access_token;
        } else if (response.session) {
          testUser = response.user;
          authToken = response.session.access_token;
        }
        cy.log(`✅ Logged in with test credentials. Token: ${authToken ? 'present' : 'missing'}`);
      } else {
        // Create the user if login fails
        cy.fixture('api/users/test-users').then((users) => {
          const userData = {
            ...users.valid_users[0],
            email: testCredentials.email,
            password: testCredentials.password
          };
          
          cy.register(userData).then((regResponse) => {
            if (regResponse.success) {
              if (regResponse.data && regResponse.data.access_token) {
                testUser = regResponse.data.user;
                authToken = regResponse.data.access_token;
              } else if (regResponse.session) {
                testUser = regResponse.user;
                authToken = regResponse.session.access_token;
              }
              cy.log('✅ Created and logged in with test credentials');
            }
          });
        });
      }
    });

    // Create test category and location
    cy.seedTestCategories().then((categories: any) => {
      if (categories && categories.length > 0) {
        testCategory = categories[0];
      }
    });

    cy.seedTestLocations().then((locations: any) => {
      if (locations && locations.length > 0) {
        testLocation = locations[0];
      }
    });
  });

  beforeEach(() => {
    // Ensure authenticated for each test
    cy.setAuthToken(authToken);
  });

  describe('Create Item', () => {
    it('should successfully create an item with all required fields', () => {
      const itemData = {
        ...validItemData[0],
        categoryId: testCategory.id,
        locationId: testLocation.id
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: itemData,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 201);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('id');
        
        // Validate item structure
        cy.validateItemSchema(response.body.data);
        
        // Verify data integrity
        expect(response.body.data.title).to.equal(itemData.title);
        expect(response.body.data.description).to.equal(itemData.description);
        expect(response.body.data.rentPricePerDay).to.equal(itemData.rentPricePerDay);
        expect(response.body.data.userId).to.equal(testUser.id);
        expect(response.body.data.categoryId).to.equal(testCategory.id);
        expect(response.body.data.status).to.equal('available');
      });
    });

    it('should create item with minimal required fields', () => {
      const minimalItemData = {
        title: 'Minimal Test Item',
        description: 'Basic item for testing',
        categoryId: testCategory.id,
        condition: 'good',
        rentPricePerDay: 25.00,
        locationId: testLocation.id
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: minimalItemData,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 201);
        expect(response.body.success).to.be.true;
        
        // Verify defaults are set
        expect(response.body.data.status).to.equal('available');
        expect(response.body.data.isNegotiable).to.equal(false);
        expect(response.body.data.deliveryMode).to.equal('pickup_only');
      });
    });

    it('should create item with all optional fields', () => {
      const completeItemData = {
        ...validItemData[0],
        categoryId: testCategory.id,
        locationId: testLocation.id,
        securityAmount: 100.00,
        minRentalDays: 1,
        maxRentalDays: 14,
        deliveryMode: 'pickup_and_delivery',
        isNegotiable: true,
        tags: ['test', 'electronics', 'camera']
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: completeItemData,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 201);
        expect(response.body.success).to.be.true;
        
        const item = response.body.data;
        expect(item.securityAmount).to.equal(completeItemData.securityAmount);
        expect(item.minRentalDays).to.equal(completeItemData.minRentalDays);
        expect(item.maxRentalDays).to.equal(completeItemData.maxRentalDays);
        expect(item.deliveryMode).to.equal(completeItemData.deliveryMode);
        expect(item.isNegotiable).to.equal(completeItemData.isNegotiable);
        expect(item.tags).to.deep.equal(completeItemData.tags);
      });
    });

    it('should reject item creation without authentication', () => {
      const itemData = validItemData[0];

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: itemData,
        failOnStatusCode: false
      }).then((response) => {
        cy.validateStatusCode(response, 401);
        cy.validateErrorResponse(response, 'authentication');
      });
    });

    it('should reject item with invalid required fields', () => {
      const invalidItem = {
        title: '', // Empty title
        description: 'Test description',
        categoryId: testCategory.id,
        condition: 'good',
        rentPricePerDay: 25.00
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: invalidItem,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response, 'Validation error');
      });
    });

    it('should reject item with negative price', () => {
      const invalidItem = {
        title: 'Test Item',
        description: 'Test description',
        categoryId: testCategory.id,
        condition: 'good',
        rentPricePerDay: -10.00
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: invalidItem,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response);
      });
    });

    it('should reject item with invalid condition', () => {
      const invalidItem = {
        title: 'Test Item',
        description: 'Test description',
        categoryId: testCategory.id,
        condition: 'invalid_condition',
        rentPricePerDay: 25.00
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: invalidItem,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response);
      });
    });
  });

  describe('Read Item', () => {
    let createdItem: any;

    beforeEach(() => {
      // Create item for read tests
      const itemData = {
        ...validItemData[1],
        categoryId: testCategory.id,
        locationId: testLocation.id
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: itemData,
        auth: { bearer: authToken }
      }).then((response) => {
        createdItem = response.body.data;
      });
    });

    it('should retrieve item by ID', () => {
      cy.apiRequest({
        method: 'GET',
        url: `/items/${createdItem.id}`
      }).then((response) => {
        cy.validateStatusCode(response, 200);
        expect(response.body.success).to.be.true;
        
        cy.validateItemSchema(response.body.data);
        expect(response.body.data.id).to.equal(createdItem.id);
        expect(response.body.data.title).to.equal(createdItem.title);
      });
    });

    it('should return 404 for non-existent item', () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      cy.apiRequest({
        method: 'GET',
        url: `/items/${fakeUuid}`
      }).then((response) => {
        cy.validateStatusCode(response, 404);
        cy.validateErrorResponse(response, 'not found');
      });
    });

    it('should return 400 for invalid UUID format', () => {
      cy.apiRequest({
        method: 'GET',
        url: '/items/invalid-uuid'
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response);
      });
    });

    it('should include related data in item response', () => {
      cy.apiRequest({
        method: 'GET',
        url: `/items/${createdItem.id}`
      }).then((response) => {
        cy.validateStatusCode(response, 200);
        
        const item = response.body.data;
        expect(item).to.have.property('categoryId');
        expect(item).to.have.property('locationId');
        expect(item).to.have.property('userId');
        expect(item).to.have.property('createdAt');
        expect(item).to.have.property('updatedAt');
      });
    });
  });

  describe('Update Item', () => {
    let createdItem: any;

    beforeEach(() => {
      // Create item for update tests
      const itemData = {
        ...validItemData[2],
        categoryId: testCategory.id,
        locationId: testLocation.id
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: itemData,
        auth: { bearer: authToken }
      }).then((response) => {
        createdItem = response.body.data;
      });
    });

    it('should update item with valid data', () => {
      const updateData = {
        title: 'Updated Item Title',
        description: 'Updated item description',
        rentPricePerDay: 35.00,
        isNegotiable: true
      };

      cy.apiRequest({
        method: 'PUT',
        url: `/items/${createdItem.id}`,
        body: updateData,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 200);
        expect(response.body.success).to.be.true;
        
        const updatedItem = response.body.data;
        expect(updatedItem.title).to.equal(updateData.title);
        expect(updatedItem.description).to.equal(updateData.description);
        expect(updatedItem.rentPricePerDay).to.equal(updateData.rentPricePerDay);
        expect(updatedItem.isNegotiable).to.equal(updateData.isNegotiable);
        
        // Verify updated timestamp changed
        expect(new Date(updatedItem.updatedAt).getTime()).to.be.greaterThan(
          new Date(createdItem.updatedAt).getTime()
        );
      });
    });

    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Partially Updated Title'
      };

      cy.apiRequest({
        method: 'PUT',
        url: `/items/${createdItem.id}`,
        body: partialUpdate,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 200);
        expect(response.body.success).to.be.true;
        
        const updatedItem = response.body.data;
        expect(updatedItem.title).to.equal(partialUpdate.title);
        
        // Verify other fields unchanged
        expect(updatedItem.description).to.equal(createdItem.description);
        expect(updatedItem.rentPricePerDay).to.equal(createdItem.rentPricePerDay);
      });
    });

    it('should reject update without authentication', () => {
      const updateData = {
        title: 'Updated Title'
      };

      cy.apiRequest({
        method: 'PUT',
        url: `/items/${createdItem.id}`,
        body: updateData,
        failOnStatusCode: false
      }).then((response) => {
        cy.validateStatusCode(response, 401);
        cy.validateErrorResponse(response, 'authentication');
      });
    });

    it('should reject update by non-owner', () => {
      // Create another test user with different credentials
      const anotherUserData = {
        fullName: 'Another Test User',
        email: `another.test.${Date.now()}@example.com`,
        password: 'AnotherPass123!',
        phoneNumber: '+1234567891',
        gender: 'prefer_not_to_say',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.register(anotherUserData).then((regResponse) => {
        if (regResponse.success) {
          let anotherUserToken;
          if (regResponse.data && regResponse.data.access_token) {
            anotherUserToken = regResponse.data.access_token;
          } else if (regResponse.session) {
            anotherUserToken = regResponse.session.access_token;
          }
          
          const updateData = {
            title: 'Unauthorized Update'
          };

          cy.apiRequest({
            method: 'PUT',
            url: `/items/${createdItem.id}`,
            body: updateData,
            auth: { bearer: anotherUserToken as string }
          }).then((response) => {
            cy.validateStatusCode(response, 403);
            cy.validateErrorResponse(response, 'authorization');
          });
        }
      });
    });

    it('should reject invalid update data', () => {
      const invalidUpdate = {
        rentPricePerDay: -50.00 // Negative price
      };

      cy.apiRequest({
        method: 'PUT',
        url: `/items/${createdItem.id}`,
        body: invalidUpdate,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 400);
        cy.validateErrorResponse(response);
      });
    });

    it('should not allow updating read-only fields', () => {
      const forbiddenUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2024-01-01T00:00:00Z'
      };

      cy.apiRequest({
        method: 'PUT',
        url: `/items/${createdItem.id}`,
        body: forbiddenUpdate,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 200);
        
        const updatedItem = response.body.data;
        
        // Verify read-only fields weren't changed
        expect(updatedItem.id).to.equal(createdItem.id);
        expect(updatedItem.userId).to.equal(createdItem.userId);
        expect(updatedItem.createdAt).to.equal(createdItem.createdAt);
      });
    });
  });

  describe('Delete Item', () => {
    let createdItem: any;

    beforeEach(() => {
      // Create item for delete tests
      const itemData = {
        ...validItemData[3],
        categoryId: testCategory.id,
        locationId: testLocation.id
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: itemData,
        auth: { bearer: authToken }
      }).then((response) => {
        createdItem = response.body.data;
      });
    });

    it('should successfully delete item', () => {
      cy.apiRequest({
        method: 'DELETE',
        url: `/items/${createdItem.id}`,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 200);
        expect(response.body.success).to.be.true;
      });

      // Verify item is deleted
      cy.apiRequest({
        method: 'GET',
        url: `/items/${createdItem.id}`
      }).then((response) => {
        cy.validateStatusCode(response, 404);
      });
    });

    it('should reject delete without authentication', () => {
      cy.apiRequest({
        method: 'DELETE',
        url: `/items/${createdItem.id}`,
        failOnStatusCode: false
      }).then((response) => {
        cy.validateStatusCode(response, 401);
        cy.validateErrorResponse(response, 'authentication');
      });
    });

    it('should reject delete by non-owner', () => {
      // Create another test user with different credentials
      const anotherUserData = {
        fullName: 'Another Delete Test User',
        email: `delete.test.${Date.now()}@example.com`,
        password: 'DeletePass123!',
        phoneNumber: '+1234567892',
        gender: 'prefer_not_to_say',
        dob: '1990-01-01',
        dobVisibility: 'private'
      };

      cy.register(anotherUserData).then((regResponse) => {
        if (regResponse.success) {
          let anotherUserToken;
          if (regResponse.data && regResponse.data.access_token) {
            anotherUserToken = regResponse.data.access_token;
          } else if (regResponse.session) {
            anotherUserToken = regResponse.session.access_token;
          }
          
          cy.apiRequest({
            method: 'DELETE',
            url: `/items/${createdItem.id}`,
            auth: { bearer: anotherUserToken as string }
          }).then((response) => {
            cy.validateStatusCode(response, 403);
            cy.validateErrorResponse(response, 'authorization');
          });
        }
      });
    });

    it('should return 404 for non-existent item', () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      cy.apiRequest({
        method: 'DELETE',
        url: `/items/${fakeUuid}`,
        auth: { bearer: authToken }
      }).then((response) => {
        cy.validateStatusCode(response, 404);
        cy.validateErrorResponse(response, 'not found');
      });
    });
  });

  describe('Performance Testing', () => {
    it('should handle item creation within performance thresholds', () => {
      const itemData = {
        ...validItemData[0],
        categoryId: testCategory.id,
        locationId: testLocation.id
      };

      cy.performanceTest('item_creation', () => {
        return cy.apiRequest({
          method: 'POST',
          url: '/items',
          body: itemData,
          auth: { bearer: authToken }
        });
      }, 2000);
    });

    it('should handle item retrieval within performance thresholds', () => {
      // First create an item
      const itemData = {
        ...validItemData[1],
        categoryId: testCategory.id,
        locationId: testLocation.id
      };

      cy.apiRequest({
        method: 'POST',
        url: '/items',
        body: itemData,
        auth: { bearer: authToken }
      }).then((createResponse) => {
        const itemId = createResponse.body.data.id;

        cy.performanceTest('item_retrieval', () => {
          return cy.apiRequest({
            method: 'GET',
            url: `/items/${itemId}`
          });
        }, 1000);
      });
    });
  });
});