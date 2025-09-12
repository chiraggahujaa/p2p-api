// Database seeding and cleanup commands
/// <reference types="cypress" />

export interface DatabaseSeeder {
  users?: boolean;
  categories?: boolean;
  items?: boolean;
  bookings?: boolean;
  locations?: boolean;
  files?: boolean;
}

export interface CleanupConfig {
  tables?: string[];
  preserveTestUsers?: boolean;
  preserveCategories?: boolean;
}


// Seed entire database with test data
Cypress.Commands.add('seedDatabase', (options: DatabaseSeeder = {}) => {
  cy.log('🌱 Seeding database with test data');
  
  const seedOptions = {
    users: true,
    categories: true,
    items: true,
    bookings: false,
    locations: true,
    files: false,
    ...options,
  };

  // Seed in proper order due to foreign key constraints
  if (seedOptions.locations) {
    cy.seedTestLocations();
  }
  
  if (seedOptions.categories) {
    cy.seedTestCategories();
  }
  
  if (seedOptions.users) {
    cy.seedTestUsers();
  }
  
  if (seedOptions.items) {
    cy.seedTestItems();
  }
  
  if (seedOptions.bookings) {
    // Bookings require users and items to exist first
    cy.wait(1000).then(() => {
      cy.seedTestBookings();
    });
  }

  cy.log('✅ Database seeding completed');
});

// Clean database
Cypress.Commands.add('cleanDatabase', (options: CleanupConfig = {}) => {
  cy.log('🧹 Cleaning database');
  
  const cleanupOptions = {
    tables: ['bookings', 'item_reviews', 'user_favorites', 'item_images', 'items', 'users'],
    preserveTestUsers: false,
    preserveCategories: true,
    ...options,
  };

  cy.apiRequest({
    method: 'POST',
    url: '/test/cleanup',
    body: cleanupOptions,
    auth: { bearer: Cypress.env('ADMIN_TOKEN') },
  }).then((response) => {
    if (response.status === 200) {
      cy.log('✅ Database cleanup completed');
    } else {
      cy.log('⚠️ Database cleanup had issues:', response.body);
    }
  });
});

// Seed test users
Cypress.Commands.add('seedTestUsers', () => {
  cy.log('👥 Seeding test users');
  
  const testUsers = Cypress.env('testUsers');
  const users = Object.values(testUsers) as any[];

  cy.wrap(
    Promise.all(
      users.map((user) => {
        return cy.register(user).then((response) => {
          if (response.success && response.data) {
            return response.data.user;
          }
          return null;
        });
      })
    )
  ).then((createdUsers) => {
    const validUsers = (createdUsers as any[]).filter(Boolean);
    cy.log(`✅ Created ${validUsers.length} test users`);
  });
});

// Seed test categories
Cypress.Commands.add('seedTestCategories', () => {
  cy.log('📂 Seeding test categories');
  
  const mainCategories = Cypress.env('mainCategories') || [
    {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      isActive: true
    },
    {
      name: 'Books',
      description: 'Books and educational materials',
      isActive: true
    },
    {
      name: 'Furniture',
      description: 'Home and office furniture',
      isActive: true
    }
  ];

  cy.wrap(
    Promise.all(
      mainCategories.map((category: any) => {
        return cy.getAuthToken().then((token) => {
          return cy.apiRequest({
            method: 'POST',
            url: '/categories',
            body: category,
            ...(token ? { auth: { bearer: token } } : {}),
            failOnStatusCode: false
          }).then((response) => {
            if (response.status === 201) {
              return response.body.data;
            }
            return null;
          });
        });
      })
    )
  ).then((createdCategories) => {
    const validCategories = (createdCategories as any[]).filter(Boolean);
    cy.log(`✅ Created ${validCategories.length} test categories`);
  });
});

