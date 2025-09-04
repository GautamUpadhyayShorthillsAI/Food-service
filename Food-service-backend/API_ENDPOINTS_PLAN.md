# Food Service Backend API Endpoints Plan

## Current Frontend Analysis & Required APIs

### 🔍 **Hardcoded Data Found:**

#### **LoginScreen.js** - Lines 14-22
```javascript
// HARDCODED: Admin credentials
if (trimmedEmail === 'test@gmail.com' && trimmedPassword === 'test123') {
  // Navigate to Admin Dashboard
}
```

#### **UserDashboardScreen.js** - Lines 38-74  
```javascript
// HARDCODED: Complete weekly menu templates
const menuTemplates = {
  Monday: {
    breakfast: ['Idli', 'Sambar', 'Coconut Chutney', 'Filter Coffee'],
    lunch: ['Basmati Rice', 'Dal Tadka', 'Mixed Vegetables', 'Roti', 'Pickle'],
    // ... more hardcoded menus
  }
}
```

#### **AdminDashboardScreen.js** - Lines 15-64
```javascript
// HARDCODED: User attendance data
const [attendanceData, setAttendanceData] = useState([
  { id: '1', name: 'John Smith', peopleCount: 2, attended: false },
  // ... 8 hardcoded users
]);
```

---

## 📋 **Required Backend API Endpoints**

### **1. Authentication APIs**
```http
POST   /api/auth/send-otp           # Send OTP to phone number
POST   /api/auth/verify-otp         # Verify OTP and login
POST   /api/auth/logout             # Logout user
GET    /api/auth/me                 # Get current user info
POST   /api/auth/register           # Register new user (admin only)
```

**Frontend Changes Needed:**
- Replace hardcoded login with phone/OTP system
- Add OTP input screen
- Store JWT token for authentication
- Add user context/state management

---

### **2. Menu Management APIs**

#### **For UserDashboardScreen.js `getMenuForDate()` function:**
```http
GET    /api/menu/date/:date         # Get menu for specific date
GET    /api/menu/weekly             # Get default weekly menu
```

**Response Example:**
```json
{
  "date": "2024-01-15",
  "dayOfWeek": "Monday", 
  "source": "daily_override", // or "default_menu"
  "meals": {
    "breakfast": ["Idli", "Sambar", "Coconut Chutney"],
    "lunch": ["Rice", "Dal", "Sabzi"],
    "dinner": ["Roti", "Curry", "Salad"]
  }
}
```

#### **Admin Menu Management:**
```http
POST   /api/admin/menu/weekly       # Create/update weekly menu
POST   /api/admin/menu/daily        # Create daily menu override
PUT    /api/admin/menu/daily/:id    # Update daily menu
DELETE /api/admin/menu/daily/:id    # Delete daily menu override
```

**Frontend Changes:**
- Replace `menuTemplates` object with API calls
- Add loading states for menu data
- Cache menu data for performance

---

### **3. Booking Management APIs**

#### **For UserDashboardScreen.js registration system:**
```http
GET    /api/bookings/user           # Get current user's bookings
POST   /api/bookings                # Create new booking
PUT    /api/bookings/:id            # Update booking (change people count)
DELETE /api/bookings/:id            # Cancel booking
```

**Request Example:**
```json
{
  "date": "2024-01-15",
  "mealType": "breakfast",
  "numPeople": 2
}
```

**Response Example:**
```json
{
  "id": 123,
  "date": "2024-01-15", 
  "mealType": "breakfast",
  "numPeople": 2,
  "status": "Booked",
  "createdAt": "2024-01-10T10:00:00Z"
}
```

**Frontend Changes:**
- Replace local `registrations` state with server data
- Add API calls in `handleMealRegister()` and `handleConfirmRegistration()`
- Add proper error handling and loading states

---

### **4. Admin Dashboard APIs**

#### **For AdminDashboardScreen.js attendance tracking:**
```http
GET    /api/admin/bookings/date/:date/meal/:mealType  # Get bookings for date/meal
PUT    /api/admin/bookings/:id/attendance             # Mark attendance
GET    /api/admin/stats/date/:date                    # Get daily statistics
POST   /api/admin/walkins                             # Record walk-in customers
```

**Bookings Response:**
```json
[
  {
    "id": 123,
    "user": {
      "id": 1,
      "name": "John Smith",
      "phone": "+91-9876543210"
    },
    "numPeople": 2,
    "status": "Booked",
    "attended": false
  }
]
```

**Stats Response:**
```json
{
  "date": "2024-01-15",
  "totalBookings": 8,
  "totalPeople": 18,
  "attendedBookings": 6,
  "attendedPeople": 15,
  "walkIns": 5
}
```

**Frontend Changes:**
- Replace hardcoded `attendanceData` with API calls
- Connect `handleAttendanceToggle()` to attendance API
- Add walk-in tracking to server

---

### **5. User Management APIs (Admin)**
```http
GET    /api/admin/users             # Get all users
PUT    /api/admin/users/:id         # Update user details
DELETE /api/admin/users/:id         # Delete user (soft delete)
```

---

## 🏗️ **Implementation Priority**

### **Phase 1: Core Authentication**
1. ✅ Phone-based OTP login system
2. ✅ User context/state management
3. ✅ JWT token handling

### **Phase 2: Menu System** 
4. ✅ Dynamic menu loading from database
5. ✅ Daily menu override functionality
6. ✅ Admin menu management

### **Phase 3: Booking System**
7. ✅ User booking CRUD operations
8. ✅ Booking persistence and synchronization
9. ✅ Real-time booking status

### **Phase 4: Admin Features**
10. ✅ Admin attendance tracking
11. ✅ Walk-in customer management
12. ✅ Statistics and reporting

---

## 📱 **Frontend Architecture Changes Needed**

### **1. Add State Management**
```javascript
// Context for user authentication
const AuthContext = createContext();

// Context for app data
const AppDataContext = createContext();
```

### **2. Add API Service Layer**
```javascript
// services/api.js
const API_BASE = 'http://your-backend-url/api';

export const authAPI = {
  sendOTP: (phone) => fetch(`${API_BASE}/auth/send-otp`, {...}),
  verifyOTP: (phone, otp) => fetch(`${API_BASE}/auth/verify-otp`, {...}),
  // ...
};

export const menuAPI = {
  getMenuForDate: (date) => fetch(`${API_BASE}/menu/date/${date}`),
  // ...
};
```

### **3. Add Loading & Error States**
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### **4. Add Phone/OTP Login Screen**
New screen to replace hardcoded email/password login.

---

## 🔧 **Database Schema Validation**

Your existing schema already supports all these APIs:

✅ **Users table** - phone-based auth, roles  
✅ **Menu table** - weekly default menus with JSONB dishes  
✅ **Daily_menu table** - date-specific overrides  
✅ **Bookings table** - user bookings with attendance tracking  

---

## 🚀 **Next Steps**

1. **Start with Authentication APIs** - Replace hardcoded login
2. **Implement Menu APIs** - Replace hardcoded menu templates  
3. **Build Booking APIs** - Replace local registration state
4. **Add Admin APIs** - Replace hardcoded attendance data

Would you like me to start implementing any of these specific API endpoints?
