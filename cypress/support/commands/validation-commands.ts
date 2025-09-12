// Response validation helpers and schema validation
/// <reference types="cypress" />

export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: { [key: string]: ValidationSchema };
  required?: string[];
  items?: ValidationSchema;
  format?: string;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}


// Generic schema validation
Cypress.Commands.add('validateSchema', (data: any, schema: ValidationSchema) => {
  if (schema.type === 'object') {
    expect(data).to.be.an('object');
    
    if (schema.required) {
      schema.required.forEach((field) => {
        expect(data).to.have.property(field);
      });
    }
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, subSchema]) => {
        if (data[key] !== undefined) {
          cy.validateSchema(data[key], subSchema);
        }
      });
    }
  } else if (schema.type === 'array') {
    expect(data).to.be.an('array');
    
    if (schema.items && data.length > 0) {
      data.forEach((item: any) => {
        cy.validateSchema(item, schema.items!);
      });
    }
  } else if (schema.type === 'string') {
    expect(data).to.be.a('string');
    
    if (schema.format === 'email') {
      cy.validateEmailFormat(data);
    } else if (schema.format === 'uuid') {
      cy.validateUuidFormat(data);
    } else if (schema.format === 'date') {
      cy.validateDateFormat(data);
    } else if (schema.format === 'phone') {
      cy.validatePhoneFormat(data);
    }
    
    if (schema.pattern) {
      expect(data).to.match(new RegExp(schema.pattern));
    }
  } else if (schema.type === 'number') {
    expect(data).to.be.a('number');
    
    if (schema.minimum !== undefined) {
      expect(data).to.be.at.least(schema.minimum);
    }
    
    if (schema.maximum !== undefined) {
      expect(data).to.be.at.most(schema.maximum);
    }
  } else if (schema.type === 'boolean') {
    expect(data).to.be.a('boolean');
  }
});

// User schema validation
Cypress.Commands.add('validateUserSchema', (user: any) => {
  // Flexible schema that works with both custom and Supabase formats
  const userSchema: ValidationSchema = {
    type: 'object',
    required: ['id', 'email'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      fullName: { type: 'string' },
      phoneNumber: { type: 'string' },
      gender: { type: 'string' },
      dob: { type: 'string', format: 'date' },
      dobVisibility: { type: 'string' },
      trustScore: { type: 'number', minimum: 0, maximum: 5 },
      isVerified: { type: 'boolean' },
      isActive: { type: 'boolean' },
      avatarUrl: { type: 'string' },
      bio: { type: 'string' },
      // Supabase fields
      aud: { type: 'string' },
      role: { type: 'string' },
      user_metadata: { type: 'object' },
      app_metadata: { type: 'object' },
      created_at: { type: 'string', format: 'date' },
      updated_at: { type: 'string', format: 'date' },
      createdAt: { type: 'string', format: 'date' },
      updatedAt: { type: 'string', format: 'date' },
    },
  };
  
  cy.validateSchema(user, userSchema);
});

// Item schema validation
Cypress.Commands.add('validateItemSchema', (item: any) => {
  const itemSchema: ValidationSchema = {
    type: 'object',
    required: ['id', 'title', 'description', 'categoryId', 'condition', 'rentPricePerDay', 'status', 'userId', 'createdAt'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      description: { type: 'string' },
      categoryId: { type: 'string', format: 'uuid' },
      condition: { type: 'string' },
      status: { type: 'string' },
      rentPricePerDay: { type: 'number', minimum: 0 },
      securityAmount: { type: 'number', minimum: 0 },
      minRentalDays: { type: 'number', minimum: 1 },
      maxRentalDays: { type: 'number', minimum: 1 },
      deliveryMode: { type: 'string' },
      isNegotiable: { type: 'boolean' },
      userId: { type: 'string', format: 'uuid' },
      locationId: { type: 'string', format: 'uuid' },
      ratingAverage: { type: 'number', minimum: 0, maximum: 5 },
      createdAt: { type: 'string', format: 'date' },
      updatedAt: { type: 'string', format: 'date' },
    },
  };
  
  cy.validateSchema(item, itemSchema);
});

