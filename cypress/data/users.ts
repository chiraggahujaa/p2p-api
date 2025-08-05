// Centralized user data for all tests
export interface TestUser {
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: string;
  bio?: string;
  profile_image?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: string;
}

// Valid test users for different scenarios
export const testUsers = {
  // Primary test user for general testing
  primary: {
    email: 'test.user.primary@gmail.com',
    password: 'TestPassword123!',
    name: 'Primary Test User',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    bio: 'Primary test user for E2E testing'
  } as TestUser,

  // Secondary user for interaction testing
  secondary: {
    email: 'test.user.secondary@gmail.com',
    password: 'TestPassword456!',
    name: 'Secondary Test User',
    phone: '+1234567891',
    location: 'New York, NY',
    bio: 'Secondary test user for interaction testing'
  } as TestUser,

  // Admin user for admin functionality testing
  admin: {
    email: 'test.admin@gmail.com',
    password: 'AdminPassword789!',
    name: 'Test Admin User',
    phone: '+1234567892',
    location: 'Los Angeles, CA',
    bio: 'Admin user for testing admin functionality'
  } as TestUser,

  // User with minimal data
  minimal: {
    email: 'test.minimal@gmail.com',
    password: 'MinimalPass123!',
    name: 'Minimal User'
  } as TestUser,
} as const;

// Invalid user data for negative testing
export const invalidUsers = {
  invalidEmail: {
    email: 'invalid-email',
    password: 'ValidPassword123!',
    name: 'Invalid Email User'
  },
  
  weakPassword: {
    email: 'weak.password@gmail.com',
    password: '123',
    name: 'Weak Password User'
  },
  
  emptyName: {
    email: 'empty.name@gmail.com',
    password: 'ValidPassword123!',
    name: ''
  },
  
  longName: {
    email: 'long.name@gmail.com',
    password: 'ValidPassword123!',
    name: 'A'.repeat(256) // Assuming 255 char limit
  }
} as const;

// Profile update payloads
export const profileUpdates = {
  basic: {
    name: 'Updated Test User',
    bio: 'Updated bio for testing',
    location: 'Updated Location'
  },
  
  minimal: {
    name: 'Minimal Update'
  },
  
  complete: {
    name: 'Complete Update User',
    bio: 'Completely updated bio with more details',
    location: 'Updated City, Updated State',
    phone: '+9876543210'
  }
} as const;

// Search criteria for user search tests
export const searchCriteria = {
  byName: 'Test User',
  byLocation: 'San Francisco',
  byPartialEmail: 'test.user',
  noResults: 'NoMatchingUser12345'
} as const;

// Helper functions for user data management
export class UserDataManager {
  /**
   * Get a random test user (excluding specific types)
   */
  static getRandomUser(exclude: (keyof typeof testUsers)[] = []): TestUser {
    const availableUsers = Object.entries(testUsers).filter(
      ([key]) => !exclude.includes(key as keyof typeof testUsers)
    );
    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    return availableUsers[randomIndex][1];
  }

  /**
   * Generate unique email for dynamic user creation
   */
  static generateUniqueEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}.${timestamp}.${random}@gmail.com`;
  }

  /**
   * Generate user payload for registration
   */
  static generateRegistrationPayload(overrides: Partial<CreateUserPayload> = {}): CreateUserPayload {
    return {
      email: this.generateUniqueEmail(),
      password: 'TestPassword123!',
      name: `Test User ${Date.now()}`,
      phone: '+1234567890',
      location: 'Test City, Test State',
      ...overrides
    };
  }

  /**
   * Validate user data structure
   */
  static validateUserStructure(user: any): boolean {
    const requiredFields = ['id', 'email', 'name', 'created_at'];
    const optionalFields = ['phone', 'location', 'bio', 'profile_image', 'updated_at', 'email_verified'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!(field in user)) {
        return false;
      }
    }
    
    return true;
  }
}