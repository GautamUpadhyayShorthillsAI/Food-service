# 📋 Food Service API Reference

Complete API documentation for the Food Service Management System backend.

## 🔗 Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📱 Authentication Endpoints

### Send OTP

Send OTP to a phone number for authentication.

**Endpoint:** `POST /auth/send-otp`

**Request Body:**
```json
{
  "phone": "+919876543210"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+919876543210"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Phone number is required",
  "errors": ["Phone number must be between 10-15 digits"]
}
```

### Verify OTP

Verify OTP and receive authentication token.

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "User",
      "otpVerified": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid OTP",
  "errors": ["OTP verification failed"]
}
```

### Complete Registration

Complete user registration after OTP verification (for new users).

**Endpoint:** `POST /auth/register`
**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Doe"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "User",
      "otpVerified": true
    }
  }
}
```

### Get User Profile

Get current user's profile information.

**Endpoint:** `GET /auth/profile`
**Authentication:** Required

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "User",
      "otpVerified": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

## 📅 Booking Endpoints

### Create Booking

Create a new meal booking.

**Endpoint:** `POST /bookings`
**Authentication:** Required

**Request Body:**
```json
{
  "date": "2024-01-20",
  "mealType": "Breakfast",
  "numPeople": 2
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": 123,
      "userId": 1,
      "date": "2024-01-20",
      "mealType": "Breakfast",
      "numPeople": 2,
      "status": "Booked",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Capacity exceeded",
  "errors": ["Only 5 spots remaining for Breakfast on 2024-01-20"]
}
```

### Get User Bookings

Get all bookings for the authenticated user.

**Endpoint:** `GET /bookings`
**Authentication:** Required

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD)
- `status` (optional): Filter by booking status (Booked, Cancelled, Attended)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": {
    "bookings": [
      {
        "id": 123,
        "userId": 1,
        "date": "2024-01-20",
        "mealType": "Breakfast",
        "numPeople": 2,
        "status": "Booked",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### Update Booking Status

Update the status of a booking.

**Endpoint:** `PATCH /bookings/:id/status`
**Authentication:** Required

**Request Body:**
```json
{
  "status": "Cancelled"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "booking": {
      "id": 123,
      "status": "Cancelled",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Get Booking Statistics

Get user's booking statistics.

**Endpoint:** `GET /bookings/stats`
**Authentication:** Required

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "stats": {
      "totalBookings": 25,
      "attendedMeals": 20,
      "missedMeals": 3,
      "cancelledBookings": 2,
      "upcomingBookings": 5
    }
  }
}
```

### Get Meal Capacity

Get capacity information for a specific date.

**Endpoint:** `GET /bookings/capacity/:date`
**Authentication:** Required

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Capacity data retrieved successfully",
  "data": {
    "date": "2024-01-20",
    "capacity": {
      "Breakfast": {
        "booked": 45,
        "total": 100,
        "available": 55,
        "percentage": 45
      },
      "Lunch": {
        "booked": 78,
        "total": 100,
        "available": 22,
        "percentage": 78
      },
      "Dinner": {
        "booked": 32,
        "total": 100,
        "available": 68,
        "percentage": 32
      }
    }
  }
}
```

## 🍽️ Menu Endpoints

### Get Weekly Menu

Get the default weekly menu.

**Endpoint:** `GET /menu/weekly`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Weekly menu retrieved successfully",
  "data": {
    "menu": {
      "Monday": {
        "Breakfast": ["Idli", "Sambar", "Coconut Chutney", "Filter Coffee"],
        "Lunch": ["Basmati Rice", "Dal Tadka", "Mixed Vegetables", "Roti"],
        "Dinner": ["Chapati", "Paneer Curry", "Dal Fry", "Rice"]
      },
      "Tuesday": {
        "Breakfast": ["Poha", "Upma", "Tea"],
        "Lunch": ["Pulao", "Raita", "Pickle", "Papad"],
        "Dinner": ["Roti", "Sabzi", "Dal", "Rice"]
      }
    }
  }
}
```

### Get Daily Menu

Get menu for a specific date (includes daily overrides).

**Endpoint:** `GET /menu/daily/:date`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Daily menu retrieved successfully",
  "data": {
    "date": "2024-01-20",
    "dayOfWeek": "Saturday",
    "source": "daily_override",
    "menu": {
      "Breakfast": ["Special Dosa", "Sambhar", "Chutney"],
      "Lunch": ["Biryani", "Raita", "Boiled Egg"],
      "Dinner": ["Roti", "Special Curry", "Rice"]
    }
  }
}
```

## 👨‍💼 Admin Endpoints

### Register Walk-in Customer

Register a walk-in customer and create booking.

**Endpoint:** `POST /admin/walk-in`
**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "name": "Walk-in Customer",
  "phone": "+919876543210",
  "date": "2024-01-20",
  "mealType": "Lunch",
  "numPeople": 3
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Walk-in customer registered successfully",
  "data": {
    "user": {
      "id": 15,
      "name": "Walk-in Customer",
      "phone": "+919876543210",
      "role": "User"
    },
    "booking": {
      "id": 456,
      "userId": 15,
      "date": "2024-01-20",
      "mealType": "Lunch",
      "numPeople": 3,
      "status": "Attended"
    }
  }
}
```

