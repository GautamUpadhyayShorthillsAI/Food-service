import express, { Request, Response } from 'express';
import { db } from '../db';
import { bookings, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  getBookingsQuerySchema,
  bookingParamsSchema,
  userBookingsParamsSchema
} from '../validators/bookings';

const router = express.Router();

// POST /api/bookings - Create a new booking
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = createBookingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: validation.error.errors
      });
    }

    const { date, mealType, numPeople } = validation.data;
    const userId = (req as any).user.id;

    // Check if booking already exists for this user, date, and meal type
    const existingBooking = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.date, date),
          eq(bookings.mealType, mealType)
        )
      )
      .limit(1);

    if (existingBooking.length > 0) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${mealType.toLowerCase()} booking for ${date}. Please cancel your existing booking first if you want to make changes.`
      });
    }

    // Check meal capacity (100 people max per meal per day)
    const existingBookingsForMeal = await db
      .select({
        numPeople: bookings.numPeople
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.date, date),
          eq(bookings.mealType, mealType),
          eq(bookings.status, 'Booked') // Only count active bookings
        )
      );

    const currentCapacity = existingBookingsForMeal.reduce((sum, booking) => sum + booking.numPeople, 0);
    const MEAL_CAPACITY_LIMIT = 100;

    if (currentCapacity + numPeople > MEAL_CAPACITY_LIMIT) {
      console.log(`🚫 Capacity limit reached for ${mealType} on ${date}: ${currentCapacity}/${MEAL_CAPACITY_LIMIT}, requesting ${numPeople} more`);
      return res.status(409).json({
        success: false,
        message: `This meal has reached its booking limit. Current capacity: ${currentCapacity}/${MEAL_CAPACITY_LIMIT}. Cannot accommodate ${numPeople} more people.`,
        data: {
          currentCapacity,
          maxCapacity: MEAL_CAPACITY_LIMIT,
          requestedPeople: numPeople,
          availableSlots: MEAL_CAPACITY_LIMIT - currentCapacity
        }
      });
    }

    // Create the booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        userId,
        date,
        mealType,
        numPeople,
        status: 'Booked'
      })
      .returning();

    console.log(`✅ Booking created: User ${userId}, ${mealType} on ${date} for ${numPeople} people (${currentCapacity + numPeople}/${MEAL_CAPACITY_LIMIT})`);

    return res.status(201).json({
      success: true,
      message: `${mealType} booking confirmed for ${date}`,
      data: {
        booking: newBooking,
        capacityInfo: {
          currentCapacity: currentCapacity + numPeople,
          maxCapacity: MEAL_CAPACITY_LIMIT,
          availableSlots: MEAL_CAPACITY_LIMIT - (currentCapacity + numPeople)
        }
      }
    });

  } catch (error) {
    console.error('❌ Create booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
});

// GET /api/bookings?date=YYYY-MM-DD - Get bookings for a specific date
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = getBookingsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.error.errors
      });
    }

    const { date } = validation.data;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    let whereCondition;
    
    if (userRole === 'Admin') {
      // Admins can see all bookings for the date
      whereCondition = eq(bookings.date, date);
    } else {
      // Users can only see their own bookings
      whereCondition = and(
        eq(bookings.date, date),
        eq(bookings.userId, userId)
      );
    }

    // Fetch bookings with user information
    const result = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        date: bookings.date,
        mealType: bookings.mealType,
        numPeople: bookings.numPeople,
        status: bookings.status,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          phone: users.phone,
          role: users.role
        }
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(bookings.createdAt));

    // Group bookings by meal type for easier frontend consumption
    const groupedBookings = {
      Breakfast: result.filter(b => b.mealType === 'Breakfast'),
      Lunch: result.filter(b => b.mealType === 'Lunch'),
      Dinner: result.filter(b => b.mealType === 'Dinner')
    };

    const totalBookings = result.length;
    const statusCounts = result.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📋 Fetched ${totalBookings} bookings for ${date}`);

    return res.json({
      success: true,
      data: {
        date,
        bookings: userRole === 'Admin' ? groupedBookings : result,
        totalBookings,
        statusCounts
      }
    });

  } catch (error) {
    console.error('❌ Get bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// PATCH /api/bookings/:id/status - Update booking status (admin only or user can cancel)
router.patch('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const paramsValidation = bookingParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
        errors: paramsValidation.error.errors
      });
    }
    
    const { id: bookingId } = paramsValidation.data;

    const validation = updateBookingStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        errors: validation.error.errors
      });
    }

    const { status } = validation.data;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    // Check if booking exists
    const [existingBooking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Authorization check
    if (userRole !== 'Admin') {
      // Regular users can only update their own bookings and only to 'Cancelled'
      if (existingBooking.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only modify your own bookings'
        });
      }
      
      if (status !== 'Cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Users can only cancel their bookings'
        });
      }
    }

    // Update the booking status
    const [updatedBooking] = await db
      .update(bookings)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    console.log(`✅ Booking status updated: ID ${bookingId} -> ${status}`);

    return res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: {
        booking: updatedBooking
      }
    });

  } catch (error) {
    console.error('❌ Update booking status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// GET /api/bookings/user/:userId - Get all bookings for a specific user (admin only)
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const paramsValidation = userBookingsParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        errors: paramsValidation.error.errors
      });
    }
    
    const { userId: targetUserId } = paramsValidation.data;

    // Fetch user's bookings with user information
    const result = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        date: bookings.date,
        mealType: bookings.mealType,
        numPeople: bookings.numPeople,
        status: bookings.status,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          phone: users.phone,
          role: users.role
        }
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.userId, targetUserId))
      .orderBy(desc(bookings.date));

    console.log(`📋 Fetched ${result.length} bookings for user ${targetUserId}`);

    return res.json({
      success: true,
      data: {
        bookings: result,
        totalBookings: result.length
      }
    });

  } catch (error) {
    console.error('❌ Get user bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings'
    });
  }
});

