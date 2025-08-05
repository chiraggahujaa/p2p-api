// Item management helper functions
/// <reference types="cypress" />

import { ApiClient } from '../request/api';
import { testItems, TestItem, ItemDataManager, searchCriteria } from '../../data/items';

export class ItemHelper {
  /**
   * Create a new test item
   */
  static createTestItem(itemData?: Partial<TestItem>): Cypress.Chainable<any> {
    const createPayload = ItemDataManager.generateCreatePayload(itemData);
    
    return ApiClient.createItem(createPayload)
      .then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('id');
        
        const createdItem = response.body.data;
        cy.log(`Created test item: ${createdItem.name} (ID: ${createdItem.id})`);
        
        return createdItem;
      });
  }

  /**
   * Create multiple test items
   */
  static createMultipleTestItems(count: number = 3): Cypress.Chainable<any[]> {
    const itemPromises: Cypress.Chainable<any>[] = [];
    
    for (let i = 0; i < count; i++) {
      const itemData = {
        name: ItemDataManager.generateUniqueItemName(`Test Item ${i + 1}`),
        category: ItemDataManager.getRandomCategory(),
        price_per_day: Math.floor(Math.random() * 50) + 10
      };
      
      itemPromises.push(this.createTestItem(itemData));
    }
    
    return cy.wrap(Promise.all(itemPromises));
  }

  /**
   * Get item by ID and validate structure
   */
  static getAndValidateItem(itemId: string): Cypress.Chainable<any> {
    return ApiClient.getItemById(itemId)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        const item = response.body.data;
        expect(ItemDataManager.validateItemStructure(item)).to.be.true;
        
        return item;
      });
  }

  /**
   * Update item and verify changes
   */
  static updateItem(itemId: string, updateData: any): Cypress.Chainable<any> {
    return ApiClient.updateItem(itemId, updateData)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        const updatedItem = response.body.data;
        
        // Verify updates were applied
        Object.keys(updateData).forEach(key => {
          expect(updatedItem).to.have.property(key, updateData[key]);
        });
        
        cy.log(`Updated item ${itemId}:`, JSON.stringify(updateData));
        return updatedItem;
      });
  }

  /**
   * Delete item and verify deletion
   */
  static deleteItem(itemId: string): Cypress.Chainable<any> {
    return ApiClient.deleteItem(itemId)
      .then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
        expect(response.body.success).to.be.true;
        
        cy.log(`Deleted item: ${itemId}`);
        
        // Verify item is deleted by trying to fetch it
        return ApiClient.getItemById(itemId);
      })
      .then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
      });
  }

  /**
   * Search items and validate results
   */
  static searchItems(query: string, expectedMinResults: number = 0): Cypress.Chainable<any[]> {
    return ApiClient.searchItems(query)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        
        if (expectedMinResults > 0) {
          expect(response.body.data.length).to.be.at.least(expectedMinResults);
        }
        
        // Validate each item in results
        response.body.data.forEach((item: any) => {
          expect(ItemDataManager.validateItemStructure(item)).to.be.true;
        });
        
        cy.log(`Search for "${query}" returned ${response.body.data.length} items`);
        return response.body.data;
      });
  }

  /**
   * Get popular items
   */
  static getPopularItems(): Cypress.Chainable<any[]> {
    return ApiClient.getPopularItems()
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        
        response.body.data.forEach((item: any) => {
          expect(ItemDataManager.validateItemStructure(item)).to.be.true;
        });
        
        return response.body.data;
      });
  }

  /**
   * Get featured items
   */
  static getFeaturedItems(): Cypress.Chainable<any[]> {
    return ApiClient.getFeaturedItems()
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        
        return response.body.data;
      });
  }

  /**
   * Check item availability
   */
  static checkAvailability(itemId: string, startDate?: string, endDate?: string): Cypress.Chainable<any> {
    return ApiClient.checkItemAvailability(itemId, startDate, endDate)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('available');
        
        return response.body.data;
      });
  }

  /**
   * Add item to favorites
   */
  static addToFavorites(itemId: string): Cypress.Chainable<any> {
    return ApiClient.addToFavorites(itemId)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        cy.log(`Added item ${itemId} to favorites`);
      });
  }

  /**
   * Remove item from favorites
   */
  static removeFromFavorites(itemId: string): Cypress.Chainable<any> {
    return ApiClient.removeFromFavorites(itemId)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        cy.log(`Removed item ${itemId} from favorites`);
      });
  }

  /**
   * Get similar items
   */
  static getSimilarItems(itemId: string): Cypress.Chainable<any[]> {
    return ApiClient.getSimilarItems(itemId)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        
        return response.body.data;
      });
  }

  /**
   * Get item analytics (for item owners)
   */
  static getItemAnalytics(itemId: string): Cypress.Chainable<any> {
    return ApiClient.getItemAnalytics(itemId)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('object');
        
        return response.body.data;
      });
  }

  /**
   * Test item creation validation
   */
  static testInvalidItemCreation(invalidData: any): Cypress.Chainable<any> {
    return ApiClient.createItem(invalidData)
      .then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
        expect(response.body.success).to.be.false;
        expect(response.body).to.have.property('error');
        
        return response;
      });
  }

  /**
   * Create item with predefined test data
   */
  static createPredefinedItem(itemKey: keyof typeof testItems): Cypress.Chainable<any> {
    const itemData = testItems[itemKey];
    return this.createTestItem(itemData);
  }

  /**
   * Test search functionality with various criteria
   */
  static testSearchFunctionality(): Cypress.Chainable<any> {
    const tests = [
      { query: searchCriteria.byName, description: 'search by name' },
      { query: searchCriteria.byCategory, description: 'search by category' },
      { query: searchCriteria.byLocation, description: 'search by location' },
      { query: searchCriteria.noResults, description: 'search with no results' }
    ];
    
    return cy.wrap(tests).each((test: any) => {
      cy.log(`Testing ${test.description}`);
      return this.searchItems(test.query);
    });
  }

  /**
   * Filter items by category
   */
  static filterByCategory(category: string): Cypress.Chainable<any[]> {
    return ApiClient.searchItems('', { category })
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        // Verify all items belong to the specified category
        response.body.data.forEach((item: any) => {
          expect(item.category).to.eq(category);
        });
        
        return response.body.data;
      });
  }

  /**
   * Filter items by price range
   */
  static filterByPriceRange(minPrice?: number, maxPrice?: number): Cypress.Chainable<any[]> {
    const params: any = {};
    if (minPrice !== undefined) params.min_price = minPrice;
    if (maxPrice !== undefined) params.max_price = maxPrice;
    
    return ApiClient.searchItems('', params)
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        // Verify all items are within price range
        response.body.data.forEach((item: any) => {
          if (minPrice !== undefined) {
            expect(item.price_per_day).to.be.at.least(minPrice);
          }
          if (maxPrice !== undefined) {
            expect(item.price_per_day).to.be.at.most(maxPrice);
          }
        });
        
        return response.body.data;
      });
  }

  /**
   * Verify item ownership
   */
  static verifyItemOwnership(itemId: string, expectedOwnerId: string): Cypress.Chainable<void> {
    return this.getAndValidateItem(itemId)
      .then((item) => {
        expect(item.owner_id).to.eq(expectedOwnerId);
        cy.log(`Verified item ${itemId} is owned by user ${expectedOwnerId}`);
      });
  }

  /**
   * Clean up test items
   */
  static cleanupTestItems(itemIds: string[]): Cypress.Chainable<any> {
    return cy.wrap(itemIds).each((itemId: string) => {
      return ApiClient.deleteItem(itemId)
        .then((response) => {
          if (response.status === 200 || response.status === 204) {
            cy.log(`Cleaned up item: ${itemId}`);
          } else {
            cy.log(`Failed to cleanup item ${itemId}: status ${response.status}`);
          }
        });
    });
  }

  /**
   * Generate items for testing pagination
   */
  static generateItemsForPagination(count: number = 20): Cypress.Chainable<any[]> {
    const batchSize = 5;
    const batches = Math.ceil(count / batchSize);
    const allItems: any[] = [];
    
    for (let i = 0; i < batches; i++) {
      const batchCount = Math.min(batchSize, count - i * batchSize);
      this.createMultipleTestItems(batchCount)
        .then((items) => {
          allItems.push(...items);
        });
    }
    
    return cy.wrap(allItems);
  }

  /**
   * Test item image upload (if supported)
   */
  static testItemImageUpload(itemId: string, imagePath?: string): Cypress.Chainable<any> {
    // This would be implemented if the API supports image upload
    // For now, just a placeholder
    return cy.wrap(null).then(() => {
      cy.log('Image upload test not implemented yet');
      return null;
    });
  }
}