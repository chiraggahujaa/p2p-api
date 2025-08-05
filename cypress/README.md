# P2P API Testing Suite

A comprehensive end-to-end API testing suite built with Cypress for the P2P rental platform backend.

## 🏗️ Architecture

This test suite follows enterprise-grade patterns used by big tech companies for API testing:

### 📁 Project Structure

```
cypress/
├── data/                           # Centralized test data management
│   ├── users.ts                    # User test data and helpers
│   ├── items.ts                    # Item test data and helpers
│   ├── bookings.ts                 # Booking test data and helpers
│   └── categories.ts               # Category test data and helpers
├── downloads/                      # Downloaded files during tests
├── e2e-tests/                      # Test suites organized by domain
│   ├── auth/                       # Authentication tests
│   │   ├── auth-basic.cy.ts        # Basic auth operations
│   │   └── auth-advanced.cy.ts     # Advanced auth scenarios
│   ├── users/                      # User management tests
│   │   └── users-basic.cy.ts       # User CRUD and profile operations
│   ├── items/                      # Item management tests
│   │   └── items-basic.cy.ts       # Item CRUD and search operations
│   ├── bookings/                   # Booking management tests
│   │   └── bookings-basic.cy.ts    # Booking lifecycle and status management
│   ├── categories/                 # Category management tests
│   │   └── categories-basic.cy.ts  # Category CRUD and hierarchy
│   └── integration/                # End-to-end integration tests
│       └── api-integration.cy.ts   # Complete user journeys
├── fixtures/                       # Static test data files
│   ├── test-users.json            # User fixture data
│   ├── test-items.json            # Item fixture data
│   ├── test-bookings.json         # Booking fixture data
│   └── test-categories.json       # Category fixture data
└── support/                        # Test infrastructure
    ├── commands.ts                 # Custom Cypress commands
    ├── e2e.ts                     # Global setup and configuration
    ├── helpers/                   # Domain-specific helper functions
    │   ├── auth.ts                # Authentication helpers
    │   ├── items.ts               # Item management helpers
    │   ├── bookings.ts            # Booking management helpers
    │   └── utils.ts               # General utility functions
    └── request/
        └── api.ts                 # Centralized API client
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API server running on `http://localhost:5000`
- Database properly seeded (optional for isolated tests)

### Installation

Dependencies are already included in the main package.json:

```bash
npm install
```

### Running Tests

#### Interactive Mode (Development)
```bash
npm run test:open
```

#### Headless Mode (CI/CD)
```bash
npm run test
npm run test:ci
```

#### Specific Test Suites
```bash
npm run test:auth          # Authentication tests
npm run test:users         # User management tests  
npm run test:items         # Item management tests
npm run test:bookings      # Booking management tests
npm run test:categories    # Category management tests
npm run test:integration   # Integration tests
```

#### Test Categories
```bash
npm run test:basic         # All basic functionality tests
npm run test:advanced      # All advanced scenario tests
npm run test:smoke         # Quick smoke tests
```

#### Browser-Specific
```bash  
npm run test:chrome        # Run in Chrome
npm run test:firefox       # Run in Firefox
npm run test:headless      # Run headlessly
```

## 🧪 Test Coverage

### Authentication API
- ✅ User registration with validation
- ✅ Login/logout functionality  
- ✅ Token refresh and expiration
- ✅ Password reset flow
- ✅ Profile management
- ✅ Rate limiting and security
- ✅ Concurrent authentication
- ✅ Edge cases and error handling

### User Management API
- ✅ User CRUD operations
- ✅ Profile updates and validation
- ✅ User search and filtering
- ✅ User statistics and analytics
- ✅ Account deactivation
- ✅ Privacy and permissions

### Item Management API
- ✅ Item CRUD operations
- ✅ Search and filtering
- ✅ Category-based organization
- ✅ Availability checking
- ✅ Favorites management
- ✅ Item analytics
- ✅ Owner permissions

### Booking Management API
- ✅ Booking lifecycle (pending → confirmed → active → completed)
- ✅ Status transitions and validation
- ✅ Date conflict detection
- ✅ Rating and feedback system
- ✅ Booking statistics
- ✅ Multi-user interaction scenarios

### Category Management API
- ✅ Category hierarchy management
- ✅ Search and filtering
- ✅ Popular categories
- ✅ Admin functionality
- ✅ Data consistency validation

### Integration Scenarios
- ✅ Complete user journeys (owner & renter)
- ✅ Cross-entity data consistency
- ✅ Performance under load
- ✅ Error handling across system
- ✅ System health monitoring

## 🏛️ Architecture Principles

