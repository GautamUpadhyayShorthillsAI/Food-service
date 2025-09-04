import { z } from 'zod';

export const createBookingSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    }, 'Cannot book for past dates'),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner'], {
    errorMap: () => ({ message: 'Meal type must be Breakfast, Lunch, or Dinner' })
  }),
  numPeople: z.number()
    .int('Number of people must be a whole number')
    .min(1, 'Number of people must be at least 1')
    .max(20, 'Maximum 20 people per booking'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['Booked', 'Cancelled', 'Attended'], {
    errorMap: () => ({ message: 'Status must be Booked, Cancelled, or Attended' })
  }),
});

export const getBookingsQuerySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const bookingParamsSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'Booking ID must be a number')
    .transform(Number),
});

export const userBookingsParamsSchema = z.object({
  userId: z.string()
    .regex(/^\d+$/, 'User ID must be a number')
    .transform(Number),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type GetBookingsQuery = z.infer<typeof getBookingsQuerySchema>;
export type BookingParams = z.infer<typeof bookingParamsSchema>;
export type UserBookingsParams = z.infer<typeof userBookingsParamsSchema>;
