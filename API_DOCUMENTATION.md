# P2P Platform API Documentation

## Overview

This is a comprehensive REST API for a peer-to-peer rental/sharing platform built with Express.js, TypeScript, Zod validation, and Supabase.

**Base URL**: `http://localhost:5000/api`

## Authentication

Most endpoints require authentication using JWT tokens obtained from the auth endpoints.

**Authentication Header**: `Authorization: Bearer <token>`

## Rate Limits

- **General**: 1000 requests per 15 minutes
- **Auth endpoints**: 10 requests per 15 minutes  
- **API endpoints**: 200 requests per 15 minutes
- **File uploads**: 20 uploads per hour
- **Search**: 100 searches per 5 minutes

## Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": any, // Present on success
  "message": string, // Optional
  "error": string, // Present on failure
  "details": any // Validation errors or additional info
}
```

### Paginated Responses

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔐 Authentication Endpoints

### POST `/auth/register`
Register a new user account.

**Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**: User object with session

### POST `/auth/login`
Login to existing account.

**Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**: User object with session

### POST `/auth/logout`
Logout current user. Requires authentication.

**Response**: Success message

### GET `/auth/profile`
Get current user profile. Requires authentication.

**Response**: Current user details with location

### POST `/auth/refresh`
Refresh access token.

**Body**:
```json
{
  "refresh_token": "refresh_token_here"
}
```

### POST `/auth/verify`
Verify email with OTP.

**Body**:
```json
{
  "token": "verification_token",
  "type": "signup", // or "email", "recovery"
  "email": "john@example.com" // optional
}
```

### POST `/auth/reset-password`
Request password reset email.

**Body**:
```json
{
  "email": "john@example.com"
}
```

### PUT `/auth/password`
Update password. Requires authentication.

**Body**:
```json
{
  "password": "newpassword123"
}
```

---

## 👥 User Endpoints

### GET `/users/me/profile`
Get current user profile. Requires authentication.

### PUT `/users/me/profile`
Update current user profile. Requires authentication.

**Body**:
```json
{
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "bio": "User bio",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### GET `/users/me/items`
Get current user's items. Requires authentication.

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

### GET `/users/me/bookings`
Get current user's bookings. Requires authentication.

**Query Parameters**:
- `page`, `limit`: Pagination
- `role`: `lender` | `borrower` | `both` (default: both)

### GET `/users/me/favorites`
Get current user's favorite items. Requires authentication.

### GET `/users/me/stats`
Get current user's statistics. Requires authentication.

### DELETE `/users/me/account`
Deactivate current user account. Requires authentication.

### GET `/users/search`
Search users.

**Query Parameters**:
- `search` (required): Search term
- `page`, `limit`: Pagination

### GET `/users/:id`
Get public user profile by ID.

### GET `/users/:id/items`
Get user's public items by user ID.

---

## 📦 Item Endpoints

### POST `/items`
Create a new item. Requires authentication.

**Body**:
```json
{
  "title": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "category_id": "uuid-here",
  "condition": "like_new",
  "security_amount": 5000,
  "rent_price_per_day": 500,
  "location_id": "uuid-here",
  "delivery_mode": "both",
  "min_rental_days": 1,
  "max_rental_days": 30,
  "is_negotiable": true,
  "tags": ["gaming", "laptop", "high-performance"]
}
```

### GET `/items/:id`
Get item details by ID. Optional authentication for view tracking.

### PUT `/items/:id`
Update item. Requires authentication and ownership.

### DELETE `/items/:id`
Delete item (soft delete). Requires authentication and ownership.

### GET `/items/search`
Search items with advanced filters.

**Query Parameters**:
- `search` (string): Search term
- `category_id` (uuid): Filter by category
- `location[latitude]`, `location[longitude]`, `location[radius]`: Location-based search
- `price_range[min]`, `price_range[max]`: Price filters
- `condition`: Array of conditions
- `delivery_mode`: Array of delivery modes
- `sort_by`: `price_asc` | `price_desc` | `rating` | `distance` | `newest` | `popular`
- `page`, `limit`: Pagination

### GET `/items/:id/similar`
Get similar items.

**Query Parameters**:
- `limit` (number): Number of items (default: 6)

### GET `/items/:id/availability`
Check item availability for dates.

**Query Parameters**:
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)

### POST `/items/:id/favorites`
Add item to favorites. Requires authentication.

### DELETE `/items/:id/favorites`
Remove item from favorites. Requires authentication.

### GET `/items/:id/analytics`
Get item analytics for owners. Requires authentication and ownership.

### GET `/items/popular`
Get popular items.

### GET `/items/featured`
Get featured/highly-rated items.

---

## 📅 Booking Endpoints

All booking endpoints require authentication.

### POST `/bookings`
Create a new booking.

**Body**:
```json
{
  "item_id": "uuid-here",
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "delivery_mode": "delivery",
  "pickup_location": "uuid-here",
  "delivery_location": "uuid-here",
  "special_instructions": "Handle with care"
}
```

