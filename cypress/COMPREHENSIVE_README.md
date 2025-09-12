# P2P API Comprehensive Cypress Test Suite

This directory contains a comprehensive, enterprise-grade Cypress test suite for the P2P API backend. The test suite follows modern testing best practices and is designed for scalability, maintainability, and reliable CI/CD integration.

## 🏗️ Architecture Overview

### Folder Structure

```
cypress/
├── e2e/                          # Test specifications
│   ├── api/                      # API-only tests organized by domain
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── users/                # User management endpoints
│   │   ├── addresses/            # Address management endpoints
│   │   ├── bookings/             # Booking system endpoints
│   │   ├── categories/           # Category management endpoints
│   │   ├── cities/               # City/location endpoints
│   │   ├── items/                # Item management endpoints
│   │   └── files/                # File upload endpoints
│   ├── integration/              # Cross-system integration tests
│   │   ├── auth-flow/            # End-to-end authentication flows
│   │   ├── booking-workflow/     # Complete booking processes
│   │   └── user-journey/         # Multi-step user scenarios
│   ├── smoke/                    # Critical path smoke tests
│   └── regression/               # Comprehensive regression suites
├── fixtures/
│   ├── api/                      # Test data organized by domain
│   │   ├── users/                # User test data variations
│   │   ├── addresses/            # Address test data
│   │   ├── bookings/             # Booking scenarios
│   │   ├── categories/           # Category test data
│   │   └── items/                # Item test data
│   ├── schemas/                  # JSON schemas for response validation
│   └── environments/             # Environment-specific test data
├── support/
│   ├── commands/                 # Custom commands organized by domain
│   │   ├── api-commands.ts       # Generic API testing commands
│   │   ├── auth-commands.ts      # Authentication utilities
│   │   ├── database-commands.ts  # Database seeding/cleanup
│   │   ├── validation-commands.ts # Response validation helpers
│   │   └── performance-commands.ts # Performance testing utilities
│   ├── helpers/                  # Pure utility functions
│   │   ├── data-generators.ts    # Dynamic test data generation
│   │   ├── api-utils.ts          # API call abstractions
│   │   └── assertion-utils.ts    # Custom assertion helpers
│   ├── interceptors/             # Network request management
│   ├── e2e.ts                   # Global test setup
│   └── commands.ts              # Command registry
├── config/                       # Environment configurations
│   ├── development.json          # Development environment settings
│   ├── staging.json              # Staging environment settings
│   └── production.json           # Production environment settings
└── plugins/                      # Custom Cypress plugins
    ├── database-plugin.js        # Database operations
    └── performance-plugin.js     # Performance monitoring
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Cypress 13+
- Access to the P2P API (running locally or deployed)

### Installation

The test suite is already configured in the project. Dependencies are included in the main `package.json`.

### Environment Setup

1. **Configure Environment Variables**:
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Set required variables
   API_BASE_URL=http://localhost:5000/api
   DATABASE_URL=your_database_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```

2. **Choose Environment Configuration**:
   - Development: Uses `cypress/config/development.json`
   - Staging: Uses `cypress/config/staging.json`
   - Production: Uses `cypress/config/production.json`

## 🧪 Running Tests

### Basic Test Execution

```bash
# Run all tests
npm run test

# Open Cypress Test Runner
npm run test:open

# Run tests for specific domains
npm run test:auth
npm run test:items
npm run test:bookings
npm run test:users
npm run test:categories
```

### Test Categories

```bash
# Smoke tests (critical paths)
npm run test:smoke

# Integration tests
npm run test:integration

# Regression tests
npm run test:regression
```

### Environment-Specific Testing

```bash
# Development environment
npm run test:dev

# Staging environment
npm run test:staging

# Production smoke tests only
npm run test:prod
```

### Performance Testing

```bash
# Performance tests with metrics
npm run test:performance

# Load testing (if enabled)
npm run test:load
```

### CI/CD Integration

```bash
# Headless CI execution
npm run test:ci

# Parallel execution with recording
npm run test:ci:parallel

# Smoke tests for quick CI feedback
npm run test:ci:smoke
```

### Advanced Options

```bash
# Run with specific browser
npm run test:chrome
npm run test:firefox
npm run test:edge

# Tag-based test execution
TEST_TAGS=smoke,auth npm run test:tags

# Fail-fast mode
npm run test:fast

# Parallel execution
npm run test:parallel
```

## 🏷️ Test Organization

### Test Categories

- **API Tests**: Direct API endpoint testing without UI
- **Integration Tests**: Cross-system functionality testing
- **Smoke Tests**: Critical path verification
- **Regression Tests**: Comprehensive feature testing
- **Performance Tests**: Response time and load testing

### Test Naming Conventions

- Files: `feature-area.cy.ts` (e.g., `auth-registration.cy.ts`)
- Test suites: Descriptive names (`describe('Authentication - User Registration')`)
- Test cases: Behavior-driven (`it('should successfully register a new user')`)

## 📊 Custom Commands

### API Testing Commands

```typescript
// Enhanced API requests with built-in validation
cy.apiRequest({
  method: 'POST',
  url: '/users',
  body: userData,
  auth: { bearer: token }
})

// Response validation
cy.validateStatusCode(response, 200)
cy.validateApiResponse(response, expectedSchema)
cy.validatePaginatedResponse(response)

// Performance testing
cy.performanceTest('user_creation', requestCallback, 2000)
```

### Authentication Commands