// Seed test items
Cypress.Commands.add('seedTestItems', () => {
  cy.log('📦 Seeding test items');
  
  const testItems = Cypress.env('testItems');
  
  cy.loginAsTestUser('lender').then(() => {
    cy.getAuthToken().then((token) => {
      cy.wrap(
        Promise.all(
          testItems.map((item: any) => {
            return cy.apiRequest({
              method: 'POST',
              url: '/items',
              body: item,
              auth: { bearer: token! },
            }).then((response) => {
              if (response.status === 201) {
                return response.body.data;
              }
              return null;
            });
          })
        )
      ).then((createdItems) => {
        const validItems = (createdItems as any[]).filter(Boolean);
        cy.log(`✅ Created ${validItems.length} test items`);
      });
    });
  });
});

// Seed test locations
Cypress.Commands.add('seedTestLocations', () => {
  cy.log('📍 Seeding test locations');
  
  const testLocations = [
    {
      addressLine: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '12345',
      country: 'Test Country',
      latitude: 40.7128,
      longitude: -74.0060,
    },
    {
      addressLine: '456 Demo Avenue',
      city: 'Demo City',
      state: 'Demo State',
      pincode: '67890',
      country: 'Demo Country',
      latitude: 34.0522,
      longitude: -118.2437,
    },
  ];

  cy.wrap(
    Promise.all(
      testLocations.map((location) => {
        return cy.getAuthToken().then((token) => {
          return cy.apiRequest({
            method: 'POST',
            url: '/locations',
            body: location,
            ...(token ? { auth: { bearer: token } } : {}),
            failOnStatusCode: false
          }).then((response) => {
            if (response.status === 201) {
              return response.body.data;
            }
            return null;
          });
        });
      })
    )
  ).then((createdLocations) => {
    const validLocations = (createdLocations as any[]).filter(Boolean);
    cy.log(`✅ Created ${validLocations.length} test locations`);
  });
});

