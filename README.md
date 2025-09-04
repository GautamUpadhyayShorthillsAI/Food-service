# Food Service Management System

A comprehensive meal booking and management system built with React Native (Expo) frontend and Node.js/TypeScript backend. The system enables users to book meals through a calendar interface and provides administrators with comprehensive booking management, walk-in registration, and capacity tracking capabilities.

## 🚀 Features

### User Features
- **Phone-based Authentication**: OTP verification via Twilio
- **Calendar-Based Booking**: Select dates and view available meals
- **Meal Registration**: Book meals with specified number of people
- **Booking Management**: Cancel existing bookings
- **Dashboard Summary**: Track total bookings, attended meals, and missed meals
- **Real-time Updates**: Booking status updates in real-time

### Admin Features
- **Comprehensive Dashboard**: View all bookings for selected dates
- **Attendance Management**: Mark users as present for booked meals
- **Walk-in Registration**: Register walk-in customers with automatic user creation
- **Meal Capacity Tracking**: Real-time capacity monitoring (100 people per meal)
- **Menu Management**: Manage daily and weekly menus
- **Visual Capacity Indicators**: Progress bars showing meal utilization

### System Features
- **Capacity Limits**: 100-person limit per meal type per day
- **Real-time Updates**: Live booking and capacity updates
- **Role-based Access**: User and Admin role management
- **Data Persistence**: PostgreSQL database with optimized schema
- **Responsive Design**: Works on mobile and desktop devices

## 🛠️ Tech Stack

### Frontend (React Native - Expo)
- **React Native** 0.79.5 - Mobile app framework
- **Expo** ~53.0.22 - Development platform
- **React Navigation** - Navigation library
- **React Native Calendars** - Calendar component
- **AsyncStorage** - Local data storage

### Backend (Node.js/TypeScript)
- **Node.js** with **TypeScript** - Runtime and language
- **Express.js** 5.1.0 - Web framework
- **Drizzle ORM** 0.44.5 - Database ORM
- **PostgreSQL** - Database (via NeonDB)
- **Twilio** 5.3.4 - SMS/OTP service
- **JWT** - Authentication tokens
- **Zod** - Schema validation

## 📁 Project Structure

```
fd-service/
├── Food-service/                    # React Native Frontend
│   ├── App.js                       # Main app component
│   ├── app.json                     # Expo configuration
│   ├── contexts/
│   │   └── AuthContext.js           # Authentication & API context
│   ├── navigation/
│   │   └── AppNavigator.js          # Navigation configuration
│   ├── screens/                     # App screens
│   │   ├── LoginScreen.js
│   │   ├── PhoneInputScreen.js
│   │   ├── OTPVerificationScreen.js
│   │   ├── UserRegistrationScreen.js
│   │   ├── UserDashboardScreen.js
│   │   ├── AdminDashboardScreen.js
│   │   └── AdminMenuManagementScreen.js
│   ├── assets/                      # Images and icons
│   └── package.json
│
├── Food-service-backend/            # Node.js Backend
│   ├── src/
│   │   ├── index.ts                 # Server entry point
│   │   ├── config.ts                # Configuration management
│   │   ├── db/
│   │   │   ├── index.ts             # Database connection
│   │   │   └── schema.ts            # Database schema (Drizzle)
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT authentication middleware
│   │   ├── routes/                  # API route handlers
│   │   │   ├── auth.ts              # Authentication routes
│   │   │   ├── bookings.ts          # Booking management routes
│   │   │   ├── admin.ts             # Admin-specific routes
│   │   │   └── menu.ts              # Menu management routes
│   │   ├── services/
│   │   │   └── twilio.ts            # Twilio OTP service
│   │   └── validators/              # Request validation schemas
│   │       ├── auth.ts
│   │       ├── bookings.ts
│   │       └── admin.ts
│   ├── drizzle/                     # Database migrations
│   ├── drizzle.config.ts            # Drizzle configuration
│   ├── tsconfig.json                # TypeScript configuration
│   └── package.json
│
└── README.md                        # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **PostgreSQL** database (NeonDB recommended)
- **Twilio Account** (for OTP functionality)
- **Mobile device** or **emulator** for testing

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd Food-service-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the backend root:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration (NeonDB PostgreSQL)
   DATABASE_URL=postgresql://username:password@ep-xyz-123.region.aws.neon.tech/food_service?sslmode=require

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Twilio Configuration (for OTP)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_VERIFY_SID=your_twilio_verify_sid
   ```

