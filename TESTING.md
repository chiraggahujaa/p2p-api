# API Testing Guide - P2P Platform

This document provides comprehensive information about testing the P2P Platform API using Cypress.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🔍 Overview

Our API testing suite uses **Cypress** for comprehensive end-to-end API testing. The tests cover:

- **Authentication System** - Registration, login, logout, password management
- **User Management** - Profile operations, search, statistics
- **Item Management** - CRUD operations, search, favorites, analytics
- **Booking System** - Complete rental workflow, status management, ratings
- **Category Management** - Hierarchical categories, search
- **Integration Tests** - End-to-end user flows and scenarios

### Test Statistics
- **5 Test Suites** with **200+ Individual Tests**
- **50+ API Endpoints** Covered
- **Industry Standard Practices** - Data fixtures, custom commands, page objects
- **Comprehensive Coverage** - Happy paths, edge cases, error scenarios

## 🏗️ Test Structure

```
backend/
├── cypress/
│   ├── e2e/                    # Test files
│   │   ├── auth.cy.ts         # Authentication tests
│   │   ├── users.cy.ts        # User management tests
│   │   ├── items.cy.ts        # Item management tests
│   │   ├── bookings.cy.ts     # Booking system tests
│   │   ├── categories.cy.ts   # Category tests
│   │   └── integration.cy.ts  # Integration tests
│   ├── fixtures/              # Test data
│   │   ├── users.json
│   │   ├── items.json
│   │   ├── bookings.json
│   │   ├── categories.json
│   │   └── locations.json
│   ├── support/               # Helper functions
│   │   ├── commands.ts        # Custom Cypress commands
│   │   └── e2e.ts            # Global setup
│   └── downloads/             # Test downloads
├── cypress.config.ts          # Cypress configuration
├── test-runner.sh            # Test runner script
└── TESTING.md               # This file
```

## 🚀 Setup Instructions

### Prerequisites

1. **Node.js 18+** installed
2. **Backend server** running on `http://localhost:5000`
3. **Supabase database** set up with migrations

### Installation

```bash
# Install dependencies (if not already done)
npm install

# Install Cypress dependencies
npx cypress install

# Verify installation
npx cypress verify
```

### Environment Configuration

Create or update `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

### Database Setup

Run the migration files in order:

```bash
# Apply migrations to your Supabase database
1. 001_create_core_tables.sql
2. 002_create_business_tables.sql
3. 003_create_rls_and_functions.sql
4. 004_seed_data.sql
```

## 🏃‍♂️ Running Tests

### Quick Start

```bash
# Start the backend server
npm run dev

# In another terminal, run all tests
npm test

# Or use the test runner script
./test-runner.sh
```

### Test Runner Script Options

```bash
# Run all tests
./test-runner.sh

# Run specific test suite
./test-runner.sh auth
./test-runner.sh users
./test-runner.sh items
./test-runner.sh bookings
./test-runner.sh categories
./test-runner.sh integration

# Run in different modes
./test-runner.sh headless    # No browser UI
./test-runner.sh chrome      # Chrome browser
./test-runner.sh firefox     # Firefox browser

# Skip server health check
./test-runner.sh --skip-server-check headless

# Show help
./test-runner.sh --help
```

### NPM Scripts

```bash
# Interactive test runner (opens Cypress GUI)
npm run test:open

# Run all tests headless
npm run test

# Run specific test suites
npm run test:auth
npm run test:users
npm run test:items
npm run test:bookings
npm run test:categories
npm run test:integration

# Browser-specific tests
npm run test:chrome
npm run test:firefox

# CI mode
npm run test:ci
```

## 📊 Test Categories

### 1. Authentication Tests (`auth.cy.ts`)
- **User Registration** - Valid/invalid data, duplicate emails
- **User Login** - Credentials validation, error handling
- **User Logout** - Token invalidation
- **Profile Management** - Get/update profile
- **Password Management** - Reset, update passwords
- **Email Verification** - OTP validation
- **Token Refresh** - Session management

### 2. User Management Tests (`users.cy.ts`)
- **Profile Operations** - CRUD operations for user profiles
- **Public Profiles** - View other users' public information
- **Search Users** - Search functionality with pagination
- **User Items** - Get user's items and public item lists
- **User Bookings** - Booking history and filtering
- **User Favorites** - Favorite items management
- **User Statistics** - Activity and performance metrics
- **Account Management** - Deactivation, verification

### 3. Item Management Tests (`items.cy.ts`)
- **Item CRUD** - Create, read, update, delete items
- **Item Search** - Advanced filtering, sorting, pagination
- **Item Details** - Full item information with relations
- **Availability Check** - Date-based availability
- **Favorites Management** - Add/remove favorites
- **Similar Items** - Related item suggestions
- **Item Analytics** - Owner analytics and metrics
- **Popular/Featured** - Curated item lists

### 4. Booking System Tests (`bookings.cy.ts`)
- **Booking Creation** - Full booking workflow
- **Booking Management** - Status transitions, validation
- **Booking Details** - Complete booking information
- **Status Management** - Confirm, start, complete, cancel
- **Ratings & Reviews** - Post-booking feedback system
- **User Bookings** - Filtered booking lists
- **Booking Statistics** - Performance metrics
- **Conflict Resolution** - Availability conflicts

### 5. Category Tests (`categories.cy.ts`)
- **Category CRUD** - Admin category management
- **Hierarchical Structure** - Parent-child relationships
- **Category Search** - Name-based search
- **Popular Categories** - Usage-based sorting
- **Category Navigation** - Breadcrumb hierarchy
- **Subcategories** - Nested category handling

### 6. Integration Tests (`integration.cy.ts`)
- **Complete Rental Flow** - End-to-end user scenarios
- **Multi-user Interactions** - Complex user workflows
- **Data Consistency** - Cross-entity data integrity
- **Concurrent Operations** - Race condition testing
- **Error Recovery** - Graceful error handling
- **Performance Testing** - Load and stress scenarios

## ✍️ Writing Tests

### Test Structure Pattern

```typescript
describe('Feature Name', () => {
  let testData: any;

  before(() => {
    // Global setup
    cy.waitForServer();
  });

  beforeEach(() => {
    // Per-test setup
    cy.cleanTestData();
    cy.setupTestData().then((data) => {
      testData = data;
    });
  });

  describe('Specific Functionality', () => {
    it('should handle happy path scenario', () => {
      // Test implementation
      cy.apiRequest('GET', '/endpoint')
        .then((response) => {
          cy.expectSuccessResponse(response);
          expect(response.body.data).to.have.property('expected_field');
        });
    });

    it('should handle error scenarios', () => {
      // Error testing
      cy.apiRequest('POST', '/endpoint', invalidData)
        .then((response) => {
          cy.expectErrorResponse(response, 400);
          expect(response.body.error).to.equal('Expected error message');
        });
    });
  });
});
```

### Custom Commands Usage

```typescript
// Authentication
cy.login('user@example.com', 'password123');
cy.register(userData);
cy.authenticatedRequest('GET', '/protected-endpoint');

