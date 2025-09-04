import { Router, Request, Response } from 'express';
import { sendOtp, verifyOtp } from '../services/twilio';
import { sendOtpSchema, verifyOtpSchema, registerUserSchema } from '../validators/auth';
import { authMiddleware, generateToken } from '../middleware/auth';
import { db, users } from '../db';
import { eq } from 'drizzle-orm';

const router = Router();

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);

    const success = await sendOtp(phone);

    if (success) {
      res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    console.error('Error in send-otp:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);

    const verificationResult = await verifyOtp(phone, otp);

    if (verificationResult.success) {
      // Check if user exists
      const existingUsers = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

      if (existingUsers.length > 0) {
        // User exists - login directly
        let user = existingUsers[0];
        
        // Update user role if it's different from OTP-determined role (for dev mode)
        if (verificationResult.role && user.role !== verificationResult.role) {
          await db.update(users)
            .set({ 
              role: verificationResult.role,
              otpVerified: true 
            })
            .where(eq(users.id, user.id));
          user.role = verificationResult.role; // Update local object
        } else if (!user.otpVerified) {
          // Just update otpVerified status
          await db.update(users).set({ otpVerified: true }).where(eq(users.id, user.id));
        }

        // Issue JWT token
        const token = generateToken({ id: user.id, role: user.role });

        res.status(200).json({
          success: true,
          userExists: true,
          message: 'OTP verified and logged in successfully',
          data: {
            token,
            user: {
              id: user.id,
              name: user.name,
              phone: user.phone,
              role: user.role,
            },
          },
        });
      } else {
        // User doesn't exist - need registration
        res.status(200).json({
          success: true,
          userExists: false,
          message: 'OTP verified. Please complete registration.',
          data: {
            phone,
            role: verificationResult.role || 'User' // Pass determined role for dev mode
          },
        });
      }
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    console.error('Error in verify-otp:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp, name } = registerUserSchema.parse(req.body);

    // Verify OTP again for security
    const verificationResult = await verifyOtp(phone, otp);

    if (verificationResult.success) {
      // Check if user already exists
      const existingUsers = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

      if (existingUsers.length > 0) {
        res.status(400).json({ success: false, message: 'User already exists. Please login instead.' });
        return;
      }

      // Create new user
      const userRole = verificationResult.role || 'User';
      const newUser = {
        phone,
        name: name.trim(),
        role: userRole as 'User' | 'Admin',
        otpVerified: true,
      };

      const insertedUsers = await db.insert(users).values(newUser).returning();
      const user = insertedUsers[0];

      if (!user) {
        res.status(500).json({ success: false, message: 'User creation failed' });
        return;
      }

      // Issue JWT token
      const token = generateToken({ id: user.id, role: user.role });

      res.status(201).json({
        success: true,
        message: 'User registered and logged in successfully',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
          },
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    console.error('Error in register:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/auth/me (Protected route)
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  // User data is available on req.user from authMiddleware
  if (req.user) {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } else {
    res.status(401).json({ success: false, message: 'User not authenticated' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  // For JWT, logout is typically handled client-side by discarding the token.
  // However, we can send a success response to confirm the action.
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export default router;