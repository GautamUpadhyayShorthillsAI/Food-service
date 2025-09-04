import { Router, Request, Response } from 'express';
import { db, menu, dailyMenu } from '../db';
import { eq, and } from 'drizzle-orm';

const router = Router();

// GET /api/menu - Get default weekly menu
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Fetching default weekly menu...');
    
    const weeklyMenu = await db
      .select({
        id: menu.id,
        dayOfWeek: menu.dayOfWeek,
        mealType: menu.mealType,
        dishes: menu.dishes,
        isDefault: menu.isDefault,
      })
      .from(menu)
      .where(eq(menu.isDefault, true));

    console.log(`✅ Found ${weeklyMenu.length} menu items`);

    // Organize menu by day and meal type
    const organizedMenu: Record<string, Record<string, string[]>> = {};
    
    weeklyMenu.forEach((item) => {
      if (!organizedMenu[item.dayOfWeek]) {
        organizedMenu[item.dayOfWeek] = {};
      }
      organizedMenu[item.dayOfWeek][item.mealType] = item.dishes as string[];
    });

    res.status(200).json({
      success: true,
      data: {
        menu: organizedMenu,
        total_items: weeklyMenu.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu data'
    });
  }
});

// GET /api/menu/day/:day - Get menu for specific day
router.get('/day/:day', async (req: Request, res: Response): Promise<void> => {
  try {
    const { day } = req.params;
    console.log(`📋 Fetching menu for day: ${day}`);
    
    const dayMenu = await db
      .select({
        id: menu.id,
        dayOfWeek: menu.dayOfWeek,
        mealType: menu.mealType,
        dishes: menu.dishes,
      })
      .from(menu)
      .where(and(
        eq(menu.dayOfWeek, day as any),
        eq(menu.isDefault, true)
      ));

    if (dayMenu.length === 0) {
      res.status(404).json({
        success: false,
        message: `No menu found for ${day}`
      });
      return;
    }

    // Organize by meal type
    const organizedDayMenu: Record<string, string[]> = {};
    dayMenu.forEach((item) => {
      organizedDayMenu[item.mealType] = item.dishes as string[];
    });

    res.status(200).json({
      success: true,
      data: {
        day: day,
        menu: organizedDayMenu
      }
    });
  } catch (error) {
    console.error(`❌ Error fetching menu for ${req.params.day}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch day menu'
    });
  }
});

// GET /api/menu/date/:date - Get menu for specific date (checks daily overrides first)
router.get('/date/:date', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    console.log(`📅 Fetching menu for date: ${date}`);
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
      return;
    }

    // First check for daily menu overrides
    const dailyOverrides = await db
      .select({
        id: dailyMenu.id,
        date: dailyMenu.date,
        mealType: dailyMenu.mealType,
        dishes: dailyMenu.dishes,
      })
      .from(dailyMenu)
      .where(eq(dailyMenu.date, date));

    // Get day of week for the date
    const dateObj = new Date(date);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[dateObj.getDay()];

    // Get default menu for the day
    const defaultMenu = await db
      .select({
        id: menu.id,
        dayOfWeek: menu.dayOfWeek,
        mealType: menu.mealType,
        dishes: menu.dishes,
      })
      .from(menu)
      .where(and(
        eq(menu.dayOfWeek, dayOfWeek as any),
        eq(menu.isDefault, true)
      ));

    // Implement fallback logic: daily overrides first, then default menu
    const finalMenu: Record<string, any> = {};
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    
    mealTypes.forEach((mealType) => {
      // Check if there's a daily override for this meal type
      const dailyOverride = dailyOverrides.find(item => item.mealType === mealType);
      
      if (dailyOverride) {
        // Use daily override
        finalMenu[mealType] = {
          dishes: dailyOverride.dishes as string[],
          source: 'daily_override',
          id: dailyOverride.id
        };
        console.log(`✅ Using daily override for ${date} ${mealType}`);
      } else {
        // Fall back to default menu
        const defaultItem = defaultMenu.find(item => item.mealType === mealType);
        if (defaultItem) {
          finalMenu[mealType] = {
            dishes: defaultItem.dishes as string[],
            source: 'default_menu',
            id: defaultItem.id
          };
          console.log(`📋 Using default menu for ${date} ${mealType}`);
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        date: date,
        dayOfWeek: dayOfWeek,
        menu: finalMenu,
        hasOverrides: dailyOverrides.length > 0,
        overrideCount: dailyOverrides.length
      }
    });
  } catch (error) {
    console.error(`❌ Error fetching menu for date ${req.params.date}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch date menu'
    });
  }
});

export default router;