4. **Database Setup:**
   ```bash
   # Generate and push database schema
   npm run migrate
   npm run migrate:push
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```
   Backend will be available at `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd Food-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API Base URL:**
   Edit `contexts/AuthContext.js` and update the `API_BASE` constant:
   ```javascript
   // For development - use your machine's IP address
   const API_BASE = 'http://YOUR_LOCAL_IP:3000/api';
   
   // Examples:
   // const API_BASE = 'http://192.168.1.100:3000/api';  // Local network
   // const API_BASE = 'http://10.99.20.245:3000/api';   // Current setup
   // const API_BASE = 'http://localhost:3000/api';       // iOS Simulator only
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device/emulator:**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   
   # For web
   npm run web
   ```

## 📱 Usage

### For Users
1. **Login**: Enter phone number and verify OTP
2. **Registration**: Complete profile setup (first-time users)
3. **Book Meals**: 
   - Select date from calendar
   - Choose meal type (Breakfast/Lunch/Dinner)
   - Enter number of people
   - Confirm booking
4. **Manage Bookings**: View and cancel existing bookings
5. **Track Statistics**: View dashboard summary with attendance history

### For Admins
1. **Dashboard**: View all bookings for selected dates
2. **Attendance**: Mark users present for their bookings
3. **Walk-in Registration**: 
   - Register walk-in customers
   - Auto-create user accounts
   - Add bookings for walk-ins
4. **Capacity Monitoring**: View real-time meal capacity status
5. **Menu Management**: Update daily and weekly menus

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  role role DEFAULT 'User' NOT NULL,  -- 'User' | 'Admin'
  otp_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  meal_type meal_type NOT NULL,  -- 'Breakfast' | 'Lunch' | 'Dinner'
  num_people INTEGER NOT NULL CHECK (num_people > 0),
  status booking_status DEFAULT 'Booked' NOT NULL,  -- 'Booked' | 'Cancelled' | 'Attended'
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
```

### Menu Tables
```sql
-- Default weekly menu
CREATE TABLE menu (
  id SERIAL PRIMARY KEY,
  day_of_week day_of_week NOT NULL,
  meal_type meal_type NOT NULL,
  dishes JSONB NOT NULL,  -- Array of dish names
  is_default BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Date-specific menu overrides
CREATE TABLE daily_menu (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  dishes JSONB NOT NULL,  -- Array of dish names
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `POST /api/auth/register` - Complete user registration
- `GET /api/auth/profile` - Get user profile

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get bookings (query by date/user)
- `PATCH /api/bookings/:id/status` - Update booking status
- `GET /api/bookings/stats` - Get user booking statistics
- `GET /api/bookings/capacity/:date` - Get meal capacity for date

### Admin
- `POST /api/admin/walk-in` - Register walk-in customer
- `GET /api/admin/daily-menu/:date` - Get menu for specific date
- `POST /api/admin/daily-menu` - Create/update daily menu

### Menu
- `GET /api/menu/weekly` - Get default weekly menu
- `GET /api/menu/daily/:date` - Get menu for specific date

## ⚙️ Configuration

### Network Configuration (Important!)
The frontend needs to connect to the backend using the correct IP address:

- **iOS Simulator**: Use `localhost:3000`
- **Android Emulator**: Use `10.0.2.2:3000`
- **Physical Device**: Use your machine's local IP (e.g., `192.168.1.100:3000`)

Find your local IP:
```bash
# On Linux/Mac
hostname -I
# or
ip route get 8.8.8.8

# On Windows
ipconfig
```

### Development OTP Mode
For development, the backend supports mock OTP verification:
- Phone numbers ending in `1111`: Auto-verified as Admin
- Phone numbers ending in `2222`: Auto-verified as User
- Other numbers: Use real Twilio OTP

## 🚦 Development Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Generate database migrations
- `npm run migrate:push` - Push schema to database

### Frontend
- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## 📋 Features Implemented

### ✅ Completed Features
- Phone-based authentication with OTP
- Calendar-based meal booking system
- Booking capacity limits (100 people per meal)
- Real-time capacity tracking and updates
- Admin dashboard with attendance management
- Walk-in customer registration
- User dashboard with booking statistics
- Role-based access control
- Responsive layout with proper scrolling

### 🔄 Recent Updates
- Fixed API connectivity issues between frontend and backend
- Implemented meal capacity limits and visual indicators
- Added walk-in registration with automatic user creation
- Enhanced admin dashboard with real-time updates
- Improved user dashboard with booking statistics
- Fixed layout and scrolling issues in admin interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For issues or questions:
1. Check the configuration guides in `CONFIG_SETUP.md`
2. Review the API documentation in `API_ENDPOINTS_PLAN.md`
3. Check development guides in the backend documentation
4. Create an issue in the repository

## 🔮 Future Enhancements

- Push notifications for booking confirmations
- Advanced reporting and analytics
- Multi-location support
- Integration with payment systems
- Mobile app deployment to app stores
- Advanced menu management features
- Inventory management integration