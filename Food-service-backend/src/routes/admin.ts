import { Router, Request, Response } from 'express';
import { db, dailyMenu, menu, users, bookings } from '../db';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { dailyMenuSchema, createWalkInUserSchema } from '../validators/admin';

const router = Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// POST /api/admin/daily-menu - Add or update daily menu
router.post('/daily-menu', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🛠️ Admin adding/updating daily menu:', req.body);
    
    // Validate request body
    const validationResult = dailyMenuSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: validationResult.error.errors
      });
      return;
    }

    const { date, mealType, dishes } = validationResult.data;

    // Check if a daily menu entry already exists for this date and meal type
    const existingEntry = await db
      .select()
      .from(dailyMenu)
      .where(and(
        eq(dailyMenu.date, date),
        eq(dailyMenu.mealType, mealType)
      ))
      .limit(1);

    if (existingEntry.length > 0) {
      // Update existing entry
      console.log(`📝 Updating existing daily menu for ${date} ${mealType}`);
      
      await db
        .update(dailyMenu)
        .set({
          dishes: dishes,
          updatedAt: new Date()
        })
        .where(and(
          eq(dailyMenu.date, date),
          eq(dailyMenu.mealType, mealType)
        ));

      res.status(200).json({
        success: true,
        message: `Daily menu updated for ${date} ${mealType}`,
        data: {
          date,
          mealType,
          dishes,
          action: 'updated'
        }
      });
    } else {
      // Insert new entry
      console.log(`➕ Creating new daily menu for ${date} ${mealType}`);
      
      await db
        .insert(dailyMenu)
        .values({
          date: date,
          mealType: mealType as 'Breakfast' | 'Lunch' | 'Dinner',
          dishes: dishes
        });

      res.status(201).json({
        success: true,
        message: `Daily menu created for ${date} ${mealType}`,
        data: {
          date,
          mealType,
          dishes,
          action: 'created'
        }
      });
    }
  } catch (error) {
    console.error('❌ Error managing daily menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage daily menu'
    });
  }
});

// GET /api/admin/daily-menu/:date - Get all daily menu overrides for a specific date
router.get('/daily-menu/:date', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    console.log(`📋 Admin fetching daily menu overrides for: ${date}`);

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
      return;
    }

    // Get daily menu overrides for the date
    const dailyOverrides = await db
      .select({
        id: dailyMenu.id,
        date: dailyMenu.date,
        mealType: dailyMenu.mealType,
        dishes: dailyMenu.dishes,
        createdAt: dailyMenu.createdAt,
        updatedAt: dailyMenu.updatedAt
      })
      .from(dailyMenu)
      .where(eq(dailyMenu.date, date));

    // Get default menu for the day of week
    const dateObj = new Date(date);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[dateObj.getDay()];

    const defaultMenu = await db
      .select({
        id: menu.id,
        dayOfWeek: menu.dayOfWeek,
        mealType: menu.mealType,
        dishes: menu.dishes
      })
      .from(menu)
      .where(and(
        eq(menu.dayOfWeek, dayOfWeek as any),
        eq(menu.isDefault, true)
      ));

    // Organize data
    const organizedDefaults: Record<string, string[]> = {};
    defaultMenu.forEach((item) => {
      organizedDefaults[item.mealType] = item.dishes as string[];
    });

    const organizedOverrides: Record<string, any> = {};
    dailyOverrides.forEach((item) => {
      organizedOverrides[item.mealType] = {
        id: item.id,
        dishes: item.dishes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        date: date,
        dayOfWeek: dayOfWeek,
        defaultMenu: organizedDefaults,
        dailyOverrides: organizedOverrides,
        hasOverrides: dailyOverrides.length > 0
      }
    });
  } catch (error) {
    console.error(`❌ Error fetching daily menu for ${req.params.date}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily menu data'
    });
  }
});

// DELETE /api/admin/daily-menu/:date/:mealType - Remove daily menu override
router.delete('/daily-menu/:date/:mealType', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, mealType } = req.params;
    console.log(`🗑️ Admin removing daily menu override for: ${date} ${mealType}`);

    // Validate inputs
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
      return;
    }

    if (!['Breakfast', 'Lunch', 'Dinner'].includes(mealType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid meal type. Must be Breakfast, Lunch, or Dinner'
      });
      return;
    }

    // Check if the entry exists
    const existingEntry = await db
      .select()
      .from(dailyMenu)
      .where(and(
        eq(dailyMenu.date, date),
        eq(dailyMenu.mealType, mealType as any)
      ))
      .limit(1);

    if (existingEntry.length === 0) {
      res.status(404).json({
        success: false,
        message: `No daily menu override found for ${date} ${mealType}`
      });
      return;
    }

    // Delete the entry
    await db
      .delete(dailyMenu)
      .where(and(
        eq(dailyMenu.date, date),
        eq(dailyMenu.mealType, mealType as any)
      ));

    res.status(200).json({
      success: true,
      message: `Daily menu override removed for ${date} ${mealType}`,
      data: {
        date,
        mealType,
        action: 'deleted'
      }
    });
  } catch (error) {
    console.error(`❌ Error deleting daily menu for ${req.params.date} ${req.params.mealType}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete daily menu override'
    });
  }
});

