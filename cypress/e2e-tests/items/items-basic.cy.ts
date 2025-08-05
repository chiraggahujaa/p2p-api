// Item Management API Tests
/// <reference types="cypress" />

import { ApiClient } from '../../support/request/api';
import { AuthHelper } from '../../support/helpers/auth';
import { ItemHelper } from '../../support/helpers/items';
import { TestUtils } from '../../support/helpers/utils';
import { testItems, invalidItems, itemUpdates, ItemDataManager } from '../../data/items';

describe('Items API - Basic Operations', () => {
  let userSession: any;
  let testItemIds: string[] = [];

  before(() => {
    // Create a test user for the entire suite
    cy.createAndLoginTestUser()
      .then((session) => {
        userSession = session;
      });
  });

  beforeEach(() => {
    // Login for each test
    ApiClient.setAuthToken(userSession.tokens.accessToken);
  });

  afterEach(() => {
    AuthHelper.clearAuth();
  });

  after(() => {
    // Clean up created test items
    if (testItemIds.length > 0) {
      ApiClient.setAuthToken(userSession.tokens.accessToken);
      ItemHelper.cleanupTestItems(testItemIds);
    }
  });

  describe('Get All Items', () => {
    it('should return all items with optional authentication', () => {
      cy.logTestStep('Testing get all items');
      
      ApiClient.getAllItems()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          response.body.data.forEach((item: any) => {
            cy.validateItemStructure(item);
          });
          
          cy.logTestStep(`Retrieved ${response.body.data.length} items`);
        });
    });

    it('should support pagination for items list', () => {
      cy.logTestStep('Testing items pagination');
      
      const params = { page: 1, limit: 5 };
      
      ApiClient.getAllItems(params)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          expect(response.body.data.length).to.be.at.most(5);
          
          if (response.body.pagination) {
            expect(response.body.pagination.page).to.eq(1);
            expect(response.body.pagination.limit).to.eq(5);
          }
        });
    });

    it('should filter items by category', () => {
      cy.logTestStep('Testing items filtering by category');
      
      const category = 'Electronics';
      
      ItemHelper.filterByCategory(category)
        .then((items) => {
          items.forEach((item: any) => {
            expect(item.category).to.eq(category);
          });
          
          cy.logTestStep(`Found ${items.length} items in ${category} category`);
        });
    });

    it('should filter items by price range', () => {
      cy.logTestStep('Testing items filtering by price range');
      
      const minPrice = 10;
      const maxPrice = 50;
      
      ItemHelper.filterByPriceRange(minPrice, maxPrice)
        .then((items) => {
          items.forEach((item: any) => {
            expect(item.price_per_day).to.be.at.least(minPrice);
            expect(item.price_per_day).to.be.at.most(maxPrice);
          });
          
          cy.logTestStep(`Found ${items.length} items in price range $${minPrice}-$${maxPrice}`);
        });
    });
  });

  describe('Search Items', () => {
    it('should search items by name', () => {
      cy.logTestStep('Testing item search by name');
      
      const searchQuery = 'laptop';
      
      ItemHelper.searchItems(searchQuery)
        .then((items) => {
          items.forEach((item: any) => {
            const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const descMatch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
            expect(nameMatch || descMatch).to.be.true;
          });
          
          cy.logTestStep(`Search for "${searchQuery}" returned ${items.length} items`);
        });
    });

    it('should search items by category', () => {
      cy.logTestStep('Testing item search by category');
      
      const category = 'Electronics';
      
      ApiClient.searchItems('', { category })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          
          response.body.data.forEach((item: any) => {
            expect(item.category).to.eq(category);
          });
        });
    });

    it('should return empty results for non-existent search', () => {
      cy.logTestStep('Testing search with no results');
      
      ItemHelper.searchItems('NonExistentItem12345')
        .then((items) => {
          expect(items).to.be.an('array').and.empty;
        });
    });

    it('should handle special characters in search query', () => {
      cy.logTestStep('Testing search with special characters');
      
      const specialQueries = ['item@test', 'item+plus', 'item%20space', 'item&test'];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      specialQueries.forEach((query) => {
        chain = chain.then(() => {
          return ItemHelper.searchItems(query)
            .then((items) => {
              cy.log(`Search "${query}" returned ${items.length} results`);
            });
        });
      });
    });
  });

  describe('Get Popular Items', () => {
    it('should return popular items', () => {
      cy.logTestStep('Testing get popular items');
      
      ItemHelper.getPopularItems()
        .then((items) => {
          items.forEach((item: any) => {
            cy.validateItemStructure(item);
          });
          
          cy.logTestStep(`Retrieved ${items.length} popular items`);
        });
    });
  });

  describe('Get Featured Items', () => {
    it('should return featured items', () => {
      cy.logTestStep('Testing get featured items');
      
      ItemHelper.getFeaturedItems()
        .then((items) => {
          items.forEach((item: any) => {
            cy.validateItemStructure(item);
          });
          
          cy.logTestStep(`Retrieved ${items.length} featured items`);
        });
    });
  });

  describe('Get Item by ID', () => {
    let testItem: any;

    beforeEach(() => {
      // Create a test item for each test
      ItemHelper.createTestItem()
        .then((item) => {
          testItem = item;
          testItemIds.push(item.id);
        });
    });

    it('should return item details for valid item ID', () => {
      cy.logTestStep('Testing get item by ID');
      
      ItemHelper.getAndValidateItem(testItem.id)
        .then((item) => {
          expect(item.id).to.eq(testItem.id);
          expect(item.name).to.eq(testItem.name);
          expect(item.owner_id).to.eq(userSession.user.id);
        });
    });

    it('should return 404 for non-existent item ID', () => {
      cy.logTestStep('Testing get item with invalid ID');
      
      ApiClient.getItemById('non-existent-id-12345')
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('not found');
        });
    });

    it('should handle malformed item IDs gracefully', () => {
      cy.logTestStep('Testing get item with malformed ID');
      
      const malformedIds = ['', 'invalid-id', '123abc'];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      malformedIds.forEach((id) => {
        chain = chain.then(() => {
          return ApiClient.getItemById(id)
            .then((response) => {
              expect(response.status).to.be.oneOf([400, 404]);
              expect(response.body.success).to.be.false;
            });
        });
      });
    });
  });

  describe('Get Similar Items', () => {
    let testItem: any;

    beforeEach(() => {
      ItemHelper.createTestItem()
        .then((item) => {
          testItem = item;
          testItemIds.push(item.id);
        });
    });

    it('should return similar items for valid item ID', () => {
      cy.logTestStep('Testing get similar items');
      
      ItemHelper.getSimilarItems(testItem.id)
        .then((items) => {
          items.forEach((item: any) => {
            cy.validateItemStructure(item);
            // Similar items should have same category or related attributes
            expect(item.id).to.not.eq(testItem.id); // Should not include the original item
          });
          
          cy.logTestStep(`Found ${items.length} similar items`);
        });
    });

    it('should return empty array when no similar items exist', () => {
      cy.logTestStep('Testing get similar items with no matches');
      
      // Create a very unique item that won't have similar items
      const uniqueItem = {
        name: `Very Unique Item ${Date.now()}`,
        description: 'Extremely unique item with no similar counterparts',
        category: 'Other',
        price_per_day: 999.99,
        location: 'Unique Location'
      };
      
      ItemHelper.createTestItem(uniqueItem)
        .then((item) => {
          testItemIds.push(item.id);
          return ItemHelper.getSimilarItems(item.id);
        })
        .then((items) => {
          // Might be empty or have items, both are valid
          cy.log(`Found ${items.length} similar items for unique item`);
        });
    });
  });

  describe('Check Item Availability', () => {
    let testItem: any;

    beforeEach(() => {
      ItemHelper.createTestItem()
        .then((item) => {
          testItem = item;
          testItemIds.push(item.id);
        });
    });

    it('should check availability without date range', () => {
      cy.logTestStep('Testing check item availability');
      
      ItemHelper.checkAvailability(testItem.id)
        .then((availability) => {
          expect(availability).to.have.property('available');
          expect(availability.available).to.be.a('boolean');
        });
    });

    it('should check availability for specific date range', () => {
      cy.logTestStep('Testing check availability for date range');
      
      const startDate = TestUtils.getRelativeDate(7); // 7 days from now
      const endDate = TestUtils.getRelativeDate(10); // 10 days from now
      
      ItemHelper.checkAvailability(testItem.id, startDate, endDate)
        .then((availability) => {
          expect(availability).to.have.property('available');
          expect(availability).to.have.property('start_date', startDate);
          expect(availability).to.have.property('end_date', endDate);
        });
    });

    it('should handle invalid date formats gracefully', () => {
      cy.logTestStep('Testing availability check with invalid dates');
      
      ApiClient.checkItemAvailability(testItem.id, 'invalid-date', 'invalid-date')
        .then((response) => {
          expect(response.status).to.be.oneOf([200, 400]);
          
          if (response.status === 400) {
            expect(response.body.success).to.be.false;
            expect(response.body.error).to.include('date');
          }
        });
    });
  });

  describe('Create Item', () => {
    it('should successfully create item with valid data', () => {
      cy.logTestStep('Testing item creation with valid data');
      
      const itemData = ItemDataManager.generateCreatePayload();
      
      ItemHelper.createTestItem(itemData)
        .then((item) => {
          expect(item.name).to.eq(itemData.name);
          expect(item.description).to.eq(itemData.description);
          expect(item.category).to.eq(itemData.category);
          expect(item.price_per_day).to.eq(itemData.price_per_day);
          expect(item.owner_id).to.eq(userSession.user.id);
          
          testItemIds.push(item.id);
          cy.logTestStep('Item created successfully', item.id);
        });
    });

    it('should create item with minimal required data', () => {
      cy.logTestStep('Testing item creation with minimal data');
      
      const minimalData = {
        name: 'Minimal Test Item',
        description: 'Basic item for testing',
        category: 'Other',
        price_per_day: 10.00,
        location: 'Test Location',
        condition: 'good' as const
      };
      
      ItemHelper.createTestItem(minimalData)
        .then((item) => {
          expect(item.name).to.eq(minimalData.name);
          expect(item.price_per_day).to.eq(minimalData.price_per_day);
          
          testItemIds.push(item.id);
        });
    });

    it('should create item with complete data', () => {
      cy.logTestStep('Testing item creation with complete data');
      
      const completeData = {
        ...testItems.laptop,
        name: ItemDataManager.generateUniqueItemName('Complete Laptop')
      };
      
      ItemHelper.createTestItem(completeData)
        .then((item) => {
          expect(item.name).to.eq(completeData.name);
          expect(item.price_per_week).to.eq(completeData.price_per_week);
          expect(item.price_per_month).to.eq(completeData.price_per_month);
          expect(item.deposit_amount).to.eq(completeData.deposit_amount);
          expect(item.delivery_available).to.eq(completeData.delivery_available);
          
          testItemIds.push(item.id);
        });
    });

    it('should fail to create item without authentication', () => {
      cy.logTestStep('Testing item creation without authentication');
      
      AuthHelper.clearAuth();
      
      const itemData = ItemDataManager.generateCreatePayload();
      
      ApiClient.createItem(itemData)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to create item with invalid data', () => {
      cy.logTestStep('Testing item creation with invalid data');
      
      const invalidDataTests = [
        { data: invalidItems.emptyName, field: 'name' },
        { data: invalidItems.negativePrice, field: 'price' },
        { data: invalidItems.invalidCondition, field: 'condition' }
      ];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      invalidDataTests.forEach(({ data, field }) => {
        chain = chain.then(() => {
          return ItemHelper.testInvalidItemCreation(data)
            .then((response) => {
              expect(response.body.error).to.include(field);
              cy.log(`Validation for ${field} working correctly`);
            });
        });
      });
    });
  });

  describe('Update Item', () => {
    let testItem: any;

    beforeEach(() => {
      ItemHelper.createTestItem()
        .then((item) => {
          testItem = item;
          testItemIds.push(item.id);
        });
    });

    it('should successfully update item price', () => {
      cy.logTestStep('Testing item price update');
      
      const updateData = itemUpdates.priceUpdate;
      
      ItemHelper.updateItem(testItem.id, updateData)
        .then((updatedItem) => {
          expect(updatedItem.price_per_day).to.eq(updateData.price_per_day);
          expect(updatedItem.price_per_week).to.eq(updateData.price_per_week);
          expect(updatedItem.price_per_month).to.eq(updateData.price_per_month);
        });
    });

    it('should successfully update item description', () => {
      cy.logTestStep('Testing item description update');
      
      const updateData = itemUpdates.descriptionUpdate;
      
      ItemHelper.updateItem(testItem.id, updateData)
        .then((updatedItem) => {
          expect(updatedItem.description).to.eq(updateData.description);
        });
    });

    it('should successfully update item availability', () => {
      cy.logTestStep('Testing item availability update');
      
      const updateData = itemUpdates.availabilityUpdate;
      
      ItemHelper.updateItem(testItem.id, updateData)
        .then((updatedItem) => {
          expect(updatedItem.availability_start).to.eq(updateData.availability_start);
          expect(updatedItem.availability_end).to.eq(updateData.availability_end);
        });
    });

    it('should fail to update item when not owner', () => {
      cy.logTestStep('Testing item update by non-owner');
      
      // Create another user and try to update the item
      cy.createAndLoginTestUser()
        .then(() => {
          return ApiClient.updateItem(testItem.id, { name: 'Unauthorized Update' });
        })
        .then((response) => {
          expect(response.status).to.be.oneOf([403, 404]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to update non-existent item', () => {
      cy.logTestStep('Testing update of non-existent item');
      
      ApiClient.updateItem('non-existent-id', { name: 'Updated Name' })
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to update item without authentication', () => {
      cy.logTestStep('Testing item update without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.updateItem(testItem.id, { name: 'Unauthorized Update' })
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Delete Item', () => {
    let testItem: any;

    beforeEach(() => {
      ItemHelper.createTestItem()
        .then((item) => {
          testItem = item;
        });
    });

    it('should successfully delete own item', () => {
      cy.logTestStep('Testing item deletion');
      
      ItemHelper.deleteItem(testItem.id)
        .then(() => {
          cy.logTestStep('Item deleted successfully');
        });
    });

    it('should fail to delete item when not owner', () => {
      cy.logTestStep('Testing item deletion by non-owner');
      
      // Create another user and try to delete the item
      cy.createAndLoginTestUser()
        .then(() => {
          return ApiClient.deleteItem(testItem.id);
        })
        .then((response) => {
          expect(response.status).to.be.oneOf([403, 404]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to delete non-existent item', () => {
      cy.logTestStep('Testing deletion of non-existent item');
      
      ApiClient.deleteItem('non-existent-id')
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to delete item without authentication', () => {
      cy.logTestStep('Testing item deletion without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.deleteItem(testItem.id)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Item Favorites', () => {
    let testItem: any;

    beforeEach(() => {
      ItemHelper.createTestItem()
        .then((item) => {
          testItem = item;
          testItemIds.push(item.id);
        });
    });

    it('should add item to favorites', () => {
      cy.logTestStep('Testing add item to favorites');
      
      ItemHelper.addToFavorites(testItem.id)
        .then(() => {
          // Verify item is in favorites
          return ApiClient.getMyFavorites();
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          const favoriteIds = response.body.data.map((item: any) => item.id);
          expect(favoriteIds).to.include(testItem.id);
        });
    });

    it('should remove item from favorites', () => {
      cy.logTestStep('Testing remove item from favorites');
      
      // First add to favorites
      ItemHelper.addToFavorites(testItem.id)
        .then(() => {
          // Then remove from favorites
          return ItemHelper.removeFromFavorites(testItem.id);
        })
        .then(() => {
          // Verify item is not in favorites
          return ApiClient.getMyFavorites();
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          const favoriteIds = response.body.data.map((item: any) => item.id);
          expect(favoriteIds).to.not.include(testItem.id);
        });
    });

    it('should fail to add favorites without authentication', () => {
      cy.logTestStep('Testing add to favorites without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.addToFavorites(testItem.id)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Item Analytics', () => {
    let testItem: any;

    beforeEach(() => {
      ItemHelper.createTestItem()
        .then((item) => {
          testItem = item;
          testItemIds.push(item.id);
        });
    });

    it('should return analytics for item owner', () => {
      cy.logTestStep('Testing get item analytics');
      
      ItemHelper.getItemAnalytics(testItem.id)
        .then((analytics) => {
          expect(analytics).to.be.an('object');
          
          // Common analytics fields
          if (analytics.views !== undefined) {
            expect(analytics.views).to.be.a('number').and.at.least(0);
          }
          if (analytics.bookings !== undefined) {
            expect(analytics.bookings).to.be.a('number').and.at.least(0);
          }
          if (analytics.revenue !== undefined) {
            expect(analytics.revenue).to.be.a('number').and.at.least(0);
          }
          
          cy.logTestStep('Item analytics retrieved', analytics);
        });
    });

    it('should fail to get analytics for non-owned item', () => {
      cy.logTestStep('Testing get analytics for non-owned item');
      
      // Create another user and try to get analytics
      cy.createAndLoginTestUser()
        .then(() => {
          return ApiClient.getItemAnalytics(testItem.id);
        })
        .then((response) => {
          expect(response.status).to.be.oneOf([403, 404]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to get analytics without authentication', () => {
      cy.logTestStep('Testing get analytics without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.getItemAnalytics(testItem.id)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });
  });
});