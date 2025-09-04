# 🚀 Development OTP Bypass Guide

## 📋 **Overview**

The backend now includes a **development mode** that bypasses Twilio SMS for OTP verification. This allows you to test the authentication flow without using actual SMS credits.

---

## 🔧 **Development Mode Settings**

**Location:** `src/services/twilio.ts`  
**Setting:** `const DEVELOPMENT_MODE = true;`

### **When DEVELOPMENT_MODE = true:**
- ✅ No SMS sent via Twilio
- ✅ Hardcoded OTP values work
- ✅ Role-based authentication works
- ✅ All database operations work normally

### **When DEVELOPMENT_MODE = false:**
- 📱 Real SMS sent via Twilio Verify API
- 🔐 Real OTP verification required
- 💰 SMS credits consumed

---

## 🧪 **Testing Instructions**

### **Step 1: Send OTP Request**
```bash
curl -X POST http://10.99.20.245:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'
```

**Expected Response:**
```json
{"success":true,"message":"OTP sent successfully"}
```

**Server Logs:**
```
🚀 [DEV MODE] Mock OTP sent to: +919876543210
📱 [DEV MODE] Use OTP codes: 123456 (User) or 666666 (Admin)
```

### **Step 2: Verify OTP (User Role)**
```bash
curl -X POST http://10.99.20.245:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"123456"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP verified and logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "User-3210",
      "phone": "+919876543210",
      "role": "User"
    }
  }
}
```

### **Step 3: Verify OTP (Admin Role)**
```bash
curl -X POST http://10.99.20.245:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919999999999","otp":"666666"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP verified and logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "name": "Admin-9999",
      "phone": "+919999999999",
      "role": "Admin"
    }
  }
}
```

### **Step 4: Test Invalid OTP**
```bash
curl -X POST http://10.99.20.245:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"999999"}'
```

**Expected Response:**
```json
{"success":false,"message":"Invalid OTP"}
```

---

## 🎯 **Hardcoded OTP Values**

| OTP Code | Role | User Creation | Username Pattern |
|----------|------|---------------|------------------|
| `123456` | User | Auto-creates if new | `User-{last4digits}` |
| `666666` | Admin | Auto-creates if new | `Admin-{last4digits}` |
| Any other | ❌ | N/A | Invalid OTP error |

---

## 📱 **Frontend Integration**

### **Updated API Base URL:**
```javascript
// Food-service/contexts/AuthContext.js
const API_BASE = 'http://10.99.20.245:3000/api';
```

### **Frontend Testing Steps:**
1. **Launch React Native app**
2. **Enter any phone number** (e.g., +919876543210)
3. **Tap "Send OTP"** → Should show success message
4. **Enter OTP:**
   - `123456` → Navigates to **User Dashboard**
   - `666666` → Navigates to **Admin Dashboard**
   - Other codes → Shows "Invalid OTP" error

---

## 🔄 **User Role Management**

### **First-time Users:**
- Phone number + OTP determines initial role
- User created in database with appropriate role
- JWT issued with correct role permissions

### **Returning Users:**
- Role can be **updated** based on OTP used
- If existing User uses Admin OTP → upgraded to Admin
- If existing Admin uses User OTP → downgraded to User
- `otpVerified` status always set to `true`

### **Database Structure:**
```sql
-- Users table maintains original structure
users:
  id: serial (auto-increment)
  name: varchar(255) -- "User-3210" or "Admin-9999"
  phone: varchar(20) -- "+919876543210"
  role: enum('User', 'Admin')
  otp_verified: boolean (always true after OTP)
  created_at: timestamp
  updated_at: timestamp
```

---

## 🌐 **Network Configuration**

### **Backend Server:**
- **Bound to:** `0.0.0.0:3000` (accessible from network)
- **Local access:** `http://localhost:3000`
- **Network access:** `http://10.99.20.245:3000`

### **Frontend Configuration:**
- **React Native/Expo:** Must use network IP, not localhost
- **Physical device:** Use `http://10.99.20.245:3000/api`
- **Emulator:** May need different IP based on platform

---

## 🚀 **Production Switch**

### **To Enable Real Twilio SMS:**
1. Open `src/services/twilio.ts`
2. Change `const DEVELOPMENT_MODE = false;`
3. Ensure `.env` has valid Twilio credentials:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_VERIFY_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Restart server: `npm run dev`

### **To Keep Development Mode:**
- Keep `DEVELOPMENT_MODE = true`
- No Twilio credits consumed
- Hardcoded OTP values work
- Perfect for development/testing

---

## ✅ **Ready to Test!**

Your development OTP bypass is now fully functional:

1. ✅ **Backend:** Development mode active
2. ✅ **Database:** Tables created and working
3. ✅ **Network:** Server accessible at `http://10.99.20.245:3000`
4. ✅ **Frontend:** Updated API URL
5. ✅ **Authentication:** Role-based login with hardcoded OTPs

**Test OTP codes:**
- **123456** → User role
- **666666** → Admin role

**Your phone + OTP authentication is ready for development testing!** 🎯