```typescript
// User authentication
cy.login(credentials)
cy.loginAsTestUser('borrower')
cy.logout()

// Authentication state
cy.verifyAuthenticated()
cy.verifyNotAuthenticated()
cy.getAuthToken()
cy.setAuthToken(token)
```

### Database Commands

```typescript
// Database operations
cy.seedDatabase({ users: true, categories: true })
cy.cleanDatabase({ preserveTestUsers: true })
cy.createTestUser(userData)
cy.createTestItem(itemData)
```

### Validation Commands

```typescript
// Schema validation
cy.validateUserSchema(user)
cy.validateItemSchema(item)
cy.validateBookingSchema(booking)

// Format validation
cy.validateEmailFormat(email)
cy.validateUuidFormat(uuid)
cy.validateDateFormat(date)
```

## 🎯 Test Data Management

### Static Test Data

Test fixtures are organized by domain in `cypress/fixtures/api/`:

```typescript
// Load test data
cy.fixture('api/users/test-users').then((users) => {
  // Use test data
})
```

### Dynamic Test Data Generation

```typescript
import { DataGenerators } from '../support/helpers/data-generators'

// Generate test data
const user = DataGenerators.generateTestUser()
const item = DataGenerators.generateTestItem()
const booking = DataGenerators.generateTestBooking()
```

### Schema Validation

Response schemas are defined in `cypress/fixtures/schemas/api-schemas.json`:

```typescript
cy.fixture('schemas/api-schemas').then((schemas) => {
  cy.validateSchema(response.body, schemas.user_schema)
})
```

## ⚡ Performance Testing

### Response Time Validation

```typescript
// Individual endpoint performance
cy.performanceTest('endpoint_name', () => {
  return cy.apiRequest({ method: 'GET', url: '/endpoint' })
}, 2000) // 2 second threshold

// Batch performance testing
cy.benchmarkEndpoint('/items', 10) // 10 samples
```

### Load Testing

```typescript
// Concurrent requests
cy.concurrencyTest('/items', 20) // 20 concurrent requests

// Load testing with ramp-up
cy.loadTest({
  endpoint: '/items',
  method: 'GET',
  concurrency: 10,
  requests: 100,
  rampUpTime: 5000
})
```

## 🔧 Configuration

### Environment Configuration

Each environment has its own configuration file:

```json
{
  "environment": "development",
  "api": {
    "baseUrl": "http://localhost:5000/api",
    "timeout": 15000
  },
  "performance": {
    "thresholds": {
      "fast": 1000,
      "medium": 3000,
      "slow": 5000
    }
  },
  "features": {
    "fileUpload": true,
    "emailNotifications": false
  }
}
```

### Feature Flags

Tests can be conditionally executed based on environment features:

```typescript
if (Cypress.env('FEATURES').fileUpload) {
  // Run file upload tests
}
```

## 📈 Reporting and Monitoring

### Test Results

- Screenshots on failure (configurable)
- Video recordings (environment-dependent)
- Performance metrics logging
- Custom test reports

### CI/CD Integration

The test suite integrates with:
- GitHub Actions
- Jenkins
- CircleCI
- Any CI/CD system supporting npm scripts

### Parallel Execution

Tests are designed for parallel execution:
- Independent test isolation
- No shared state between tests
- Concurrent-safe data generation
- Environment-specific configuration

## 🛠️ Maintenance

### Adding New Tests

1. Create test file in appropriate domain folder
2. Follow naming conventions
3. Use existing custom commands
4. Add test data to fixtures if needed
5. Update this README if adding new patterns

### Updating Test Data

1. Update fixtures in `cypress/fixtures/api/`
2. Update schemas in `cypress/fixtures/schemas/`
3. Regenerate dynamic data generators if needed

### Performance Optimization

1. Use `test:fast` for fail-fast execution
2. Run targeted test suites during development
3. Use `test:smoke` for quick feedback
4. Leverage parallel execution in CI

## 🔍 Troubleshooting

### Common Issues

1. **API not accessible**: Check `API_BASE_URL` in environment configuration
2. **Database connection errors**: Verify database credentials and connectivity
3. **Authentication failures**: Ensure test users exist or can be created
4. **Timeout errors**: Increase timeout values in environment config
5. **Flaky tests**: Check test isolation and data cleanup

### Debug Mode

```bash
# Enable debug logging
DEBUG=cypress:* npm run test

# Run specific test with logging
npm run test -- --spec "cypress/e2e/api/auth/auth-login.cy.ts"
```

### Performance Issues

1. Check network connectivity to API
2. Verify database performance
3. Review test data size and complexity
4. Use performance profiling commands

## 📚 Best Practices

### Test Design

- **Atomic Tests**: Each test should be independent
- **Clear Naming**: Descriptive test and variable names
- **Data Isolation**: Generate unique test data
- **Error Handling**: Proper assertion messages
- **Performance Awareness**: Include response time validation

### Data Management

- Use data generators for unique test data
- Clean up test data after test completion
- Avoid hardcoded test data in production environments
- Use schema validation for response integrity

### CI/CD Integration

- Run smoke tests on every commit
- Full test suite on PR/merge
- Performance tests on scheduled basis
- Environment-specific test execution

---

## 🤝 Contributing

When contributing to the test suite:

1. Follow the established folder structure
2. Use existing custom commands and patterns
3. Add appropriate test data and schemas
4. Update documentation for new features
5. Ensure tests pass in all target environments

## 📞 Support

For issues with the test suite:
1. Check this README for common solutions
2. Review Cypress documentation
3. Check environment-specific configurations
4. Review test logs and error messages

---

**Happy Testing! 🚀**