// Create individual test user
Cypress.Commands.add('createTestUser', (userData: any = {}) => {
  const defaultUserData = {
    fullName: `Test User ${Date.now()}`,
    email: `test.user.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phoneNumber: '+1234567890',
    gender: 'prefer_not_to_say',
    dob: '1990-01-01',
    dobVisibility: 'private',
    ...userData,
  };

  return cy.register(defaultUserData).then((response) => {
    if (response.success && response.data) {
      cy.log(`✅ Created test user: ${response.data.user.email}`);
      
      // Store user ID for cleanup
      const cleanup = Cypress.env('cleanup');
      cleanup.users.push(response.data.user.id);
      Cypress.env('cleanup', cleanup);
      
      return response.data.user;
    }
    throw new Error(`Failed to create test user: ${response.error}`);
  });
});

// Create individual test item
Cypress.Commands.add('createTestItem', (itemData: any = {}, userId?: string) => {
  const defaultItemData = {
    title: `Test Item ${Date.now()}`,
    description: 'Test item for automated testing',
    categoryId: Cypress.env('testCategoryId'),
    condition: 'excellent',
    rentPricePerDay: 25.99,
    securityAmount: 100.00,
    minRentalDays: 1,
    maxRentalDays: 30,
    deliveryMode: 'pickup_and_delivery',
    isNegotiable: true,
    tags: ['test', 'automation'],
    ...itemData,
  };

  const authToken = userId ? userId : null;

  return cy.getAuthToken().then((token) => {
    const bearerToken = authToken || token;
    
    return cy.apiRequest({
      method: 'POST',
      url: '/items',
      body: defaultItemData,
      auth: { bearer: bearerToken! },
    }).then((response) => {
      if (response.status === 201) {
        cy.log(`✅ Created test item: ${response.body.data.title}`);
        
        // Store item ID for cleanup
        const cleanup = Cypress.env('cleanup');
        cleanup.items.push(response.body.data.id);
        Cypress.env('cleanup', cleanup);
        
        return response.body.data;
      }
      throw new Error(`Failed to create test item: ${response.body.error}`);
    });
  });
});

// Create individual test booking
Cypress.Commands.add('createTestBooking', (bookingData: any = {}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  const defaultBookingData = {
    itemId: Cypress.env('testItemId'),
    startDate: tomorrow.toISOString().split('T')[0],
    endDate: dayAfter.toISOString().split('T')[0],
    pickupLocationId: Cypress.env('testLocationId'),
    deliveryLocationId: Cypress.env('testLocationId'),
    ...bookingData,
  };

  return cy.getAuthToken().then((token) => {
    return cy.apiRequest({
      method: 'POST',
      url: '/bookings',
      body: defaultBookingData,
      auth: { bearer: token! },
    }).then((response) => {
      if (response.status === 201) {
        cy.log(`✅ Created test booking: ${response.body.data.id}`);
        
        // Store booking ID for cleanup
        const cleanup = Cypress.env('cleanup');
        cleanup.bookings.push(response.body.data.id);
        Cypress.env('cleanup', cleanup);
        
        return response.body.data;
      }
      throw new Error(`Failed to create test booking: ${response.body.error}`);
    });
  });
});

// Delete test data
Cypress.Commands.add('deleteTestData', (entityType: string, entityId: string) => {
  const endpoints = {
    user: '/users',
    item: '/items',
    booking: '/bookings',
    category: '/categories',
    location: '/locations',
  };

  const endpoint = endpoints[entityType as keyof typeof endpoints];
  if (!endpoint) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  cy.getAuthToken().then((token) => {
    cy.apiRequest({
      method: 'DELETE',
      url: `${endpoint}/${entityId}`,
      auth: { bearer: token! },
    }).then((response) => {
      if (response.status === 200) {
        cy.log(`✅ Deleted test ${entityType}: ${entityId}`);
      } else {
        cy.log(`⚠️ Failed to delete test ${entityType}: ${entityId}`);
      }
    });
  });
});

// Reset entire database to clean state
Cypress.Commands.add('resetDatabase', () => {
  cy.log('🔄 Resetting database to clean state');
  
  cy.apiRequest({
    method: 'POST',
    url: '/test/reset',
    auth: { bearer: Cypress.env('ADMIN_TOKEN') },
  }).then((response) => {
    if (response.status === 200) {
      cy.log('✅ Database reset completed');
      // Re-seed basic data
      cy.seedDatabase({ 
        users: true, 
        categories: true, 
        items: false, 
        bookings: false 
      });
    } else {
      throw new Error(`Database reset failed: ${response.body.error}`);
    }
  });
});

// Seed test bookings
Cypress.Commands.add('seedTestBookings', () => {
  cy.log('📅 Seeding test bookings');
  
  const tomorrow = new Date(Date.now() + 86400000);
  const threeDaysLater = new Date(Date.now() + 259200000);
  
  const testBookings = [
    {
      startDate: tomorrow.toISOString().split('T')[0], // Tomorrow
      endDate: threeDaysLater.toISOString().split('T')[0], // 3 days later
      totalDays: 3,
      bookingStatus: 'confirmed',
      dailyRate: 25.00,
      totalRent: 75.00,
      securityAmount: 100.00,
      totalAmount: 175.00,
    },
  ];

  // This would require items and users to exist first
  cy.wrap(testBookings).then((bookings) => {
    cy.log(`✅ Test bookings data prepared (${bookings.length} bookings)`);
  });
});

// Verify database state
Cypress.Commands.add('verifyDatabaseState', () => {
  return cy.apiRequest({
    method: 'GET',
    url: '/test/health',
    auth: { bearer: Cypress.env('ADMIN_TOKEN') },
  }).then((response) => {
    expect(response.status).to.equal(200);
    expect(response.body.success).to.be.true;
    expect(response.body.data).to.have.property('database_connected', true);
    
    cy.log('✅ Database state verified');
    return true;
  });
});

export {};