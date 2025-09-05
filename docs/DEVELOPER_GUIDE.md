# 🛠️ Developer Setup & Contribution Guide

Complete guide for developers to set up, contribute to, and maintain the Food Service Management System.

## 🎯 Prerequisites

### Required Software
- **Node.js** v18+ (LTS recommended)
- **npm** v8+ or **yarn** v1.22+
- **Git** v2.0+
- **Expo CLI** (for React Native development)
- **PostgreSQL** or access to NeonDB
- **VS Code** (recommended IDE)

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Thunder Client (API testing)
- GitLens

### Accounts & Services
- **GitHub** account (for version control)
- **Twilio** account (for OTP functionality)
- **NeonDB** account (or local PostgreSQL)
- **Expo** account (for mobile development)

## 🚀 Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fd-service.git
cd fd-service
```

### 2. Backend Setup

```bash
cd Food-service-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

**Configure `.env` file:**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (NeonDB PostgreSQL)
DATABASE_URL=postgresql://username:password@ep-xyz-123.region.aws.neon.tech/food_service?sslmode=require

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_VERIFY_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Set up database:**
```bash
# Generate migration files
npm run migrate

# Apply migrations to database
npm run migrate:push

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../Food-service

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Start development server
npm start
```

**Configure API connection:**
In `contexts/AuthContext.js`, update the API base URL:
```javascript
// Find your machine's IP address
// Linux/Mac: hostname -I or ifconfig
// Windows: ipconfig

const API_BASE = 'http://YOUR_LOCAL_IP:3000/api';
// Example: const API_BASE = 'http://192.168.1.100:3000/api';
```

### 4. Verify Setup

**Test backend:**
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"OK","uptime":...}
```

**Test frontend:**
1. Scan QR code with Expo Go app
2. Try phone authentication flow
3. Verify OTP with real phone number

## 📁 Project Structure Deep Dive

### Backend Architecture (`Food-service-backend/`)

```
src/
├── config.ts              # Environment configuration
├── index.ts               # Express server entry point
├── db/
│   ├── index.ts           # Database connection
│   └── schema.ts          # Drizzle ORM schema definitions
├── middleware/
│   └── auth.ts            # JWT authentication middleware
├── routes/
│   ├── auth.ts           # Authentication endpoints
│   ├── bookings.ts       # Booking management endpoints
│   ├── admin.ts          # Admin-specific endpoints
│   └── menu.ts           # Menu management endpoints
├── services/
│   └── twilio.ts         # Twilio OTP service integration
└── validators/
    ├── auth.ts           # Authentication input validation
    ├── bookings.ts       # Booking input validation
    └── admin.ts          # Admin input validation
```

### Frontend Architecture (`Food-service/`)

```
├── App.js                 # Main app component with AuthProvider
├── app.json              # Expo configuration
├── contexts/
│   └── AuthContext.js    # Global authentication state management
├── navigation/
│   └── AppNavigator.js   # Route definitions and navigation logic
├── screens/
│   ├── LoginScreen.js              # Initial login screen
│   ├── PhoneInputScreen.js         # Phone number input
│   ├── OTPVerificationScreen.js    # OTP verification
│   ├── UserRegistrationScreen.js   # New user registration
│   ├── UserDashboardScreen.js      # User meal booking interface
│   ├── BookingScreen.js            # Detailed booking management
│   ├── AdminDashboardScreen.js     # Admin booking oversight
│   ├── AdminBookingManagementScreen.js  # Admin booking actions
│   └── AdminMenuManagementScreen.js     # Admin menu management
└── assets/               # Images, icons, splash screens
```

## 🛠️ Development Workflow

### 1. Branch Management

```bash
# Create feature branch
git checkout -b feature/user-profile-management
git checkout -b fix/booking-capacity-calculation
git checkout -b docs/api-documentation

# Push feature branch
git push -u origin feature/user-profile-management
```

### 2. Code Style Guidelines

#### Backend (TypeScript)
- Use **PascalCase** for types and interfaces
- Use **camelCase** for variables and functions
- Use **kebab-case** for file names
- Always specify return types for functions
- Use async/await instead of promises

```typescript
// Good
interface UserProfile {
  id: number;
  name: string;
}

const getUserProfile = async (userId: number): Promise<UserProfile> => {
  const user = await db.select().from(users).where(eq(users.id, userId));
  return user[0];
};

// Bad
const getUserProfile = (userId) => {
  return new Promise((resolve) => {
    // ...
  });
};
```

#### Frontend (JavaScript/React)
- Use **PascalCase** for component names
- Use **camelCase** for props and state variables
- Use **SCREAMING_SNAKE_CASE** for constants
- Always use functional components with hooks

```javascript
// Good
const UserDashboardScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = 'http://localhost:3000/api';
  
  return <View>...</View>;
};

// Bad
class userDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = { isloading: false };
  }
}
```

### 3. Database Migrations

When making schema changes:

```bash
# 1. Update schema in src/db/schema.ts
# 2. Generate migration
npm run migrate

# 3. Review generated migration file in drizzle/
# 4. Apply migration
npm run migrate:push

