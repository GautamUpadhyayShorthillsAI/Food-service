import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required').regex(/^\+\d{1,15}$/, 'Invalid phone number format. Must include country code, e.g., +1234567890'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required').regex(/^\+\d{1,15}$/, 'Invalid phone number format. Must include country code, e.g., +1234567890'),
  otp: z.string().min(4, 'OTP must be at least 4 digits').max(10, 'OTP cannot exceed 10 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

export const registerUserSchema = z.object({
  phone: z.string().min(10, 'Phone number is required').regex(/^\+\d{1,15}$/, 'Invalid phone number format. Must include country code, e.g., +1234567890'),
  otp: z.string().min(4, 'OTP must be at least 4 digits').max(10, 'OTP cannot exceed 10 digits').regex(/^\d+$/, 'OTP must contain only digits'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
});