// Centralized item data for all tests
export interface TestItem {
  name: string;
  description: string;
  category: string;
  price_per_day: number;
  price_per_week?: number;
  price_per_month?: number;
  location: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  availability_start?: string;
  availability_end?: string;
  images?: string[];
  deposit_amount?: number;
  minimum_rental_days?: number;
  maximum_rental_days?: number;
  delivery_available?: boolean;
  delivery_fee?: number;
  pickup_instructions?: string;
  tags?: string[];
}

export interface CreateItemPayload extends Omit<TestItem, 'id' | 'owner_id' | 'created_at' | 'updated_at'> {}

// Valid test items for different scenarios
export const testItems = {
  // Electronics category
  laptop: {
    name: 'MacBook Pro 16-inch Test Item',
    description: 'High-performance laptop perfect for work and creative projects. Includes charger and carrying case.',
    category: 'Electronics',
    price_per_day: 25.00,
    price_per_week: 150.00,
    price_per_month: 500.00,
    location: 'San Francisco, CA',
    condition: 'like_new',
    deposit_amount: 1000.00,
    minimum_rental_days: 1,
    maximum_rental_days: 30,
    delivery_available: true,
    delivery_fee: 15.00,
    pickup_instructions: 'Available for pickup after 5 PM on weekdays',
    tags: ['laptop', 'macbook', 'work', 'creative']
  } as TestItem,

  camera: {
    name: 'Canon EOS R5 Camera Test Item',
    description: 'Professional mirrorless camera with 45MP sensor. Perfect for photography and videography.',
    category: 'Electronics',
    price_per_day: 50.00,
    price_per_week: 300.00,
    location: 'Los Angeles, CA',
    condition: 'good',
    deposit_amount: 2000.00,
    minimum_rental_days: 1,
    maximum_rental_days: 14,
    delivery_available: false,
    pickup_instructions: 'Pickup from downtown location between 9 AM - 6 PM',
    tags: ['camera', 'photography', 'video', 'professional']
  } as TestItem,

  // Sports & Recreation category
  bicycle: {
    name: 'Mountain Bike Test Item',
    description: 'Full suspension mountain bike suitable for trails and city riding.',
    category: 'Sports & Recreation',
    price_per_day: 15.00,
    price_per_week: 90.00,
    location: 'Denver, CO',
    condition: 'good',
    deposit_amount: 200.00,
    minimum_rental_days: 1,
    maximum_rental_days: 7,
    delivery_available: true,
    delivery_fee: 10.00,
    tags: ['bike', 'mountain', 'outdoor', 'recreation']
  } as TestItem,

  // Tools & Equipment category
  drill: {
    name: 'Power Drill Set Test Item',
    description: 'Professional cordless drill with various bits and accessories.',
    category: 'Tools & Equipment',
    price_per_day: 8.00,
    price_per_week: 45.00,
    location: 'Austin, TX',
    condition: 'good',
    deposit_amount: 50.00,
    minimum_rental_days: 1,
    maximum_rental_days: 30,
    delivery_available: false,
    tags: ['drill', 'tools', 'construction', 'diy']
  } as TestItem,

  // Home & Garden category
  lawnMower: {
    name: 'Electric Lawn Mower Test Item',
    description: 'Eco-friendly electric lawn mower, perfect for small to medium yards.',
    category: 'Home & Garden',
    price_per_day: 12.00,
    price_per_week: 70.00,
    location: 'Portland, OR',
    condition: 'like_new',
    deposit_amount: 100.00,
    minimum_rental_days: 1,
    maximum_rental_days: 14,
    delivery_available: true,
    delivery_fee: 20.00,
    tags: ['lawnmower', 'garden', 'electric', 'eco-friendly']
  } as TestItem,

  // Minimal item for testing
  minimal: {
    name: 'Minimal Test Item',
    description: 'Basic item for minimal testing',
    category: 'Other',
    price_per_day: 5.00,
    location: 'Test City',
    condition: 'good'
  } as TestItem
} as const;

