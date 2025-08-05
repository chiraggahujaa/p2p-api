// Centralized category data for all tests
export interface TestCategory {
  name: string;
  description: string;
  parent_id?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateCategoryPayload extends Omit<TestCategory, 'id' | 'created_at' | 'updated_at'> {}

// Main categories (top-level)
export const mainCategories = {
  electronics: {
    name: 'Electronics',
    description: 'Electronic devices, gadgets, and tech equipment',
    icon: 'electronics',
    color: '#3B82F6',
    is_active: true,
    display_order: 1
  } as TestCategory,

  sportsRecreation: {
    name: 'Sports & Recreation',
    description: 'Sports equipment, recreational gear, and outdoor activities',
    icon: 'sports',
    color: '#10B981',
    is_active: true,
    display_order: 2
  } as TestCategory,

  toolsEquipment: {
    name: 'Tools & Equipment',
    description: 'Professional tools, construction equipment, and machinery',
    icon: 'tools',
    color: '#F59E0B',
    is_active: true,
    display_order: 3
  } as TestCategory,

  homeGarden: {
    name: 'Home & Garden',
    description: 'Home improvement items, gardening tools, and household equipment',
    icon: 'home',
    color: '#8B5CF6',
    is_active: true,
    display_order: 4
  } as TestCategory,

  vehicles: {
    name: 'Vehicles',
    description: 'Cars, bikes, motorcycles, and transportation equipment',
    icon: 'vehicle',
    color: '#EF4444',
    is_active: true,
    display_order: 5
  } as TestCategory,

  fashionAccessories: {
    name: 'Fashion & Accessories',
    description: 'Clothing, jewelry, bags, and fashion accessories',
    icon: 'fashion',
    color: '#EC4899',
    is_active: true,
    display_order: 6
  } as TestCategory,

  booksMedia: {
    name: 'Books & Media',
    description: 'Books, movies, games, and educational materials',
    icon: 'book',
    color: '#06B6D4',
    is_active: true,
    display_order: 7
  } as TestCategory,

  toysGames: {
    name: 'Toys & Games',
    description: 'Children toys, board games, and entertainment items',
    icon: 'toys',
    color: '#84CC16',
    is_active: true,
    display_order: 8
  } as TestCategory,

  other: {
    name: 'Other',
    description: 'Miscellaneous items that don\'t fit other categories',
    icon: 'other',
    color: '#6B7280',
    is_active: true,
    display_order: 9
  } as TestCategory
} as const;

// Subcategories for Electronics
export const electronicsSubcategories = {
  computers: {
    name: 'Computers & Laptops',
    description: 'Desktop computers, laptops, and computer accessories',
    icon: 'computer',
    display_order: 1
  } as Omit<TestCategory, 'parent_id'>,

  cameras: {
    name: 'Cameras & Photography',
    description: 'Digital cameras, lenses, and photography equipment',
    icon: 'camera',
    display_order: 2
  } as Omit<TestCategory, 'parent_id'>,

  audio: {
    name: 'Audio Equipment',
    description: 'Speakers, headphones, microphones, and audio gear',
    icon: 'audio',
    display_order: 3
  } as Omit<TestCategory, 'parent_id'>,

  gaming: {
    name: 'Gaming',
    description: 'Gaming consoles, controllers, and gaming accessories',
    icon: 'gaming',
    display_order: 4
  } as Omit<TestCategory, 'parent_id'>,

  mobile: {
    name: 'Mobile & Tablets',
    description: 'Smartphones, tablets, and mobile accessories',
    icon: 'mobile',
    display_order: 5
  } as Omit<TestCategory, 'parent_id'>
} as const;

// Subcategories for Sports & Recreation
export const sportsSubcategories = {
  fitness: {
    name: 'Fitness Equipment',
    description: 'Gym equipment, weights, and fitness accessories',
    icon: 'fitness',
    display_order: 1
  } as Omit<TestCategory, 'parent_id'>,

  outdoorSports: {
    name: 'Outdoor Sports',
    description: 'Hiking, camping, and outdoor adventure gear',
    icon: 'outdoor',
    display_order: 2
  } as Omit<TestCategory, 'parent_id'>,

  waterSports: {
    name: 'Water Sports',
    description: 'Swimming, surfing, and water activity equipment',
    icon: 'water',
    display_order: 3
  } as Omit<TestCategory, 'parent_id'>,

  cycling: {
    name: 'Cycling',
    description: 'Bicycles, cycling gear, and accessories',
    icon: 'cycling',
    display_order: 4
  } as Omit<TestCategory, 'parent_id'>
} as const;

// Test categories for various scenarios
export const testCategories = {
  // New category for testing creation
  newCategory: {
    name: 'Test Category for E2E',
    description: 'This is a test category created during E2E testing',
    icon: 'test',
    color: '#FF6B6B',
    is_active: true,
    display_order: 100
  } as TestCategory,

  // Category with minimal data
  minimal: {
    name: 'Minimal Test Category',
    description: 'Minimal category for testing'
  } as TestCategory,

  // Category for update testing
  updateTest: {
    name: 'Category for Update Test',
    description: 'This category will be updated during testing',
    is_active: true
  } as TestCategory
} as const;

// Invalid category data for negative testing
export const invalidCategories = {
  emptyName: {
    name: '',
    description: 'Category with empty name'
  },

  longName: {
    name: 'A'.repeat(256), // Assuming 255 char limit
    description: 'Category with very long name'
  },

  emptyDescription: {
    name: 'Empty Description Category',
    description: ''
  },

  longDescription: {
    name: 'Long Description Category',
    description: 'X'.repeat(1001) // Assuming 1000 char limit
  },

  invalidColor: {
    name: 'Invalid Color Category',
    description: 'Category with invalid color format',
    color: 'invalid-color'
  }
} as const;

// Category update payloads
export const categoryUpdates = {
  nameUpdate: {
    name: 'Updated Test Category Name',
    description: 'Updated description for the test category'
  },

  statusUpdate: {
    is_active: false
  },

  orderUpdate: {
    display_order: 50
  },

  completeUpdate: {
    name: 'Completely Updated Category',
    description: 'This category has been completely updated with new information',
    color: '#00FF00',
    is_active: true,
    display_order: 25
  }
} as const;

// Search criteria for category testing
export const searchCriteria = {
  byName: 'Electronics',
  byPartialName: 'Sport',
  byDescription: 'equipment',
  activeOnly: { is_active: true },
  inactiveOnly: { is_active: false },
  noResults: 'NonExistentCategory12345'
} as const;

// Helper functions for category data management
export class CategoryDataManager {
  /**
   * Get all main categories as array
   */
  static getAllMainCategories(): TestCategory[] {
    return Object.values(mainCategories);
  }