# 5. Commit both schema and migration files
git add src/db/schema.ts drizzle/
git commit -m "feat: add user preferences table"
```

### 4. API Development Process

1. **Define endpoint in routes file**
2. **Add input validation with Zod**
3. **Implement business logic**
4. **Add error handling**
5. **Update API documentation**
6. **Write tests**

Example:
```typescript
// 1. Route definition
router.post('/bookings', authenticateToken, async (req, res) => {
  try {
    // 2. Validation
    const validatedData = createBookingSchema.parse(req.body);
    
    // 3. Business logic
    const booking = await createBooking(req.user.id, validatedData);
    
    // 4. Response
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    // 4. Error handling
    handleError(res, error);
  }
});
```

## 🧪 Testing Guidelines

### Backend Testing

```bash
# Test authentication endpoints
./test-auth-endpoints.sh

# Manual API testing
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

### Frontend Testing

```bash
# Start development server
npm start

# Test on different platforms
npm run android     # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### Integration Testing

1. **Authentication Flow:**
   - Phone input → OTP verification → Dashboard navigation
   - Token persistence across app restarts
   - Role-based access control

2. **Booking Flow:**
   - Create booking → View in dashboard → Cancel booking
   - Capacity limits enforcement
   - Real-time updates

3. **Admin Features:**
   - Walk-in registration → User auto-creation
   - Attendance marking → Status updates
   - Menu management → Display updates

## 🐛 Debugging

### Backend Debugging

```bash
# Enable debug logs
DEBUG=express:* npm run dev

# Check database connections
npx ts-node -e "
import { db } from './src/db/index.js';
console.log('DB connected:', !!db);
"
```

### Frontend Debugging

```javascript
// In Expo, use remote debugging
console.log('User state:', user);

// Check AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getItem('authToken').then(console.log);

// Network debugging
const API_BASE = 'http://YOUR_IP:3000/api';
console.log('API Base:', API_BASE);
```

### Common Issues & Solutions

#### "Network request failed"
```javascript
// Solution: Update API base URL
const API_BASE = 'http://192.168.1.100:3000/api'; // Use your machine's IP
```

#### "Database connection failed"
```typescript
// Solution: Check DATABASE_URL format
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

#### "OTP not received"
```env
# Solution: Verify Twilio credentials
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_VERIFY_SID=VAxxxxx
```

## 📦 Package Management

### Adding Dependencies

**Backend:**
```bash
# Add runtime dependency
npm install express-rate-limit

# Add development dependency
npm install --save-dev @types/jest

# Update package-lock.json
npm ci
```

**Frontend:**
```bash
# Add Expo-compatible package
expo install react-native-vector-icons

# Add development dependency
npm install --save-dev @babel/preset-env
```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update express

# Update all packages (careful!)
npm update

# Check for security vulnerabilities
npm audit
npm audit fix
```

## 🚀 Deployment Preparation

### Backend Production Build

```bash
# Build TypeScript
npm run build

# Test production build
npm start

# Environment variables for production
NODE_ENV=production
DATABASE_URL=postgresql://prod-connection-string
JWT_SECRET=ultra-secure-production-secret-key
```

### Frontend Production Build

```bash
# Create production build
expo build:android
expo build:ios

# Or create APK for testing
expo build:android --type apk
```

## 🤝 Contributing

### Before Creating a Pull Request

1. **Run linting and formatting:**
```bash
# Backend
npm run lint
npm run format

# Frontend
npm run lint
expo doctor
```

2. **Test your changes:**
```bash
# Backend
npm test
npm run test:integration

# Frontend - Test on multiple platforms
npm run android
npm run ios
npm run web
```

3. **Update documentation:**
- Update API documentation if adding/changing endpoints
- Update README if changing setup process
- Add comments for complex business logic

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Backend tests pass
- [ ] Frontend tests on Android
- [ ] Frontend tests on iOS
- [ ] API endpoints tested
- [ ] Authentication flow verified

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements in production code
```

## 📚 Learning Resources

### React Native & Expo
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Documentation](https://reactnative.dev/)

### Backend Technologies
- [Express.js Guide](https://expressjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Twilio Verify API](https://www.twilio.com/docs/verify/api)

### Database
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NeonDB Documentation](https://neon.tech/docs/)

## 🆘 Getting Help

### Internal Resources
1. Check existing documentation in `/docs`
2. Review implementation summaries in backend folder
3. Check issues in GitHub repository

### External Help
1. **Stack Overflow** - Tag questions with `react-native`, `expo`, `typescript`
2. **Expo Forums** - For Expo-specific issues
3. **Discord Communities** - React Native Community Discord

### Contact Information
- **Technical Issues:** Create GitHub issue
- **Setup Help:** Check troubleshooting guide
- **Feature Requests:** Submit feature request template

---

## 🎯 Next Steps

Once you have the development environment set up:

1. **Explore the codebase** - Start with `App.js` and follow the navigation flow
2. **Make a small change** - Try updating a UI component or adding a console.log
3. **Test the authentication flow** - Use your phone number to test OTP verification
4. **Review the database schema** - Understand how data is structured
5. **Read the API documentation** - Familiarize yourself with available endpoints

Happy coding! 🎉