// GET /api/bookings/stats - Get user statistics (total booked, attended, missed)
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    console.log(`📊 Fetching booking statistics for user ${userId}`);

    // Get all bookings for the user
    const userBookings = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        date: bookings.date,
        mealType: bookings.mealType,
        numPeople: bookings.numPeople,
        createdAt: bookings.createdAt
      })
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.date));

    // Calculate statistics
    const totalBooked = userBookings.length;
    const totalAttended = userBookings.filter(booking => booking.status === 'Attended').length;
    const totalMissed = userBookings.filter(booking => 
      booking.status === 'Booked' && new Date(booking.date) < new Date()
    ).length;

    // Get additional insights
    const cancelledBookings = userBookings.filter(booking => booking.status === 'Cancelled').length;
    const upcomingBookings = userBookings.filter(booking => 
      booking.status === 'Booked' && new Date(booking.date) >= new Date()
    ).length;

    console.log(`📈 User ${userId} stats: ${totalBooked} booked, ${totalAttended} attended, ${totalMissed} missed`);

    return res.json({
      success: true,
      data: {
        totalBooked,
        totalAttended,
        totalMissed,
        totalCancelled: cancelledBookings,
        upcomingBookings,
        recentBookings: userBookings.slice(0, 5) // Last 5 bookings for additional context
      }
    });

  } catch (error) {
    console.error('❌ Get user stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

// GET /api/bookings/capacity/:date - Get meal capacity status for a specific date
router.get('/capacity/:date', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    console.log(`📊 Fetching meal capacity for date: ${date}`);

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Get all active bookings for the date
    const dateBookings = await db
      .select({
        mealType: bookings.mealType,
        numPeople: bookings.numPeople,
        status: bookings.status
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.date, date),
          eq(bookings.status, 'Booked') // Only count active bookings
        )
      );

    // Calculate capacity for each meal type
    const MEAL_CAPACITY_LIMIT = 100;
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    const capacityStatus: Record<string, any> = {};

    mealTypes.forEach(mealType => {
      const mealBookings = dateBookings.filter(booking => booking.mealType === mealType);
      const currentCapacity = mealBookings.reduce((sum, booking) => sum + booking.numPeople, 0);
      const availableSlots = MEAL_CAPACITY_LIMIT - currentCapacity;
      const utilizationPercentage = Math.round((currentCapacity / MEAL_CAPACITY_LIMIT) * 100);

      capacityStatus[mealType] = {
        currentCapacity,
        maxCapacity: MEAL_CAPACITY_LIMIT,
        availableSlots,
        utilizationPercentage,
        isFull: currentCapacity >= MEAL_CAPACITY_LIMIT,
        totalBookings: mealBookings.length
      };
    });

    console.log(`📈 Capacity status for ${date}:`, capacityStatus);

    return res.json({
      success: true,
      data: {
        date,
        capacityStatus,
        totalCapacityLimit: MEAL_CAPACITY_LIMIT
      }
    });

  } catch (error) {
    console.error('❌ Get meal capacity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch meal capacity status'
    });
  }
});

export default router;