### 1. **Centralized Data Management**
- All test data is managed in `/data` directory
- Type-safe interfaces and validation
- Reusable data generators and helpers
- No data duplication across tests

### 2. **Layered Helper Architecture**
- **API Layer**: Centralized HTTP client (`support/request/api.ts`)
- **Helper Layer**: Domain-specific business logic (`support/helpers/`)
- **Command Layer**: Reusable Cypress commands (`support/commands.ts`)
- **Test Layer**: Focused test scenarios (`e2e-tests/`)

### 3. **Comprehensive Error Handling**
- Network failure resilience
- Proper timeout configuration
- Graceful degradation
- Detailed error logging

### 4. **Performance Monitoring**
- Request duration tracking
- Slow test detection
- Concurrent operation testing
- Resource cleanup

### 5. **Maintainable Test Structure**
- Descriptive test names and logging
- Proper setup/teardown
- Independent test execution
- Clear separation of concerns

## 🔧 Configuration

### Environment Variables

The tests use the following environment variables (configured in `cypress.config.ts`):

```typescript
API_BASE_URL=http://localhost:5000/api  # Backend API base URL
NODE_ENV=test                           # Environment identifier
CYPRESS_RECORD_KEY=your_key_here       # For Cypress Dashboard (optional)
```

### Custom Configuration

Key configuration options in `cypress.config.ts`:

- **Base URL**: `http://localhost:5000`
- **Spec Pattern**: `cypress/e2e-tests/**/*.cy.{js,jsx,ts,tsx}`
- **Request Timeout**: 15 seconds
- **Test Isolation**: Enabled
- **Retries**: 2 in run mode, 0 in open mode

## 📊 Test Data Management

### Data Generators
Each domain has intelligent data generators:

```typescript
// Generate unique test user
const userData = UserDataManager.generateRegistrationPayload();

// Generate test item with custom properties
const itemData = ItemDataManager.generateCreatePayload({
  category: 'Electronics',
  price_per_day: 50.00
});

// Generate future booking dates
const dates = BookingDateHelper.generateFutureDateRange(7, 3);
```

### Fixtures
Static test data is available in JSON fixtures:
- Predefined user profiles
- Sample items across categories  
- Booking scenarios
- Category hierarchies

## 🚦 Best Practices

### Test Independence
- Each test can run in isolation
- Proper cleanup after test completion
- No dependencies between test files

### Error Scenarios
- Comprehensive negative testing
- Edge case validation
- Security testing (authentication, authorization)
- Rate limiting verification

### Performance
- Concurrent operation testing
- Response time monitoring
- Resource usage tracking
- Cleanup verification

### Maintainability
- Clear test documentation
- Modular helper functions
- Type-safe implementations
- Consistent naming conventions

## 🐛 Debugging

### Common Issues

1. **API Server Not Running**
   ```bash
   # Start the backend server
   npm run dev
   ```

2. **Port Conflicts**
   - Ensure backend is running on port 5000
   - Update `cypress.config.ts` if using different port

3. **Database State Issues**
   - Tests create/cleanup their own data
   - Consider database reset between test runs

### Debug Mode

Run tests with additional logging:
```bash
DEBUG=cypress:* npm run test:open
```

### Screenshots and Videos
- Automatic screenshots on failure
- Video recording in headless mode
- Available in `cypress/screenshots` and `cypress/videos`

## 📈 Reporting

### Built-in Reports
- Cypress Dashboard integration (with record key)
- Console output with test results
- Screenshots and videos for failures

### Custom Reporting
Tests include custom logging for:
- Performance metrics
- Test execution summaries
- Data cleanup status
- Cross-entity validation results

## 🤝 Contributing

### Adding New Tests

1. **Create test data** in appropriate `/data` file
2. **Add helper functions** in `/support/helpers`
3. **Write focused tests** in relevant domain folder
4. **Update documentation** as needed

### Test Naming Convention

```typescript
describe('API Domain - Test Category', () => {
  describe('Specific Feature', () => {
    it('should perform specific action with expected result', () => {
      // Test implementation
    });
  });
});
```

### Code Quality
- TypeScript for type safety
- ESLint configuration
- Consistent code formatting
- Comprehensive error handling

## 📚 Resources

- [Cypress Documentation](https://docs.cypress.io)
- [API Testing Best Practices](https://docs.cypress.io/guides/guides/best-practices)
- [TypeScript with Cypress](https://docs.cypress.io/guides/tooling/typescript-support)

---

**🎯 This test suite provides comprehensive coverage of the P2P platform API with enterprise-grade architecture and maintainability.**