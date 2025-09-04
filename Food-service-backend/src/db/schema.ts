import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  pgEnum,
  boolean,
  timestamp,
  date,
  integer,
  index,
  jsonb,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['User', 'Admin']);
export const dayOfWeekEnum = pgEnum('day_of_week', [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]);
export const mealTypeEnum = pgEnum('meal_type', ['Breakfast', 'Lunch', 'Dinner']);
export const bookingStatusEnum = pgEnum('booking_status', ['Booked', 'Cancelled', 'Attended']);

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  role: roleEnum('role').notNull().default('User'),
  otpVerified: boolean('otp_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('users_phone_idx').on(table.phone),
]);

// Menu Table (default weekly menu)
export const menu = pgTable('menu', {
  id: serial('id').primaryKey(),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  dishes: jsonb('dishes').$type<string[]>().notNull(),
  isDefault: boolean('is_default').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('menu_day_meal_idx').on(table.dayOfWeek, table.mealType),
]);

// Daily Menu Table (overrides for specific dates)
export const dailyMenu = pgTable('daily_menu', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  dishes: jsonb('dishes').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('daily_menu_date_meal_idx').on(table.date, table.mealType),
]);

// Bookings Table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  numPeople: integer('num_people').notNull(),
  status: bookingStatusEnum('status').notNull().default('Booked'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('bookings_user_idx').on(table.userId),
  index('bookings_date_idx').on(table.date),
  index('bookings_user_date_meal_idx').on(table.userId, table.date, table.mealType),
  check('bookings_num_people_check', sql`${table.numPeople} > 0`),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

// Type exports for use in the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Menu = typeof menu.$inferSelect;
export type NewMenu = typeof menu.$inferInsert;

export type DailyMenu = typeof dailyMenu.$inferSelect;
export type NewDailyMenu = typeof dailyMenu.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

// Enum type exports
export type Role = 'User' | 'Admin';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
export type BookingStatus = 'Booked' | 'Cancelled' | 'Attended';