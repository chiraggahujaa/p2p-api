# P2P Rental Platform - API Testing with cURL

This file contains cURL commands to test all API endpoints in the P2P rental platform backend.

## 🔧 Environment Variables

Set these variables for easier testing:

```bash
export API_BASE_URL="http://localhost:3001/api"
export ACCESS_TOKEN="your_jwt_access_token_here"
export USER_ID="550e8400-e29b-41d4-a716-446655440001"
export ITEM_ID="850e8400-e29b-41d4-a716-446655440001"
export BOOKING_ID="a50e8400-e29b-41d4-a716-446655440001"
export CATEGORY_ID="your_category_id_here"
```

---

## 🔐 Authentication Endpoints (`/api/auth`)

### 1. Register User
```bash
curl -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "phoneNumber": "+91-9876543210",
    "gender": "male",
    "dob": "1990-05-15",
    "locationId": "location_id_here"
  }'
```

### 2. Login User
```bash
curl -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Get User Profile (Protected)
```bash
curl -X GET "$API_BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4. Refresh Token
```bash
curl -X POST "$API_BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

### 5. Verify Email
```bash
curl -X POST "$API_BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification_token_here"
  }'
```

### 6. Reset Password Request
```bash
curl -X POST "$API_BASE_URL/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

### 7. Update Password (Protected)
```bash
curl -X PUT "$API_BASE_URL/auth/password" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

### 8. Logout (Protected)
```bash
curl -X POST "$API_BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 👥 User Endpoints (`/api/users`)

### Public Routes

### 1. Search Users
```bash
curl -X GET "$API_BASE_URL/users/search?q=john&location=mumbai&limit=10&offset=0"
```

### 2. Get All Users
```bash
curl -X GET "$API_BASE_URL/users/all?limit=20&offset=0"
```

### 3. Get User by ID
```bash
curl -X GET "$API_BASE_URL/users/$USER_ID"
```

### 4. Get User's Items
```bash
curl -X GET "$API_BASE_URL/users/$USER_ID/items?limit=10&offset=0"
```

### Protected Routes (Current User)

### 5. Get My Profile (Protected)
```bash
curl -X GET "$API_BASE_URL/users/me/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 6. Update My Profile (Protected)
```bash
curl -X PUT "$API_BASE_URL/users/me/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith",
    "bio": "Updated bio text",
    "phoneNumber": "+91-9876543211",
    "dobVisibility": "friends"
  }'
```

### 7. Get My Items (Protected)
```bash
curl -X GET "$API_BASE_URL/users/me/items?status=available&limit=10&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 8. Get My Bookings (Protected)
```bash
curl -X GET "$API_BASE_URL/users/me/bookings?status=active&limit=10&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 9. Get My Favorites (Protected)
```bash
curl -X GET "$API_BASE_URL/users/me/favorites?limit=10&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 10. Get My Stats (Protected)
```bash
curl -X GET "$API_BASE_URL/users/me/stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 11. Deactivate Account (Protected)
```bash
curl -X DELETE "$API_BASE_URL/users/me/account" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Admin Routes

### 12. Verify User (Admin)
```bash
curl -X PUT "$API_BASE_URL/users/$USER_ID/verify" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isVerified": true
  }'
```

---

## 📦 Item Endpoints (`/api/items`)

### Public Routes

### 1. Search Items
```bash
curl -X GET "$API_BASE_URL/items/search?q=laptop&category=electronics&location=mumbai&minPrice=100&maxPrice=1000&sortBy=price&sortOrder=asc&limit=10&offset=0"
```

### 2. Get Popular Items
```bash
curl -X GET "$API_BASE_URL/items/popular?limit=10&offset=0"
```

### 3. Get Featured Items
```bash
curl -X GET "$API_BASE_URL/items/featured?limit=10&offset=0"
```

### 4. Get Item by ID
```bash
curl -X GET "$API_BASE_URL/items/$ITEM_ID"
```

### 5. Get Similar Items
```bash
curl -X GET "$API_BASE_URL/items/$ITEM_ID/similar?limit=5"
```

### 6. Check Item Availability
```bash
curl -X GET "$API_BASE_URL/items/$ITEM_ID/availability?startDate=2024-03-01&endDate=2024-03-05"
```

### 7. Get All Items
```bash
curl -X GET "$API_BASE_URL/items?status=available&limit=20&offset=0"
```

### Protected Routes

### 8. Create Item (Protected)
```bash
curl -X POST "$API_BASE_URL/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "MacBook Pro 16 inch",
    "description": "Latest MacBook Pro with M2 chip, perfect for development work",
    "categoryId": "category_id_here",
    "condition": "like_new",
    "securityAmount": 5000.00,
    "rentPricePerDay": 500.00,
    "locationId": "location_id_here",
    "deliveryMode": "both",
    "minRentalDays": 1,
    "maxRentalDays": 7,
    "isNegotiable": true,
    "tags": ["laptop", "macbook", "development"]
  }'
```

### 9. Update Item (Protected)
```bash
curl -X PUT "$API_BASE_URL/items/$ITEM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated MacBook Pro 16 inch",
    "description": "Updated description",
    "rentPricePerDay": 450.00,
    "isNegotiable": false
  }'
```

