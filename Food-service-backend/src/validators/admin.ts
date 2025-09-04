import { z } from 'zod';

// Validation schema for daily menu management
export const dailyMenuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner'], {
    errorMap: () => ({ message: 'Meal type must be Breakfast, Lunch, or Dinner' })
  }),
  dishes: z.array(z.string().min(1, 'Dish name cannot be empty')).min(1, 'At least one dish is required')
});

// Validation schema for walk-in user registration by admin
export const createWalkInUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  phone: z.string().min(10, 'Phone number is required').regex(/^\+\d{1,15}$/, 'Invalid phone number format. Must include country code, e.g., +1234567890'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    }, 'Cannot create walk-in for past dates'),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner'], {
    errorMap: () => ({ message: 'Meal type must be Breakfast, Lunch, or Dinner' })
  }),
  numPeople: z.number()
    .int('Number of people must be a whole number')
    .min(1, 'Number of people must be at least 1')
    .max(20, 'Maximum 20 people per booking'),
});

export type DailyMenuInput = z.infer<typeof dailyMenuSchema>;
export type CreateWalkInUserInput = z.infer<typeof createWalkInUserSchema>;