// Booking schema validation
Cypress.Commands.add('validateBookingSchema', (booking: any) => {
  const bookingSchema: ValidationSchema = {
    type: 'object',
    required: ['id', 'itemId', 'lenderUserId', 'borrowerUserId', 'startDate', 'endDate', 'totalDays', 'bookingStatus', 'createdAt'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      itemId: { type: 'string', format: 'uuid' },
      lenderUserId: { type: 'string', format: 'uuid' },
      borrowerUserId: { type: 'string', format: 'uuid' },
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
      totalDays: { type: 'number', minimum: 1 },
      dailyRate: { type: 'number', minimum: 0 },
      totalRent: { type: 'number', minimum: 0 },
      securityAmount: { type: 'number', minimum: 0 },
      totalAmount: { type: 'number', minimum: 0 },
      bookingStatus: { type: 'string' },
      pickupLocationId: { type: 'string', format: 'uuid' },
      deliveryLocationId: { type: 'string', format: 'uuid' },
      ratingByLender: { type: 'number', minimum: 1, maximum: 5 },
      ratingByBorrower: { type: 'number', minimum: 1, maximum: 5 },
      createdAt: { type: 'string', format: 'date' },
      updatedAt: { type: 'string', format: 'date' },
    },
  };
  
  cy.validateSchema(booking, bookingSchema);
});

// Category schema validation
Cypress.Commands.add('validateCategorySchema', (category: any) => {
  const categorySchema: ValidationSchema = {
    type: 'object',
    required: ['id', 'categoryName', 'isActive', 'createdAt'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      categoryName: { type: 'string' },
      description: { type: 'string' },
      iconUrl: { type: 'string' },
      bannerUrl: { type: 'string' },
      parentCategoryId: { type: 'string', format: 'uuid' },
      isActive: { type: 'boolean' },
      sortOrder: { type: 'number' },
      createdAt: { type: 'string', format: 'date' },
      updatedAt: { type: 'string', format: 'date' },
    },
  };
  
  cy.validateSchema(category, categorySchema);
});

// Location schema validation
Cypress.Commands.add('validateLocationSchema', (location: any) => {
  const locationSchema: ValidationSchema = {
    type: 'object',
    required: ['id', 'addressLine', 'city', 'state', 'pincode', 'country', 'createdAt'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      addressLine: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      pincode: { type: 'string' },
      country: { type: 'string' },
      latitude: { type: 'number', minimum: -90, maximum: 90 },
      longitude: { type: 'number', minimum: -180, maximum: 180 },
      createdAt: { type: 'string', format: 'date' },
      updatedAt: { type: 'string', format: 'date' },
    },
  };
  
  cy.validateSchema(location, locationSchema);
});

// File schema validation
Cypress.Commands.add('validateFileSchema', (file: any) => {
  const fileSchema: ValidationSchema = {
    type: 'object',
    required: ['id', 'userId', 'name', 'url', 'fileType', 'fileSize', 'mimeType', 'createdAt'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      url: { type: 'string' },
      fileType: { type: 'string' },
      fileSize: { type: 'number', minimum: 0 },
      mimeType: { type: 'string' },
      bucket: { type: 'string' },
      path: { type: 'string' },
      originalName: { type: 'string' },
      isPublic: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date' },
      updatedAt: { type: 'string', format: 'date' },
    },
  };
  
  cy.validateSchema(file, fileSchema);
});

// Date format validation
Cypress.Commands.add('validateDateFormat', (date: string) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  expect(date).to.match(dateRegex);
  
  const parsedDate = new Date(date);
  expect(parsedDate.toString()).to.not.equal('Invalid Date');
});

// Email format validation
Cypress.Commands.add('validateEmailFormat', (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(email).to.match(emailRegex);
});

// Phone format validation
Cypress.Commands.add('validatePhoneFormat', (phone: string) => {
  // Allow various phone formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  expect(phone.replace(/[\s\-\(\)]/g, '')).to.match(phoneRegex);
});

// UUID format validation
Cypress.Commands.add('validateUuidFormat', (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(uuid).to.match(uuidRegex);
});

// Price format validation (ensures proper decimal places)
Cypress.Commands.add('validatePriceFormat', (price: number) => {
  expect(price).to.be.a('number');
  expect(price).to.be.above(0);
  
  // Check if price has at most 2 decimal places
  expect(Number.isInteger(price * 100)).to.be.true;
});

// Array response validation
Cypress.Commands.add('validateArrayResponse', (data: any[], itemValidator: (item: any) => void) => {
  expect(data).to.be.an('array');
  
  data.forEach((item) => {
    itemValidator(item);
  });
});

// Required fields validation
Cypress.Commands.add('validateRequiredFields', (data: any, requiredFields: string[]) => {
  requiredFields.forEach((field) => {
    expect(data).to.have.property(field);
    expect(data[field]).to.not.be.null;
    expect(data[field]).to.not.be.undefined;
  });
});

export {};