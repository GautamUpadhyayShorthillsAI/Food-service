# 🔧 Frontend Configuration Setup Guide

## 📋 **Quick Setup Checklist**

### **1. Update API Base URL**

In `contexts/AuthContext.js`, update line 5:

```javascript
// CHANGE THIS LINE:
const API_BASE = 'http://localhost:3000/api';

// TO YOUR BACKEND IP:
const API_BASE = 'http://YOUR_BACKEND_IP:3000/api';
```

### **2. Find Your Backend IP Address**

**On your development machine (where backend is running):**

```bash
# On Linux/Mac:
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows:
ipconfig | findstr "IPv4"

# Example output: 192.168.1.100
```

### **3. Update AuthContext.js**

```javascript
// If your backend IP is 192.168.1.100:
const API_BASE = 'http://192.168.1.100:3000/api';
```

### **4. Install Dependencies**

```bash
cd Food-service
npm install
```

### **5. Start Both Services**

**Terminal 1 - Backend:**
```bash
cd Food-service-backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd Food-service
npm start
```

---

## 🧪 **Testing the Integration**

### **1. Test Backend is Running:**
```bash
curl http://YOUR_BACKEND_IP:3000/api/health
# Should return: {"status":"OK","uptime":...}
```

### **2. Test Frontend:**
1. **Launch app** on device/emulator
2. **Enter phone number** (use real number for SMS)
3. **Receive OTP** via SMS
4. **Verify OTP** → Should navigate to dashboard

### **3. Common Issues & Solutions:**

#### **"Network request failed"**
- ✅ Check backend is running on correct IP
- ✅ Update API_BASE URL in AuthContext.js
- ✅ Ensure phone and backend are on same network

#### **"OTP not received"**
- ✅ Check Twilio credentials in backend `.env`
- ✅ Use real phone number (not test number)
- ✅ Check Twilio console for delivery status

#### **"Invalid OTP"**
- ✅ Enter OTP quickly (10-minute expiry)
- ✅ Check for typos in 6-digit code
- ✅ Try resend OTP if expired

---

## 📱 **Device-Specific Configuration**

### **React Native Development:**

#### **iOS Simulator:**
```javascript
const API_BASE = 'http://localhost:3000/api'; // Works fine
```

#### **Android Emulator:**
```javascript
const API_BASE = 'http://10.0.2.2:3000/api'; // Android emulator special IP
```

#### **Physical Device:**
```javascript
const API_BASE = 'http://192.168.1.100:3000/api'; // Use your machine's IP
```

### **Expo Development:**

#### **Expo Go App (Physical Device):**
```javascript
const API_BASE = 'http://YOUR_LOCAL_IP:3000/api';
```

#### **Expo Development Build:**
```javascript
const API_BASE = 'http://YOUR_LOCAL_IP:3000/api';
```

---

## 🔐 **Backend Environment Setup**

Ensure your backend `.env` file has:

```env
# Database
DATABASE_URL=postgresql://username:password@host/database

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# Twilio (REQUIRED for OTP)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_VERIFY_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 **Ready to Test!**

Once configured, the complete flow should work:

1. **App Launch** → Phone Input Screen
2. **Enter Phone** → OTP sent via SMS  
3. **Enter OTP** → User authenticated
4. **Dashboard** → Role-based navigation (Admin/User)
5. **Logout** → Returns to Phone Input Screen

**Your phone + OTP authentication system is ready!** 🎉