### 10. Delete Item (Protected)
```bash
curl -X DELETE "$API_BASE_URL/items/$ITEM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Favorites Routes

### 11. Add to Favorites (Protected)
```bash
curl -X POST "$API_BASE_URL/items/$ITEM_ID/favorites" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 12. Remove from Favorites (Protected)
```bash
curl -X DELETE "$API_BASE_URL/items/$ITEM_ID/favorites" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Analytics Routes

### 13. Get Item Analytics (Protected)
```bash
curl -X GET "$API_BASE_URL/items/$ITEM_ID/analytics?startDate=2024-01-01&endDate=2024-03-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 📅 Booking Endpoints (`/api/bookings`)

*All booking routes require authentication*

### 1. Create Booking (Protected)
```bash
curl -X POST "$API_BASE_URL/bookings" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "$ITEM_ID",
    "startDate": "2024-03-15",
    "endDate": "2024-03-18",
    "deliveryMode": "delivery",
    "deliveryAddress": "123 Main Street, Mumbai",
    "specialInstructions": "Please handle with care"
  }'
```

### 2. Get My Bookings (Protected)
```bash
curl -X GET "$API_BASE_URL/bookings/my?status=active&limit=10&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3. Get My Booking Stats (Protected)
```bash
curl -X GET "$API_BASE_URL/bookings/my/stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4. Get Booking by ID (Protected)
```bash
curl -X GET "$API_BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Booking Status Management

### 5. Update Booking Status (Protected)
```bash
curl -X PUT "$API_BASE_URL/bookings/$BOOKING_ID/status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

### 6. Confirm Booking (Protected)
```bash
curl -X PUT "$API_BASE_URL/bookings/$BOOKING_ID/confirm" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 7. Start Booking (Protected)
```bash
curl -X PUT "$API_BASE_URL/bookings/$BOOKING_ID/start" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 8. Complete Booking (Protected)
```bash
curl -X PUT "$API_BASE_URL/bookings/$BOOKING_ID/complete" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 9. Cancel Booking (Protected)
```bash
curl -X PUT "$API_BASE_URL/bookings/$BOOKING_ID/cancel" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Change of plans"
  }'
```

### Rating and Feedback

### 10. Add Rating and Feedback (Protected)
```bash
curl -X POST "$API_BASE_URL/bookings/$BOOKING_ID/rating" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "reviewText": "Excellent item and great owner! Highly recommended.",
    "isAnonymous": false
  }'
```

### Admin Routes

### 11. Get All Bookings (Admin)
```bash
curl -X GET "$API_BASE_URL/bookings?status=pending&limit=20&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 🏷️ Category Endpoints (`/api/categories`)

### Public Routes

### 1. Get All Categories
```bash
curl -X GET "$API_BASE_URL/categories?limit=50&offset=0"
```

### 2. Search Categories
```bash
curl -X GET "$API_BASE_URL/categories/search?q=electronics&limit=10&offset=0"
```

### 3. Get Popular Categories
```bash
curl -X GET "$API_BASE_URL/categories/popular?limit=10"
```

### 4. Get Category by ID
```bash
curl -X GET "$API_BASE_URL/categories/$CATEGORY_ID"
```

### 5. Get Subcategories
```bash
curl -X GET "$API_BASE_URL/categories/$CATEGORY_ID/subcategories"
```

### 6. Get Category Hierarchy
```bash
curl -X GET "$API_BASE_URL/categories/$CATEGORY_ID/hierarchy"
```

### Admin Routes

### 7. Create Category (Admin)
```bash
curl -X POST "$API_BASE_URL/categories" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryName": "Gaming Equipment",
    "description": "Gaming consoles, accessories, and equipment",
    "parentCategoryId": null,
    "iconUrl": "https://example.com/gaming-icon.svg"
  }'
```

### 8. Update Category (Admin)
```bash
curl -X PUT "$API_BASE_URL/categories/$CATEGORY_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryName": "Updated Gaming Equipment",
    "description": "Updated description for gaming equipment"
  }'
```

---

## 🧪 Testing Workflows

### Complete User Journey Test

#### 1. Register and Login
```bash
# Register
curl -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"Test123!","phoneNumber":"+91-9876543210"}'

# Login and save token
TOKEN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' | jq -r '.data.accessToken')
```

#### 2. Browse and Create Item
```bash
# Search items
curl -X GET "$API_BASE_URL/items/search?q=laptop&limit=5"

# Create item
curl -X POST "$API_BASE_URL/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Laptop","description":"Test laptop for rental","categoryId":"cat_id","condition":"good","rentPricePerDay":200}'
```

#### 3. Create and Manage Booking
```bash
# Create booking
BOOKING=$(curl -s -X POST "$API_BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itemId":"item_id","startDate":"2024-04-01","endDate":"2024-04-03"}' | jq -r '.data.id')

# Get booking details
curl -X GET "$API_BASE_URL/bookings/$BOOKING" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Notes

1. **Authentication**: Save the `accessToken` from login response and use it in subsequent requests
2. **IDs**: Replace placeholder IDs with actual IDs from your database
3. **Environment**: Update `API_BASE_URL` for different environments (development, staging, production)
4. **Rate Limiting**: Be mindful of rate limits when running multiple requests
5. **Error Handling**: Check response status codes and error messages for debugging

## 🔍 Response Formats

All responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "meta": { /* pagination info */ }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": [ /* validation errors if any */ ]
}
```