// GET /api/admin/daily-menu - Get all daily menu overrides (with pagination)
router.get('/daily-menu', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    console.log(`📋 Admin fetching daily menu overrides (page ${page}, limit ${limit})`);

    // Get daily menu overrides with pagination
    const dailyOverrides = await db
      .select({
        id: dailyMenu.id,
        date: dailyMenu.date,
        mealType: dailyMenu.mealType,
        dishes: dailyMenu.dishes,
        createdAt: dailyMenu.createdAt,
        updatedAt: dailyMenu.updatedAt
      })
      .from(dailyMenu)
      .orderBy(dailyMenu.date, dailyMenu.mealType)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: dailyMenu.id })
      .from(dailyMenu);

    res.status(200).json({
      success: true,
      data: {
        overrides: dailyOverrides,
        pagination: {
          page,
          limit,
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching all daily menu overrides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily menu overrides'
    });
  }
});

// POST /api/admin/walk-in - Create walk-in user and booking
router.post('/walk-in', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🚶 Admin registering walk-in customer:', req.body);
    
    // Validate request body
    const validationResult = createWalkInUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: validationResult.error.errors
      });
      return;
    }

    const { name, phone, date, mealType, numPeople } = validationResult.data;

    // Check if user already exists with this phone number
    const existingUsers = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    
    let userId: number;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User exists, use existing user ID
      userId = existingUsers[0].id;
      console.log(`👤 Using existing user: ${existingUsers[0].name} (${phone})`);
    } else {
      // Create new user
      console.log(`➕ Creating new walk-in user: ${name} (${phone})`);
      const newUser = {
        phone,
        name: name.trim(),
        role: 'User' as const,
        otpVerified: true, // Walk-ins are automatically verified by admin
      };

      const insertedUsers = await db.insert(users).values(newUser).returning();
      const user = insertedUsers[0];

      if (!user) {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to create walk-in user' 
        });
        return;
      }

      userId = user.id;
      isNewUser = true;
    }

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
      res.status(409).json({
        success: false,
        message: `User already has a ${mealType.toLowerCase()} booking for ${date}`
      });
      return;
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
      console.log(`🚫 Walk-in capacity limit reached for ${mealType} on ${date}: ${currentCapacity}/${MEAL_CAPACITY_LIMIT}, requesting ${numPeople} more`);
      res.status(409).json({
        success: false,
        message: `This meal has reached its booking limit. Current capacity: ${currentCapacity}/${MEAL_CAPACITY_LIMIT}. Cannot accommodate ${numPeople} more people.`,
        data: {
          currentCapacity,
          maxCapacity: MEAL_CAPACITY_LIMIT,
          requestedPeople: numPeople,
          availableSlots: MEAL_CAPACITY_LIMIT - currentCapacity
        }
      });
      return;
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

    console.log(`✅ Walk-in booking created: ${name}, ${mealType} on ${date} for ${numPeople} people (${currentCapacity + numPeople}/${MEAL_CAPACITY_LIMIT})`);

    res.status(201).json({
      success: true,
      message: `Walk-in customer ${isNewUser ? 'registered' : 'booked'} successfully`,
      data: {
        user: {
          id: userId,
          name,
          phone,
          isNewUser
        },
        booking: newBooking,
        capacityInfo: {
          currentCapacity: currentCapacity + numPeople,
          maxCapacity: MEAL_CAPACITY_LIMIT,
          availableSlots: MEAL_CAPACITY_LIMIT - (currentCapacity + numPeople)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error creating walk-in user and booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register walk-in customer'
    });
  }
});

export default router;