### Get Daily Menu (Admin)

Get or create daily menu for a specific date.

**Endpoint:** `GET /admin/daily-menu/:date`
**Authentication:** Required (Admin role)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Daily menu retrieved successfully",
  "data": {
    "date": "2024-01-20",
    "menu": {
      "Breakfast": ["Idli", "Sambar", "Chutney"],
      "Lunch": ["Rice", "Dal", "Sabzi"],
      "Dinner": ["Roti", "Curry", "Rice"]
    },
    "source": "default"
  }
}
```

### Create/Update Daily Menu

Create or update menu for a specific date.

**Endpoint:** `POST /admin/daily-menu`
**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "date": "2024-01-20",
  "mealType": "Lunch",
  "dishes": ["Special Biryani", "Raita", "Pickle", "Boiled Egg"]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Daily menu updated successfully",
  "data": {
    "dailyMenu": {
      "id": 10,
      "date": "2024-01-20",
      "mealType": "Lunch",
      "dishes": ["Special Biryani", "Raita", "Pickle", "Boiled Egg"],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

## ❌ Error Responses

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error message 1", "Detailed error message 2"],
  "code": "ERROR_CODE"
}
```

### Common Error Examples

**Invalid Token (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

**Insufficient Permissions (403):**
```json
{
  "success": false,
  "message": "Admin access required",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Phone number is required",
    "OTP must be exactly 6 digits"
  ],
  "code": "VALIDATION_ERROR"
}
```

**Capacity Exceeded (409):**
```json
{
  "success": false,
  "message": "Booking capacity exceeded",
  "errors": ["Only 5 spots remaining for Lunch on 2024-01-20"],
  "code": "CAPACITY_EXCEEDED"
}
```

## 📊 Rate Limiting

API endpoints have the following rate limits:

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `/auth/send-otp` | 5 requests | 15 minutes |
| `/auth/verify-otp` | 10 requests | 15 minutes |
| All other endpoints | 100 requests | 15 minutes |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## 🧪 Testing

### Postman Collection

Import the provided Postman collection for easy API testing:
- `Food-Service-API.postman_collection.json`

### cURL Examples

**Send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

**Create Booking:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2024-01-20",
    "mealType": "Breakfast",
    "numPeople": 2
  }'
```

### Development OTP Codes

For development testing, use these special phone numbers:
- Numbers ending in `1111`: Auto-approved as Admin
- Numbers ending in `2222`: Auto-approved as User
- Other numbers: Require real Twilio OTP verification

Example: `+919876541111` will auto-login as Admin without real OTP.