// Test Data Creation
cy.createTestUser(customUserData);
cy.createTestItem(customItemData, authToken);
cy.createTestBooking(customBookingData, authToken);

// API Helpers
cy.apiRequest('POST', '/endpoint', requestBody);
cy.expectSuccessResponse(response);
cy.expectErrorResponse(response, 400);

// Integration Helpers
cy.setupIntegrationEnvironment();
cy.createTestItemAndBooking(lenderToken, borrowerToken, categoryId, locationId);
```

### Test Data Patterns

```typescript
// Use fixtures for consistent data
cy.fixture('users').then((users) => {
  const testUser = users.validUser;
  // Use in test
});

// Generate dynamic test data
cy.generateFakeData('user').then((userData) => {
  // Use generated data
});

// Create realistic test scenarios
const bookingWorkflow = {
  item: { /* item data */ },
  booking: { /* booking data */ },
  expectedStates: ['pending', 'confirmed', 'completed']
};
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup database
        run: |
          # Run migrations
          npm run migrate
          
      - name: Start server
        run: |
          npm run build
          npm start &
          sleep 10
          
      - name: Run API tests
        run: npm run test:ci
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

### Docker Integration

```dockerfile
# Cypress Docker image
FROM cypress/included:latest

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Run tests
CMD ["npm", "run", "test:ci"]
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Server Not Running
```bash
# Error: Server health check failed
# Solution: Start the backend server
npm run dev
```

#### 2. Database Connection Issues
```bash
# Error: Database connection failed
# Solution: Check Supabase configuration
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### 3. Test Data Conflicts
```bash
# Error: Unique constraint violations
# Solution: Ensure proper test cleanup
cy.cleanTestData(); // In beforeEach hooks
```

#### 4. Timeout Issues
```bash
# Error: Request timeout
# Solution: Increase timeout in cypress.config.ts
defaultCommandTimeout: 20000
requestTimeout: 20000
```

#### 5. Permission Errors
```bash
# Error: Permission denied
# Solution: Make scripts executable
chmod +x test-runner.sh
```

### Debug Mode

```bash
# Run with debug output
DEBUG=cypress:* npm run test:open

# Run specific test with logs
npm run test:auth -- --config video=true

# Check Cypress logs
cat ~/.npm/_logs/*.log
```

### Environment Issues

```bash
# Clear Cypress cache
npx cypress cache clear

# Reinstall Cypress
npm uninstall cypress
npm install cypress --save-dev

# Verify installation
npx cypress verify
npx cypress info
```

## 📊 Test Reports

### Coverage Reports

Tests generate the following artifacts:

- **Screenshots** - `cypress/screenshots/` (on test failures)
- **Videos** - `cypress/videos/` (full test runs)
- **JSON Reports** - Can be integrated with reporting tools

### Metrics Tracked

- **API Endpoint Coverage** - All 50+ endpoints tested
- **Response Time Performance** - Average response times
- **Error Rate Analysis** - Success/failure ratios
- **Test Execution Time** - Performance benchmarks

## 🚀 Advanced Features

### Parallel Test Execution

```bash
# Run tests in parallel (CI environments)
npm run test:ci -- --parallel --record --key YOUR_KEY
```

### Custom Reporting

```bash
# Generate detailed reports
npm install --save-dev cypress-multi-reporters
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

### Visual Testing

```bash
# Add visual regression testing
npm install --save-dev @percy/cypress
```

---

## 📞 Support

For issues or questions about testing:

1. **Check the logs** in `cypress/screenshots/` and `cypress/videos/`
2. **Review the API documentation** in `API_DOCUMENTATION.md`
3. **Run individual test suites** to isolate issues
4. **Use the interactive mode** with `npm run test:open`

**Happy Testing! 🎉**