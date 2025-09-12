// Dynamic test data generation utilities
/// <reference types="cypress" />

export class DataGenerators {
  private static readonly FAKE_DOMAINS = ['testmail.com', 'example.org', 'demo.net'];
  private static readonly FIRST_NAMES = ['John', 'Jane', 'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry'];
  private static readonly LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  private static readonly CITIES = ['San Francisco', 'Los Angeles', 'New York', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas'];
  private static readonly STATES = ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
  private static readonly ITEM_CATEGORIES = ['Electronics', 'Sports & Recreation', 'Tools & Equipment', 'Home & Garden', 'Vehicles'];
  private static readonly ITEM_CONDITIONS = ['excellent', 'very_good', 'good', 'fair'];

  static generateUniqueId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateTimestamp(): number {
    return Date.now();
  }

  static generateFutureDate(daysFromNow: number = 7): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  static generatePastDate(daysAgo: number = 30): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  static generateRandomEmail(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 5);
    const domain = this.FAKE_DOMAINS[Math.floor(Math.random() * this.FAKE_DOMAINS.length)];
    return `test.user.${timestamp}.${randomString}@${domain}`;
  }

  static generateRandomPhone(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `+1${areaCode}${exchange}${number}`;
  }

  static generateRandomName(): { firstName: string; lastName: string; fullName: string } {
    const firstName = this.FIRST_NAMES[Math.floor(Math.random() * this.FIRST_NAMES.length)];
    const lastName = this.LAST_NAMES[Math.floor(Math.random() * this.LAST_NAMES.length)];
    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
    };
  }

  static generateRandomPrice(min: number = 5, max: number = 500): number {
    const price = Math.random() * (max - min) + min;
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }

  static generateRandomInteger(min: number = 1, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static generateRandomString(length: number = 10): string {
    return Math.random().toString(36).substr(2, length);
  }

  static generateRandomAddress(): {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    latitude: number;
    longitude: number;
  } {
    const streetNumber = this.generateRandomInteger(100, 9999);
    const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Maple Ln', 'Cedar Blvd', 'Park Ave', 'First St'];
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const city = this.CITIES[Math.floor(Math.random() * this.CITIES.length)];
    const state = this.STATES[Math.floor(Math.random() * this.STATES.length)];
    
    return {
      addressLine: `${streetNumber} ${streetName}`,
      city,
      state,
      pincode: this.generateRandomInteger(10000, 99999).toString(),
      country: 'United States',
      latitude: this.generateRandomFloat(25.0, 49.0, 4),
      longitude: this.generateRandomFloat(-125.0, -66.0, 4),
    };
  }

  private static generateRandomFloat(min: number, max: number, decimals: number = 2): number {
    const float = Math.random() * (max - min) + min;
    return Math.round(float * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  static generateTestUser(overrides: any = {}): any {
    const name = this.generateRandomName();
    const dob = this.generatePastDate(this.generateRandomInteger(6570, 18250)); // 18-50 years old
    
    return {
      fullName: name.fullName,
      email: this.generateRandomEmail(),
      password: 'TestPassword123!',
      phoneNumber: this.generateRandomPhone(),
      gender: ['male', 'female', 'prefer_not_to_say'][Math.floor(Math.random() * 3)],
      dob,
      dobVisibility: ['public', 'private', 'friends_only'][Math.floor(Math.random() * 3)],
      bio: `Test bio for ${name.fullName} - Generated for testing purposes.`,
      ...overrides,
    };
  }

  static generateTestItem(overrides: any = {}): any {
    const itemNames = [
      'Professional Camera', 'Mountain Bike', 'Power Drill', 'Gaming Laptop', 'Camping Tent',
      'Guitar', 'Treadmill', 'Pressure Washer', 'Drone', 'Kayak', 'Projector', 'Sound System'
    ];
    const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
    const category = this.ITEM_CATEGORIES[Math.floor(Math.random() * this.ITEM_CATEGORIES.length)];
    const condition = this.ITEM_CONDITIONS[Math.floor(Math.random() * this.ITEM_CONDITIONS.length)];
    
    return {
      title: `${itemName} - Test Item ${this.generateRandomString(4)}`,
      description: `Test description for ${itemName}. This item is available for rental and is in ${condition} condition.`,
      condition,
      rentPricePerDay: this.generateRandomPrice(10, 200),
      securityAmount: this.generateRandomPrice(50, 1000),
      minRentalDays: this.generateRandomInteger(1, 3),
      maxRentalDays: this.generateRandomInteger(7, 30),
      deliveryMode: ['pickup_only', 'delivery_only', 'pickup_and_delivery'][Math.floor(Math.random() * 3)],
      isNegotiable: Math.random() > 0.5,
      tags: [category.toLowerCase(), condition, 'test', 'generated'],
      ...overrides,
    };
  }

  static generateTestBooking(overrides: any = {}): any {
    const startDaysFromNow = this.generateRandomInteger(1, 7);
    const duration = this.generateRandomInteger(1, 14);
    const startDate = this.generateFutureDate(startDaysFromNow);
    const endDate = this.generateFutureDate(startDaysFromNow + duration);
    
    return {
      startDate,
      endDate,
      notes: `Test booking generated on ${new Date().toISOString()}`,
      ...overrides,
    };
  }

  static generateTestCategory(overrides: any = {}): any {
    const categoryNames = [
      'Test Electronics', 'Test Sports', 'Test Tools', 'Test Vehicles', 
      'Test Home', 'Test Garden', 'Test Music', 'Test Fitness'
    ];
    const categoryName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
    
    return {
      categoryName: `${categoryName} ${this.generateRandomString(4)}`,
      description: `Test category for ${categoryName.toLowerCase()} items`,
      isActive: true,
      sortOrder: this.generateRandomInteger(1, 100),
      ...overrides,
    };
  }

  static generateTestFile(overrides: any = {}): any {
    const fileTypes = ['image', 'video', 'document', 'other'];
    const mimeTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif'],
      video: ['video/mp4', 'video/avi', 'video/mov'],
      document: ['application/pdf', 'text/plain', 'application/msword'],
      other: ['application/zip', 'application/json', 'text/csv'],
    };
    
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    const mimeType = mimeTypes[fileType as keyof typeof mimeTypes][
      Math.floor(Math.random() * mimeTypes[fileType as keyof typeof mimeTypes].length)
    ];
    const fileName = `test-file-${this.generateRandomString(8)}`;
    const extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    
    return {
      name: `${fileName}.${extension}`,
      originalName: `${fileName}.${extension}`,
      fileType,
      mimeType,
      fileSize: this.generateRandomInteger(1000, 10000000), // 1KB to 10MB
      isPublic: Math.random() > 0.5,
      ...overrides,
    };
  }

  // Generate multiple items of the same type
  static generateTestUsers(count: number, overrides: any = {}): any[] {
    return Array.from({ length: count }, () => this.generateTestUser(overrides));
  }

  static generateTestItems(count: number, overrides: any = {}): any[] {
    return Array.from({ length: count }, () => this.generateTestItem(overrides));
  }

  static generateTestBookings(count: number, overrides: any = {}): any[] {
    return Array.from({ length: count }, () => this.generateTestBooking(overrides));
  }

  static generateTestCategories(count: number, overrides: any = {}): any[] {
    return Array.from({ length: count }, () => this.generateTestCategory(overrides));
  }

  // Generate invalid data for negative testing
  static generateInvalidUser(): any {
    const invalidOptions = [
      { email: 'invalid-email' },
      { email: '', fullName: 'Valid Name' },
      { fullName: '', email: 'valid@email.com' },
      { password: '123' }, // Too short
      { phoneNumber: 'invalid-phone' },
      { dob: 'invalid-date' },
      { dobVisibility: 'invalid-visibility' },
      { gender: 'invalid-gender' },
    ];
    
    const invalidData = invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
    return {
      ...this.generateTestUser(),
      ...invalidData,
    };
  }

  static generateInvalidItem(): any {
    const invalidOptions = [
      { title: '' },
      { description: '' },
      { rentPricePerDay: -10 },
      { rentPricePerDay: 0 },
      { condition: 'invalid-condition' },
      { minRentalDays: 0 },
      { minRentalDays: -1 },
      { maxRentalDays: 0 },
      { deliveryMode: 'invalid-delivery-mode' },
    ];
    
    const invalidData = invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
    return {
      ...this.generateTestItem(),
      ...invalidData,
    };
  }

  static generateInvalidBooking(): any {
    const yesterday = this.generatePastDate(1);
    const today = new Date().toISOString().split('T')[0];
    
    const invalidOptions = [
      { startDate: '', endDate: this.generateFutureDate(7) },
      { startDate: this.generateFutureDate(7), endDate: '' },
      { startDate: yesterday, endDate: today }, // Past dates
      { startDate: this.generateFutureDate(7), endDate: this.generateFutureDate(5) }, // End before start
    ];
    
    const invalidData = invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
    return {
      ...this.generateTestBooking(),
      ...invalidData,
    };
  }

  // Clean up generated test data
  static getCleanupIdentifiers(generatedData: any[]): string[] {
    return generatedData.map(item => item.id).filter(Boolean);
  }

  // Generate data sets for load testing
  static generateLoadTestData(entityType: string, count: number): any[] {
    switch (entityType) {
      case 'users':
        return this.generateTestUsers(count);
      case 'items':
        return this.generateTestItems(count);
      case 'bookings':
        return this.generateTestBookings(count);
      case 'categories':
        return this.generateTestCategories(count);
      default:
        throw new Error(`Unsupported entity type for load testing: ${entityType}`);
    }
  }
}

export default DataGenerators;