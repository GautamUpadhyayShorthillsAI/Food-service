# Food Service Backend API

A TypeScript-based backend API for food service management with Drizzle ORM and PostgreSQL (NeonDB).

## Features

- **TypeScript** for type safety
- **Express.js** web framework
- **Drizzle ORM** for database operations
- **PostgreSQL** database with **NeonDB**
- **JSONB** for storing dish arrays efficiently
- **CORS** enabled
- **Environment configuration** with dotenv

## Database Schema

The application includes 4 main tables optimized for PostgreSQL:

1. **Users** - User management with roles (User/Admin)
2. **Menu** - Default weekly menu by day and meal type with JSONB dishes
3. **Daily Menu** - Date-specific menu overrides with JSONB dishes
4. **Bookings** - User meal bookings with status tracking and foreign key constraints

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (NeonDB PostgreSQL)
DATABASE_URL=postgresql://username:password@ep-xyz-123.region.aws.neon.tech/food_service?sslmode=require

# JWT Configuration (for future authentication)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# OTP Configuration (for future SMS verification)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=your_sender_id
```

### 3. NeonDB Setup

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file as `DATABASE_URL`

### 4. Generate and Run Migrations

```bash
# Generate migration files
npm run migrate

# Push schema to database
npm run migrate:push
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run migrate` - Generate Drizzle migration files for PostgreSQL
- `npm run migrate:push` - Push schema changes to PostgreSQL database

## API Endpoints

### Health Check
- `GET /` - Basic API info
- `GET /api/health` - Health check with uptime

## Database Schema Details (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  role role DEFAULT 'User' NOT NULL,
  otp_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
```

### Menu Table (Default Weekly)
```sql
CREATE TABLE menu (
  id SERIAL PRIMARY KEY,
  day_of_week day_of_week NOT NULL,
  meal_type meal_type NOT NULL,
  dishes JSONB NOT NULL,  -- Array of dish names
  is_default BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
```

### Daily Menu Table (Overrides)
```sql
CREATE TABLE daily_menu (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  dishes JSONB NOT NULL,  -- Array of dish names
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
  meal_type meal_type NOT NULL,
  num_people INTEGER NOT NULL CHECK (num_people > 0),
  status booking_status DEFAULT 'Booked' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
```

## Example Usage

### Insert Default Menu
```typescript
import { db, menu } from './src/db';

// Monday Breakfast with multiple dishes
await db.insert(menu).values({
  dayOfWeek: 'Monday',
  mealType: 'Breakfast',
  dishes: ['Poha', 'Upma', 'Idli'], // JSONB array
  isDefault: true,
});
```

### Insert Daily Override
```typescript
import { db, dailyMenu } from './src/db';

// Special dinner for September 10th
await db.insert(dailyMenu).values({
  date: '2025-09-10',
  mealType: 'Dinner',
  dishes: ['Biryani', 'Raita', 'Salad'], // JSONB array
});
```

### Query with JSONB
```typescript
import { sql } from 'drizzle-orm';

// Search for menus containing specific dish
const menusWithBiryani = await db
  .select()
  .from(menu)
  .where(sql`${menu.dishes} @> ${JSON.stringify(['Biryani'])}`);

// Get menus with more than 2 dishes
const multipleDishMenus = await db
  .select()
  .from(menu)
  .where(sql`jsonb_array_length(${menu.dishes}) > 2`);
```

## PostgreSQL/JSONB Benefits

- **Performance**: JSONB is binary JSON with indexing support
- **Flexibility**: Native array operations and queries
- **Scalability**: Efficient storage and retrieval of dish arrays
- **Advanced Queries**: PostgreSQL's rich JSONB operators (`@>`, `?`, `||`, etc.)

## Next Steps

- Implement authentication middleware with JWT
- Add CRUD endpoints for all entities
- Add validation middleware with Zod
- Implement OTP verification system
- Add logging and monitoring
- Set up database connection pooling for production
- Add full-text search on dish names using PostgreSQL