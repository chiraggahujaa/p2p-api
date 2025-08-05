# P2P Rental Platform - Backend

A Node.js/TypeScript backend API for a peer-to-peer rental marketplace where users can rent and lend items.

## 🚀 Tech Stack

- **Framework**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Supabase
- **Validation**: Zod
- **Payment**: Razorpay integration
- **Security**: Helmet, CORS, Rate Limiting

## 📦 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env` file in the backend root:
```bash
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_postgresql_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=3001
NODE_ENV=development
```

### 3. Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your_project_ref ('https://{PROJECT_REF}.supabase.co')

# Run migrations
supabase db push
```

### 4. Start Development Server
```bash
npm run dev
```

API will be available at `http://localhost:5000`

## 📁 Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # API routes
├── middleware/      # Auth & security middleware
├── types/           # TypeScript interfaces
├── validations/     # Zod schemas
├── utils/           # Helper functions
└── lib/             # External service configs
```

## 📚 API Documentation

- **API Reference**: `API_DOCUMENTATION.md` - Complete API endpoints documentation
- **API Testing**: `API_TESTING.md` - cURL commands for testing all endpoints

## 🧪 API Testing with Cypress

The project includes a comprehensive Cypress test suite for API testing with enterprise-grade architecture.

### Quick Start
```bash
# Install dependencies (if not already done)
npm install

# Start the backend server
npm run dev

# Run all API tests
npm test

# Open Cypress Test Runner (interactive mode)
npm run test:open
```

### Test Structure
```
cypress/
├── data/           # Test data management
├── e2e-tests/      # Test suites organized by feature
│   ├── auth/       # Authentication tests
│   ├── users/      # User management tests
│   ├── items/      # Item management tests
│   ├── bookings/   # Booking tests
│   ├── categories/ # Category tests
│   └── integration/# Integration scenarios
├── fixtures/       # Static test data
├── support/        # Helper functions and API client
│   ├── helpers/    # Reusable helper functions
│   └── request/    # Centralized API client
└── downloads/      # Test artifacts
```

### Environment Setup
Add to your `.env` file:
```bash
# Cypress Configuration
CYPRESS_API_BASE_URL=http://localhost:5000/api
CYPRESS_NODE_ENV=test
```

### Key Features
- **Modular Architecture**: Organized test structure with reusable components
- **Data Management**: Centralized test data with no duplication
- **API Client**: Single point for all API interactions
- **Helper Functions**: Reusable utilities for common operations
- **Type Safety**: Full TypeScript support with proper typing
- **Performance Monitoring**: Built-in performance tracking
- **Error Handling**: Comprehensive error scenarios coverage

## 🗄️ Database Management

```bash
# Start local Supabase
npm run supabase:start

# Push migrations to database
npm run db:push

# Reset database with fresh data
npm run db:reset

# Check Supabase status
npm run supabase:status
```

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database
- `npm run db:push` - Push migrations to database
- `npm run db:reset` - Reset database with fresh data
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:status` - Check Supabase status

### Testing
- `npm test` - Run all Cypress API tests
- `npm run test:open` - Open Cypress Test Runner
- `npm run test:smoke` - Run smoke tests only
- `npm run test:auth` - Test authentication endpoints
- `npm run test:users` - Test user management endpoints
- `npm run test:items` - Test item management endpoints
- `npm run test:bookings` - Test booking endpoints
- `npm run test:integration` - Test integration scenarios

## 📋 Key Features
- **User Management** - Registration, authentication, profiles
- **Item Management** - CRUD operations for rental items
- **Booking System** - Create, manage, and track bookings
- **Payment Processing** - Razorpay integration for secure payments
- **Analytics** - User behavior tracking and metrics
- **Support System** - Ticket management for user issues

---

For frontend setup, check the `../frontend/README.md`