  /**
   * Get random main category
   */
  static getRandomMainCategory(): TestCategory {
    const categories = this.getAllMainCategories();
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
  }

  /**
   * Generate unique category name
   */
  static generateUniqueCategoryName(prefix: string = 'Test Category'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix} ${timestamp}-${random}`;
  }

  /**
   * Generate category payload for creation
   */
  static generateCreatePayload(overrides: Partial<CreateCategoryPayload> = {}): CreateCategoryPayload {
    return {
      name: this.generateUniqueCategoryName(),
      description: 'Auto-generated test category for E2E testing',
      icon: 'test',
      color: '#FF6B6B',
      is_active: true,
      display_order: 999,
      ...overrides
    };
  }

  /**
   * Create subcategory with parent relationship
   */
  static generateSubcategoryPayload(
    parentId: string, 
    overrides: Partial<CreateCategoryPayload> = {}
  ): CreateCategoryPayload {
    return {
      ...this.generateCreatePayload(overrides),
      parent_id: parentId,
      name: `Subcategory of ${parentId} - ${Date.now()}`
    };
  }

  /**
   * Validate category data structure
   */
  static validateCategoryStructure(category: any): boolean {
    const requiredFields = ['id', 'name', 'description', 'created_at'];
    const optionalFields = ['parent_id', 'icon', 'color', 'is_active', 'display_order', 'updated_at'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!(field in category)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get categories by hierarchy level
   */
  static getCategoriesByLevel(categories: any[], level: 'main' | 'sub'): any[] {
    return categories.filter(cat => 
      level === 'main' ? !cat.parent_id : !!cat.parent_id
    );
  }

  /**
   * Build category hierarchy tree
   */
  static buildCategoryTree(categories: any[]): any[] {
    const mainCategories = this.getCategoriesByLevel(categories, 'main');
    const subcategories = this.getCategoriesByLevel(categories, 'sub');
    
    return mainCategories.map(mainCat => ({
      ...mainCat,
      subcategories: subcategories.filter(subCat => subCat.parent_id === mainCat.id)
    }));
  }

  /**
   * Get popular categories (categories with most items)
   */
  static getPopularCategoryNames(): string[] {
    return ['Electronics', 'Sports & Recreation', 'Tools & Equipment', 'Home & Garden'];
  }
}