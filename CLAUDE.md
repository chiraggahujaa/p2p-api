# Claude Code Guidelines for P2P API

## Git Commit Guidelines

When creating git commits, do not include:
- Claude watermark ("🤖 Generated with [Claude Code](https://claude.ai/code)")
- Co-authored by Claude attribution ("Co-Authored-By: Claude <noreply@anthropic.com>")

Keep commit messages clean and professional without AI attribution.

## Project Overview

P2P Backend API is a peer-to-peer item sharing platform built with:
- **Runtime**: Node.js with TypeScript (ES Modules)
- **Framework**: Express.js v5
- **Database**: Supabase (PostgreSQL)
- **Testing**: Cypress for E2E testing
- **Architecture**: Layered architecture (Controllers → Services → Database)

## Project Structure

```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── routes/          # API route definitions
├── middleware/      # Express middleware
├── types/           # TypeScript type definitions
├── validations/     # Zod validation schemas
├── utils/           # Utility functions
├── lib/             # External library configurations
└── tests/           # Test utilities
```

## Architecture Patterns

### 1. Layered Architecture
- **Controllers**: Handle HTTP requests/responses, validation, and authentication
- **Services**: Contain business logic, extend BaseService for CRUD operations
- **Database**: Accessed via Supabase client with RLS policies

### 2. Service Layer Pattern
- All services extend `BaseService` class
- Provides consistent CRUD operations with pagination
- Automatic camelCase/snake_case transformation via `DataMapper`
- Built-in error handling and type safety

### 3. Validation Strategy
- **Input Validation**: Zod schemas in `validations/` directory
- **Parameter Validation**: Common validators (`validateId`, `validatePagination`)
- **Enum Validation**: Centralized enum schemas in `validations/common.ts`

## Code Writing Guidelines

### 1. File Naming Conventions
- **Controllers**: `PascalCase` with `Controller` suffix (e.g., `ItemController.ts`)
- **Services**: `PascalCase` with `Service` suffix (e.g., `ItemService.ts`)
- **Routes**: `kebab-case` (e.g., `items.ts`, `auth.ts`)
- **Types**: `camelCase` (e.g., `item.ts`, `user.ts`)
- **Validations**: Match related entity name (e.g., `item.ts`, `user.ts`)

### 2. TypeScript Configuration
- **Module System**: ES Modules (`"type": "module"` in package.json)
- **Import Style**: Always use `.js` extensions in imports (TypeScript requirement for ES modules)
- **Target**: ESNext with strict mode enabled
- **Types**: Centralized in `src/types/` directory

### 3. API Response Format
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string
}

// Paginated Response
{
  success: true,
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}

// Error Response
{
  success: false,
  error: string,
  details?: any
}
```

### 4. Service Class Pattern
```typescript
export class YourService extends BaseService {
  constructor() {
    super('table_name');
  }

  // Custom business methods
  async customMethod(params: any): Promise<ApiResponse<any>> {
    // Implementation
  }
}
```

### 5. Controller Pattern
```typescript
export class YourController {
  private service: YourService;

  constructor() {
    this.service = new YourService();
  }

  async methodName(req: Request, res: Response) {
    try {
      // 1. Authentication check
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // 2. Validation
      const validatedData = schema.parse(req.body);

      // 3. Service call
      const result = await this.service.method(params);

      // 4. Response
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Method error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
```

### 6. Data Transformation
- **Database → API**: Automatic snake_case → camelCase via `DataMapper.toCamelCase()`
- **API → Database**: Manual camelCase → snake_case when needed
- **Consistent**: All API responses use camelCase

### 7. Error Handling
- **Validation Errors**: Return 400 with Zod error details
- **Authentication Errors**: Return 401 with descriptive message  
- **Authorization Errors**: Return 403 with descriptive message
- **Not Found Errors**: Return 404 with descriptive message
- **Server Errors**: Return 500 with generic message, log details

### 8. Security Middleware
- **Helmet**: Security headers configuration
- **Rate Limiting**: Different limits for auth, API, and file uploads
- **CORS**: Configured for allowed origins
- **Request Validation**: Content-type validation for API routes
- **Authentication**: JWT-based auth via middleware

### 9. Database Conventions
- **Table Names**: snake_case
- **Column Names**: snake_case  
- **Primary Keys**: `id` (UUID)
- **Timestamps**: `created_at`, `updated_at` (handled by Supabase)
- **RLS**: Row Level Security enabled on all tables

### 10. Testing Guidelines
- **E2E Tests**: Cypress for comprehensive API testing
- **Test Structure**: Organized by feature (auth, items, bookings, etc.)
- **Test Data**: Managed via fixtures and data generators
- **Environment**: Separate test database configuration

## Development Commands

```bash
# Development
npm run dev                    # Start development server with nodemon

# Building
npm run build                  # Compile TypeScript to dist/
npm start                     # Run production build

# Database
npm run db:push               # Push migrations to database
npm run db:reset              # Reset database with fresh data
npm run supabase:generate     # Generate TypeScript types from database

# Testing
npm test                      # Run all Cypress tests
npm run test:auth            # Run authentication tests
npm run test:items           # Run item-related tests
npm run test:smoke           # Run smoke tests
```

## Common Validation Schemas

Import from `src/validations/common.ts`:
- `uuidSchema` - UUID validation
- `emailSchema` - Email format validation
- `passwordSchema` - Strong password requirements
- `paginationSchema` - Page/limit validation
- `validateId(params)` - Validate UUID in URL params
- `validatePagination(query)` - Validate pagination query params

## File Upload Guidelines

- **Size Limit**: 10MB per file
- **Types**: Images, videos, documents, other
- **Storage**: Supabase Storage with RLS policies
- **Validation**: File type and size validation via `fileUploadSchema`
- **Rate Limiting**: 20 uploads per hour per IP

## Environment Configuration

Required environment variables:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Performance Considerations

- **Pagination**: Always use pagination for list endpoints
- **Data Mapping**: Optimized camelCase conversion in `DataMapper`
- **Database Queries**: Utilize Supabase query optimization
- **Caching**: Rate limiting includes caching headers
- **Compression**: Gzip compression enabled via middleware