// Invalid item data for negative testing
export const invalidItems = {
  emptyName: {
    name: '',
    description: 'Item with empty name',
    category: 'Electronics',
    price_per_day: 10.00,
    location: 'Test City',
    condition: 'good'
  },

  negativePrice: {
    name: 'Negative Price Item',
    description: 'Item with negative price',
    category: 'Electronics',
    price_per_day: -10.00,
    location: 'Test City',
    condition: 'good'
  },

  invalidCondition: {
    name: 'Invalid Condition Item',
    description: 'Item with invalid condition',
    category: 'Electronics',
    price_per_day: 10.00,
    location: 'Test City',
    condition: 'invalid_condition' as any
  },

  longDescription: {
    name: 'Long Description Item',
    description: 'X'.repeat(5001), // Assuming 5000 char limit
    category: 'Electronics',
    price_per_day: 10.00,
    location: 'Test City',
    condition: 'good'
  }
} as const;

// Item update payloads
export const itemUpdates = {
  priceUpdate: {
    price_per_day: 30.00,
    price_per_week: 180.00,
    price_per_month: 600.00
  },

  descriptionUpdate: {
    description: 'Updated description with more details about the item condition and usage.'
  },

  availabilityUpdate: {
    availability_start: '2024-01-01',
    availability_end: '2024-12-31'
  },

  deliveryUpdate: {
    delivery_available: true,
    delivery_fee: 25.00,
    pickup_instructions: 'Updated pickup instructions with new location details'
  }
} as const;

// Search and filter criteria
export const searchCriteria = {
  byName: 'MacBook',
  byCategory: 'Electronics',
  byLocation: 'San Francisco',
  byPriceRange: { min: 10, max: 50 },
  byCondition: 'like_new',
  byTags: ['laptop', 'camera'],
  noResults: 'NonExistentItem12345'
} as const;

// Categories for testing
export const categories = [
  'Electronics',
  'Sports & Recreation',
  'Tools & Equipment',
  'Home & Garden',
  'Vehicles',
  'Fashion & Accessories',
  'Books & Media',
  'Toys & Games',
  'Other'
] as const;

// Helper functions for item data management
export class ItemDataManager {
  /**
   * Get a random test item (excluding specific types)
   */
  static getRandomItem(exclude: (keyof typeof testItems)[] = []): TestItem {
    const availableItems = Object.entries(testItems).filter(
      ([key]) => !exclude.includes(key as keyof typeof testItems)
    );
    const randomIndex = Math.floor(Math.random() * availableItems.length);
    return availableItems[randomIndex][1];
  }

  /**
   * Generate unique item name for dynamic creation
   */
  static generateUniqueItemName(prefix: string = 'Test Item'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix} ${timestamp}-${random}`;
  }

  /**
   * Generate item payload for creation
   */
  static generateCreatePayload(overrides: Partial<CreateItemPayload> = {}): CreateItemPayload {
    return {
      name: this.generateUniqueItemName(),
      description: 'Auto-generated test item for E2E testing',
      category: 'Other',
      price_per_day: Math.floor(Math.random() * 100) + 5,
      location: 'Test City, Test State',
      condition: 'good',
      deposit_amount: 50.00,
      minimum_rental_days: 1,
      maximum_rental_days: 30,
      ...overrides
    };
  }

  /**
   * Get random category
   */
  static getRandomCategory(): string {
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
  }

  /**
   * Validate item data structure
   */
  static validateItemStructure(item: any): boolean {
    const requiredFields = ['id', 'name', 'description', 'category', 'price_per_day', 'location', 'condition', 'owner_id', 'created_at'];
    const optionalFields = ['price_per_week', 'price_per_month', 'images', 'deposit_amount', 'minimum_rental_days', 'maximum_rental_days'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!(field in item)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate expected weekly/monthly prices if not provided
   */
  static calculateExpectedPrices(dailyPrice: number): { weekly: number; monthly: number } {
    return {
      weekly: dailyPrice * 7 * 0.9, // 10% discount for weekly
      monthly: dailyPrice * 30 * 0.8 // 20% discount for monthly
    };
  }
}