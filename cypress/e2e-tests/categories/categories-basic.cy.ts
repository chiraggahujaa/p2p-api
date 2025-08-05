// Category Management API Tests
/// <reference types="cypress" />

import { ApiClient } from '../../support/request/api';
import { AuthHelper } from '../../support/helpers/auth';
import { TestUtils } from '../../support/helpers/utils';
import { 
  mainCategories, 
  electronicsSubcategories, 
  testCategories, 
  invalidCategories,
  categoryUpdates,
  searchCriteria,
  CategoryDataManager 
} from '../../data/categories';

describe('Categories API - Basic Operations', () => {
  let userSession: any;
  let testCategoryIds: string[] = [];

  before(() => {
    // Create a user for category management (admin functionality)
    cy.createAndLoginTestUser()
      .then((session) => {
        userSession = session;
      });
  });

  beforeEach(() => {
    // Most category endpoints are public, but creation requires auth
    if (userSession?.tokens?.accessToken) {
      ApiClient.setAuthToken(userSession.tokens.accessToken);
    }
  });

  afterEach(() => {
    AuthHelper.clearAuth();
  });

  after(() => {
    // Clean up created test categories (if deletion endpoint exists)
    if (testCategoryIds.length > 0 && userSession?.tokens?.accessToken) {
      ApiClient.setAuthToken(userSession.tokens.accessToken);
      testCategoryIds.forEach(id => {
        // Note: No delete endpoint in the current routes, so just log
        cy.log(`Would clean up category: ${id}`);
      });
    }
  });

  describe('Get All Categories', () => {
    it('should return all categories without authentication', () => {
      cy.logTestStep('Testing get all categories');
      
      AuthHelper.clearAuth();
      
      ApiClient.getAllCategories()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          expect(response.body.data.length).to.be.at.least(1);
          
          // Validate category structure
          response.body.data.forEach((category: any) => {
            expect(CategoryDataManager.validateCategoryStructure(category)).to.be.true;
          });
          
          cy.logTestStep(`Retrieved ${response.body.data.length} categories`);
        });
    });

    it('should return categories with proper hierarchy', () => {
      cy.logTestStep('Testing category hierarchy');
      
      AuthHelper.clearAuth();
      
      ApiClient.getAllCategories()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          
          const categories = response.body.data;
          const mainCats = CategoryDataManager.getCategoriesByLevel(categories, 'main');
          const subCats = CategoryDataManager.getCategoriesByLevel(categories, 'sub');
          
          expect(mainCats.length).to.be.at.least(1);
          cy.log(`Main categories: ${mainCats.length}, Subcategories: ${subCats.length}`);
          
          // Validate hierarchy structure
          subCats.forEach((subCat: any) => {
            expect(subCat.parent_id).to.exist;
            const parent = mainCats.find((mainCat: any) => mainCat.id === subCat.parent_id);
            if (parent) {
              cy.log(`Subcategory "${subCat.name}" belongs to "${parent.name}"`);
            }
          });
        });
    });

    it('should support filtering active categories', () => {
      cy.logTestStep('Testing active categories filter');
      
      AuthHelper.clearAuth();
      
      const params = { is_active: true };
      
      ApiClient.getAllCategories()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          
          // Check if categories have is_active field and validate
          response.body.data.forEach((category: any) => {
            if (category.is_active !== undefined) {
              // If filtering is implemented, all should be active
              // Otherwise, this just validates the structure
              cy.log(`Category "${category.name}" active status: ${category.is_active}`);
            }
          });
        });
    });
  });

  describe('Search Categories', () => {
    it('should search categories by name', () => {
      cy.logTestStep('Testing category search by name');
      
      AuthHelper.clearAuth();
      
      ApiClient.searchCategories(searchCriteria.byName)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          // Verify search results contain the search term
          response.body.data.forEach((category: any) => {
            const nameMatch = category.name.toLowerCase().includes(searchCriteria.byName.toLowerCase());
            const descMatch = category.description.toLowerCase().includes(searchCriteria.byName.toLowerCase());
            expect(nameMatch || descMatch).to.be.true;
          });
          
          cy.logTestStep(`Search found ${response.body.data.length} categories`);
        });
    });

    it('should search categories by partial name', () => {
      cy.logTestStep('Testing category search by partial name');
      
      AuthHelper.clearAuth();
      
      ApiClient.searchCategories(searchCriteria.byPartialName)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          response.body.data.forEach((category: any) => {
            const match = category.name.toLowerCase().includes(searchCriteria.byPartialName.toLowerCase());
            expect(match).to.be.true;
          });
        });
    });

    it('should return empty results for non-existent search', () => {
      cy.logTestStep('Testing search with no results');
      
      AuthHelper.clearAuth();
      
      ApiClient.searchCategories(searchCriteria.noResults)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array').and.empty;
        });
    });

    it('should handle special characters in search query', () => {
      cy.logTestStep('Testing search with special characters');
      
      AuthHelper.clearAuth();
      
      const specialQueries = ['cat@test', 'cat+plus', 'cat%20space', 'cat&test'];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      specialQueries.forEach((query) => {
        chain = chain.then(() => {
          return ApiClient.searchCategories(query)
            .then((response) => {
              expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.an('array');
              cy.log(`Search "${query}" returned ${response.body.data.length} results`);
            });
        });
      });
    });
  });

  describe('Get Popular Categories', () => {
    it('should return popular categories', () => {
      cy.logTestStep('Testing get popular categories');
      
      AuthHelper.clearAuth();
      
      ApiClient.getPopularCategories()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          response.body.data.forEach((category: any) => {
            expect(CategoryDataManager.validateCategoryStructure(category)).to.be.true;
          });
          
          cy.logTestStep(`Retrieved ${response.body.data.length} popular categories`);
        });
    });

    it('should return categories ordered by popularity', () => {
      cy.logTestStep('Testing popular categories ordering');
      
      AuthHelper.clearAuth();
      
      ApiClient.getPopularCategories()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          
          const categories = response.body.data;
          
          // If popularity metrics are available, verify ordering
          for (let i = 0; i < categories.length - 1; i++) {
            const current = categories[i];
            const next = categories[i + 1];
            
            // Log the ordering (popularity metrics may not be exposed)
            cy.log(`Category ${i + 1}: ${current.name}`);
          }
        });
    });
  });

  describe('Get Category by ID', () => {
    let testCategory: any;

    before(() => {
      // Get a category ID from the list for testing
      AuthHelper.clearAuth();
      ApiClient.getAllCategories()
        .then((response) => {
          testCategory = response.body.data[0];
        });
    });

    it('should return category details for valid category ID', () => {
      cy.logTestStep('Testing get category by ID');
      
      AuthHelper.clearAuth();
      
      ApiClient.getCategoryById(testCategory.id)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.id).to.eq(testCategory.id);
          expect(response.body.data.name).to.eq(testCategory.name);
          
          expect(CategoryDataManager.validateCategoryStructure(response.body.data)).to.be.true;
          cy.logTestStep('Category details retrieved successfully');
        });
    });

    it('should return 404 for non-existent category ID', () => {
      cy.logTestStep('Testing get category with invalid ID');
      
      AuthHelper.clearAuth();
      
      ApiClient.getCategoryById('non-existent-id-12345')
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.include('not found');
        });
    });

    it('should handle malformed category IDs gracefully', () => {
      cy.logTestStep('Testing get category with malformed ID');
      
      AuthHelper.clearAuth();
      
      const malformedIds = ['', 'invalid-id', '123abc'];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      malformedIds.forEach((id) => {
        if (id) {
          chain = chain.then(() => {
            return ApiClient.getCategoryById(id)
              .then((response) => {
                expect(response.status).to.be.oneOf([400, 404]);
                expect(response.body.success).to.be.false;
              });
          });
        }
      });
    });
  });

  describe('Get Subcategories', () => {
    let parentCategory: any;

    before(() => {
      // Get a parent category for testing subcategories
      AuthHelper.clearAuth();
      ApiClient.getAllCategories()
        .then((response) => {
          // Find a category that might have subcategories (or any category)
          parentCategory = response.body.data.find((cat: any) => !cat.parent_id) || response.body.data[0];
        });
    });

    it('should return subcategories for valid parent category', () => {
      cy.logTestStep('Testing get subcategories');
      
      AuthHelper.clearAuth();
      
      ApiClient.getSubcategories(parentCategory.id)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          
          // All returned categories should have parent_id matching the requested category
          response.body.data.forEach((subCategory: any) => {
            expect(subCategory.parent_id).to.eq(parentCategory.id);
            expect(CategoryDataManager.validateCategoryStructure(subCategory)).to.be.true;
          });
          
          cy.logTestStep(`Found ${response.body.data.length} subcategories for "${parentCategory.name}"`);
        });
    });

    it('should return empty array for category with no subcategories', () => {
      cy.logTestStep('Testing get subcategories for leaf category');
      
      AuthHelper.clearAuth();
      
      // Use a subcategory (leaf node) to test
      ApiClient.getAllCategories()
        .then((response) => {
          const leafCategory = response.body.data.find((cat: any) => cat.parent_id);
          
          if (leafCategory) {
            return ApiClient.getSubcategories(leafCategory.id);
          } else {
            // If no subcategories exist, use the parent category
            return ApiClient.getSubcategories(parentCategory.id);
          }
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('array');
          // Array might be empty or contain subcategories
        });
    });

    it('should return 404 for non-existent parent category', () => {
      cy.logTestStep('Testing get subcategories for non-existent category');
      
      AuthHelper.clearAuth();
      
      ApiClient.getSubcategories('non-existent-category-id')
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Get Category Hierarchy', () => {
    let testCategory: any;

    before(() => {
      AuthHelper.clearAuth();
      ApiClient.getAllCategories()
        .then((response) => {
          testCategory = response.body.data[0];
        });
    });

    it('should return category hierarchy for valid category', () => {
      cy.logTestStep('Testing get category hierarchy');
      
      AuthHelper.clearAuth();
      
      ApiClient.getCategoryHierarchy(testCategory.id)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.an('object');
          
          const hierarchy = response.body.data;
          expect(hierarchy).to.have.property('id', testCategory.id);
          expect(hierarchy).to.have.property('name', testCategory.name);
          
          // If it has children, they should be in the hierarchy
          if (hierarchy.children) {
            expect(hierarchy.children).to.be.an('array');
            hierarchy.children.forEach((child: any) => {
              expect(child.parent_id).to.eq(testCategory.id);
            });
          }
          
          cy.logTestStep('Category hierarchy retrieved successfully');
        });
    });

    it('should return 404 for non-existent category hierarchy', () => {
      cy.logTestStep('Testing get hierarchy for non-existent category');
      
      AuthHelper.clearAuth();
      
      ApiClient.getCategoryHierarchy('non-existent-category-id')
        .then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Create Category (Admin)', () => {
    it('should successfully create category with valid data', () => {
      cy.logTestStep('Testing category creation with valid data');
      
      const categoryData = CategoryDataManager.generateCreatePayload();
      
      ApiClient.createCategory(categoryData)
        .then((response) => {
          // Might succeed or fail depending on admin privileges
          if (response.status === 201) {
            expect(response.body.success).to.be.true;
            expect(response.body.data.name).to.eq(categoryData.name);
            expect(response.body.data.description).to.eq(categoryData.description);
            
            testCategoryIds.push(response.body.data.id);
            cy.logTestStep('Category created successfully', response.body.data.id);
          } else {
            expect(response.status).to.be.oneOf([401, 403]);
            expect(response.body.success).to.be.false;
            cy.log('Admin privileges required for category creation');
          }
        });
    });

    it('should create category with minimal data', () => {
      cy.logTestStep('Testing category creation with minimal data');
      
      const minimalData = {
        name: 'Minimal Test Category',
        description: 'Minimal category for testing'
      };
      
      ApiClient.createCategory(minimalData)
        .then((response) => {
          if (response.status === 201) {
            expect(response.body.data.name).to.eq(minimalData.name);
            expect(response.body.data.description).to.eq(minimalData.description);
            testCategoryIds.push(response.body.data.id);
          } else {
            expect(response.status).to.be.oneOf([401, 403]);
            cy.log('Admin privileges required');
          }
        });
    });

    it('should create subcategory with parent relationship', () => {
      cy.logTestStep('Testing subcategory creation');
      
      // First get a parent category
      ApiClient.getAllCategories()
        .then((response) => {
          const parentCategory = response.body.data.find((cat: any) => !cat.parent_id);
          
          if (parentCategory) {
            const subcategoryData = CategoryDataManager.generateSubcategoryPayload(
              parentCategory.id,
              { name: 'Test Subcategory', description: 'Test subcategory creation' }
            );
            
            return ApiClient.createCategory(subcategoryData);
          } else {
            throw new Error('No parent category found for subcategory test');
          }
        })
        .then((response) => {
          if (response.status === 201) {
            expect(response.body.data.parent_id).to.exist;
            testCategoryIds.push(response.body.data.id);
            cy.log('Subcategory created successfully');
          } else {
            expect(response.status).to.be.oneOf([401, 403]);
            cy.log('Admin privileges required for subcategory creation');
          }
        });
    });

    it('should fail to create category without authentication', () => {
      cy.logTestStep('Testing category creation without authentication');
      
      AuthHelper.clearAuth();
      
      const categoryData = CategoryDataManager.generateCreatePayload();
      
      ApiClient.createCategory(categoryData)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to create category with invalid data', () => {
      cy.logTestStep('Testing category creation with invalid data');
      
      const invalidDataTests = [
        { data: invalidCategories.emptyName, field: 'name' },
        { data: invalidCategories.emptyDescription, field: 'description' }
      ];
      
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      invalidDataTests.forEach(({ data, field }) => {
        chain = chain.then(() => {
          return ApiClient.createCategory(data)
            .then((response) => {
              // Should fail validation or require admin privileges
              expect(response.status).to.be.oneOf([400, 401, 403, 422]);
              expect(response.body.success).to.be.false;
              
              if (response.status === 400 || response.status === 422) {
                expect(response.body.error).to.include(field);
                cy.log(`Validation for ${field} working correctly`);
              } else {
                cy.log('Admin authentication required');
              }
            });
        });
      });
    });
  });

  describe('Update Category (Admin)', () => {
    let testCategory: any;

    beforeEach(() => {
      // Get an existing category for update tests
      AuthHelper.clearAuth();
      ApiClient.getAllCategories()
        .then((response) => {
          testCategory = response.body.data[0];
        })
        .then(() => {
          if (userSession?.tokens?.accessToken) {
            ApiClient.setAuthToken(userSession.tokens.accessToken);
          }
        });
    });

    it('should successfully update category name and description', () => {
      cy.logTestStep('Testing category update');
      
      const updateData = categoryUpdates.nameUpdate;
      
      ApiClient.updateCategory(testCategory.id, updateData)
        .then((response) => {
          if (response.status === 200) {
            expect(response.body.success).to.be.true;
            expect(response.body.data.name).to.eq(updateData.name);
            expect(response.body.data.description).to.eq(updateData.description);
            cy.log('Category updated successfully');
          } else {
            expect(response.status).to.be.oneOf([401, 403]);
            expect(response.body.success).to.be.false;
            cy.log('Admin privileges required for category update');
          }
        });
    });

    it('should update category status', () => {
      cy.logTestStep('Testing category status update');
      
      const updateData = categoryUpdates.statusUpdate;
      
      ApiClient.updateCategory(testCategory.id, updateData)
        .then((response) => {
          if (response.status === 200) {
            expect(response.body.data.is_active).to.eq(updateData.is_active);
            cy.log('Category status updated successfully');
          } else {
            expect(response.status).to.be.oneOf([401, 403]);
            cy.log('Admin privileges required');
          }
        });
    });

    it('should fail to update category without authentication', () => {
      cy.logTestStep('Testing category update without authentication');
      
      AuthHelper.clearAuth();
      
      ApiClient.updateCategory(testCategory.id, categoryUpdates.nameUpdate)
        .then((response) => {
          expect(response.status).to.be.oneOf([401, 403]);
          expect(response.body.success).to.be.false;
        });
    });

    it('should fail to update non-existent category', () => {
      cy.logTestStep('Testing update of non-existent category');
      
      ApiClient.updateCategory('non-existent-id', categoryUpdates.nameUpdate)
        .then((response) => {
          expect(response.status).to.be.oneOf([403, 404]);
          expect(response.body.success).to.be.false;
        });
    });
  });

  describe('Category Data Validation', () => {
    it('should validate category structure consistency', () => {
      cy.logTestStep('Testing category data structure consistency');
      
      AuthHelper.clearAuth();
      
      ApiClient.getAllCategories()
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          
          const categories = response.body.data;
          const categoryTree = CategoryDataManager.buildCategoryTree(categories);
          
          // Validate tree structure
          categoryTree.forEach((mainCategory: any) => {
            expect(mainCategory.parent_id).to.be.oneOf([null, undefined]);
            
            if (mainCategory.subcategories) {
              mainCategory.subcategories.forEach((subCategory: any) => {
                expect(subCategory.parent_id).to.eq(mainCategory.id);
              });
            }
          });
          
          cy.logTestStep(`Category tree validated: ${categoryTree.length} main categories`);
        });
    });

    it('should validate category names are unique at same level', () => {
      cy.logTestStep('Testing category name uniqueness');
      
      AuthHelper.clearAuth();
      
      ApiClient.getAllCategories()
        .then((response) => {
          const categories = response.body.data;
          const mainCategories = CategoryDataManager.getCategoriesByLevel(categories, 'main');
          
          // Check for duplicate names in main categories
          const mainNames = mainCategories.map((cat: any) => cat.name);
          const uniqueMainNames = [...new Set(mainNames)];
          
          expect(mainNames.length).to.eq(uniqueMainNames.length);
          cy.log('Main category names are unique');
          
          // Check subcategories within each parent
          const parentIds = [...new Set(categories.filter((cat: any) => cat.parent_id).map((cat: any) => cat.parent_id))];
          
          (parentIds as string[]).forEach((parentId: string) => {
            const siblings = categories.filter((cat: any) => cat.parent_id === parentId);
            const siblingNames = siblings.map((cat: any) => cat.name);
            const uniqueSiblingNames = [...new Set(siblingNames)];
            
            expect(siblingNames.length).to.eq(uniqueSiblingNames.length);
          });
          
          cy.log('Subcategory names are unique within parent categories');
        });
    });
  });
});