### GET `/bookings/:id`
Get booking details by ID.

### GET `/bookings/my`
Get current user's bookings.

**Query Parameters**:
- `status`: Array of booking statuses
- `role`: `lender` | `borrower` | `both`
- `date_range[start]`, `date_range[end]`: Date filters
- `page`, `limit`: Pagination

### GET `/bookings/my/stats`
Get current user's booking statistics.

### PUT `/bookings/:id/status`
Update booking status.

**Body**:
```json
{
  "status": "confirmed", // or cancelled, in_progress, completed, disputed
  "reason": "Optional reason for cancellation"
}
```

### PUT `/bookings/:id/confirm`
Confirm booking (lender only).

### PUT `/bookings/:id/start`
Start booking (mark as in progress).

### PUT `/bookings/:id/complete`
Complete booking.

### PUT `/bookings/:id/cancel`
Cancel booking.

**Body**:
```json
{
  "reason": "Reason for cancellation"
}
```

### POST `/bookings/:id/rating`
Add rating and feedback after booking completion.

**Body**:
```json
{
  "rating": 5, // 1-5
  "feedback": "Great experience!"
}
```

---

## 🏷️ Category Endpoints

### GET `/categories`
Get all categories.

**Query Parameters**:
- `hierarchical`: `true` to get nested structure
- `include_subcategories`: `false` to get only parent categories

### GET `/categories/:id`
Get category by ID with relations.

### GET `/categories/:id/subcategories`
Get subcategories of a category.

### GET `/categories/:id/hierarchy`
Get category hierarchy (breadcrumb).

### GET `/categories/search`
Search categories.

**Query Parameters**:
- `search` (required): Search term

### GET `/categories/popular`
Get popular categories based on item count.

**Query Parameters**:
- `limit` (number): Number of categories (default: 10)

### POST `/categories`
Create category (admin only). Requires authentication.

**Body**:
```json
{
  "category_name": "Electronics",
  "description": "Electronic devices and gadgets",
  "icon_url": "https://example.com/icon.png",
  "banner_url": "https://example.com/banner.jpg",
  "parent_category_id": "uuid-here", // optional
  "sort_order": 1
}
```

### PUT `/categories/:id`
Update category (admin only). Requires authentication.

---

## 📊 Data Models

### User
```typescript
interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  dob?: string;
  trust_score: number;
  is_verified: boolean;
  avatar_url?: string;
  bio?: string;
  location?: Location;
  created_at: string;
  updated_at: string;
}
```

### Item
```typescript
interface Item {
  item_id: string;
  user_id: string;
  title: string;
  description?: string;
  category_id: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  security_amount: number;
  rent_price_per_day: number;
  location_id: string;
  delivery_mode: 'pickup' | 'delivery' | 'both';
  min_rental_days: number;
  max_rental_days: number;
  is_negotiable: boolean;
  tags?: string[];
  view_count: number;
  booking_count: number;
  rating_average: number;
  status: 'available' | 'booked' | 'in_transit' | 'delivered' | 'returned' | 'maintenance' | 'inactive';
  created_at: string;
  updated_at: string;
}
```

### Booking
```typescript
interface Booking {
  booking_id: string;
  item_id: string;
  lender_user_id: string;
  borrower_user_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  daily_rate: number;
  total_rent: number;
  security_amount: number;
  platform_fee: number;
  total_amount: number;
  booking_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  delivery_mode: 'pickup' | 'delivery' | 'both';
  special_instructions?: string;
  rating_by_lender?: number;
  rating_by_borrower?: number;
  feedback_by_lender?: string;
  feedback_by_borrower?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 🚨 Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `408` - Request Timeout
- `413` - Payload Too Large
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error
- `503` - Service Unavailable (maintenance mode)

### Error Response Example
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["email"],
      "message": "Expected string, received number"
    }
  ]
}
```

---

## 🔧 Setup & Configuration

### Environment Variables
```env
# Server
PORT=5000
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Frontend
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=your_jwt_secret
```

### Running the Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Database Setup
1. Run migrations in order:
   - `001_create_core_tables.sql`
   - `002_create_business_tables.sql`
   - `003_create_rls_and_functions.sql`
   - `004_seed_data.sql`

---

## 📈 Advanced Features

### Location-Based Search
Uses PostGIS for efficient geographical queries. Items can be searched within a specified radius.

### Real-Time Analytics
Track item views, booking conversion rates, and user engagement metrics.

### Trust Score System
Automatic calculation based on user ratings and successful transactions.

### Comprehensive Validation
All inputs are validated using Zod schemas with detailed error messages.

### Rate Limiting
Protects against abuse with configurable rate limits per endpoint type.

### Security Headers
Helmet.js provides comprehensive security headers including CSP, HSTS, etc.

---

## 🔄 API Versioning

Current version: `v1`
All endpoints are currently unversioned but can be prefixed with `/v1` in the future for backward compatibility.

---

This documentation covers all available endpoints and their usage. For additional support or feature requests, please refer to the project repository.