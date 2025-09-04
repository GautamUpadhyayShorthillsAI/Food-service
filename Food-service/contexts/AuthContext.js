import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - update this to match your backend
const API_BASE = 'http://10.99.20.245:3000/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);

  // Check for stored token on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('📱 Checking authentication state...');
      const storedToken = await AsyncStorage.getItem('authToken');
      
      if (storedToken) {
        console.log('🔑 Found stored token, verifying with server...');
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          // Verify token with backend
          const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Token verified, user logged in:', data.data.user.name);
            setToken(storedToken);
            setUser(data.data.user);
            setIsAuthenticated(true);
          } else {
            console.log('❌ Token expired or invalid, removing from storage');
            // Token expired or invalid, remove it
            await AsyncStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.log('⏰ Auth check timed out, treating as logged out');
          } else {
            console.log('❌ Auth check network error:', fetchError.message);
          }
          // On timeout or network error, treat as logged out but keep token for retry
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('📭 No stored token found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (phoneNumber) => {
    try {
      console.log('📞 Sending OTP to:', phoneNumber);
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ OTP sent successfully');
        return { success: true, message: data.message };
      } else {
        console.log('❌ Failed to send OTP:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Send OTP timed out');
        return { success: false, message: 'Request timed out. Please check your connection and try again.' };
      }
      console.error('❌ Send OTP error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const verifyOTP = async (phoneNumber, otpCode) => {
    try {
      console.log('🔐 Verifying OTP for:', phoneNumber);
      
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          otp: otpCode 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.userExists) {
          // User exists - login directly
          console.log('✅ OTP verified, logging in existing user:', data.data.user.name);
          
          // Save token and user data
          await AsyncStorage.setItem('authToken', data.data.token);
          setToken(data.data.token);
          setUser(data.data.user);
          setIsAuthenticated(true);
          
          return { 
            success: true, 
            userExists: true,
            message: data.message,
            user: data.data.user 
          };
        } else {
          // User doesn't exist - need registration
          console.log('✅ OTP verified, but user needs to register');
          
          return { 
            success: true, 
            userExists: false,
            message: data.message,
            phone: data.data.phone,
            role: data.data.role
          };
        }
      } else {
        console.log('❌ OTP verification failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const registerUser = async (phoneNumber, otpCode, name) => {
    try {
      console.log('📝 Registering new user:', phoneNumber, name);
      
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          otp: otpCode,
          name: name
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ User registered and logged in:', data.data.user.name);
        
        // Save token and user data
        await AsyncStorage.setItem('authToken', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
        setIsAuthenticated(true);
        
        return { 
          success: true, 
          message: data.message,
          user: data.data.user 
        };
      } else {
        console.log('❌ User registration failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ Register user error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const fetchWeeklyMenu = async () => {
    try {
      console.log('📋 Fetching weekly menu...');
      setMenuLoading(true);
      
      const response = await fetch(`${API_BASE}/menu`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Weekly menu fetched successfully');
        setWeeklyMenu(data.data.menu);
        return { success: true, menu: data.data.menu };
      } else {
        console.log('❌ Failed to fetch menu:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ Menu fetch error:', error);
      return { success: false, message: 'Failed to fetch menu data' };
    } finally {
      setMenuLoading(false);
    }
  };

  const fetchMenuForDate = async (date) => {
    try {
      console.log(`📅 Fetching menu for date: ${date}`);
      
      const response = await fetch(`${API_BASE}/menu/date/${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Menu fetched for ${date}:`, data.data);
        return { success: true, data: data.data };
      } else {
        console.log('❌ Failed to fetch menu for date:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ Menu fetch error:', error);
      return { success: false, message: 'Failed to fetch menu data' };
    }
  };

  // Admin functions for menu management
  const addOrUpdateDailyMenu = async (date, mealType, dishes) => {
    try {
      console.log(`🛠️ Admin adding/updating menu for ${date} ${mealType}:`, dishes);
      
      const response = await fetch(`${API_BASE}/admin/daily-menu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          mealType,
          dishes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Menu ${data.data.action} for ${date} ${mealType}`);
        return { success: true, data: data.data };
      } else {
        console.log('❌ Failed to manage daily menu:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ Admin menu management error:', error);
      return { success: false, message: 'Failed to manage daily menu' };
    }
  };

  const fetchDailyMenuForDate = async (date) => {
    try {
      console.log(`📋 Admin fetching daily menu for: ${date}`);
      
      const response = await fetch(`${API_BASE}/admin/daily-menu/${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Daily menu data fetched for ${date}`);
        return { success: true, data: data.data };
      } else {
        console.log('❌ Failed to fetch daily menu:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ Admin daily menu fetch error:', error);
      return { success: false, message: 'Failed to fetch daily menu data' };
    }
  };

  const deleteDailyMenuOverride = async (date, mealType) => {
    try {
      console.log(`🗑️ Admin deleting daily menu override for ${date} ${mealType}`);
      
      const response = await fetch(`${API_BASE}/admin/daily-menu/${date}/${mealType}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Daily menu override deleted for ${date} ${mealType}`);
        return { success: true, data: data.data };
      } else {
        console.log('❌ Failed to delete daily menu override:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ Admin menu deletion error:', error);
      return { success: false, message: 'Failed to delete daily menu override' };
    }
  };

  const getMenuForDate = async (dateString) => {
    try {
      console.log(`📅 Fetching menu with fallback logic for: ${dateString}`);
      
      // Use the new API endpoint that implements fallback logic
      const result = await fetchMenuForDate(dateString);
      
      if (result.success) {
        const { menu } = result.data;
        
        // Transform the API response to match the expected format
        return {
          date: dateString,
          dayName: result.data.dayOfWeek,
          breakfast: menu.Breakfast?.dishes || [],
          lunch: menu.Lunch?.dishes || [],
          dinner: menu.Dinner?.dishes || []
        };
      } else {
        console.log('⚠️ Failed to fetch menu, falling back to cached weekly menu');
        
        // Fallback to cached weekly menu if API fails
        if (!weeklyMenu) {
          console.log('⚠️ No cached weekly menu available');
          return null;
        }

        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dayOfWeek];
        
        const dayMenu = weeklyMenu[dayName];
        
        if (!dayMenu) {
          console.log(`⚠️ No menu found for ${dayName}`);
          return null;
        }

        return {
          date: dateString,
          dayName: dayName,
          breakfast: dayMenu.Breakfast || [],
          lunch: dayMenu.Lunch || [],
          dinner: dayMenu.Dinner || []
        };
      }
    } catch (error) {
      console.error('❌ Error in getMenuForDate:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Logging out user...');
      
      // Optional: Call logout endpoint
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Clear local storage and state
      await AsyncStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setWeeklyMenu(null);
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if API call fails, clear local state
      await AsyncStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setWeeklyMenu(null);
    }
  };

  // Booking functions
  const createBooking = async (date, mealType, numPeople) => {
    try {
      console.log(`📝 Creating booking: ${mealType} on ${date} for ${numPeople} people`);
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          mealType,
          numPeople
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Booking created successfully');
        return { success: true, message: data.message, booking: data.data.booking };
      } else {
        console.log('❌ Failed to create booking:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Create booking timed out');
        return { success: false, message: 'Request timed out. Please check your connection and try again.' };
      }
      console.error('❌ Create booking error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const fetchBookings = async (date) => {
    try {
      console.log(`📋 Fetching bookings for: ${date}`);
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE}/bookings?date=${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Fetched ${data.data.totalBookings} bookings for ${date}`);
        return { success: true, data: data.data };
      } else {
        console.log('❌ Failed to fetch bookings:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Fetch bookings timed out');
        return { success: false, message: 'Request timed out. Please check your connection and try again.' };
      }
      console.error('❌ Fetch bookings error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      console.log(`🔄 Updating booking ${bookingId} status to: ${status}`);
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Booking status updated to ${status}`);
        return { success: true, message: data.message, booking: data.data.booking };
      } else {
        console.log('❌ Failed to update booking status:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Update booking status timed out');
        return { success: false, message: 'Request timed out. Please check your connection and try again.' };
      }
      console.error('❌ Update booking status error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Fetch meal capacity for a specific date
  const fetchMealCapacity = async (date) => {
    try {
      console.log(`📊 Fetching meal capacity for date: ${date}`);
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE}/bookings/capacity/${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Meal capacity fetched successfully');
        return { success: true, data: data.data };
      } else {
        console.log('❌ Failed to fetch meal capacity:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Fetch meal capacity timed out');
        return { success: false, message: 'Request timed out. Please check your connection and try again.' };
      }
      console.error('❌ Fetch meal capacity error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      console.log('📊 Fetching user statistics...');
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE}/bookings/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ User statistics fetched successfully');
        return { success: true, data: data.data };
      } else {
        console.log('❌ Failed to fetch user statistics:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Fetch user statistics timed out');
        return { success: false, message: 'Request timed out. Please check your connection and try again.' };
      }
      console.error('❌ Fetch user statistics error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  // Admin walk-in registration function
  const createWalkInUser = async (name, phone, date, mealType, numPeople) => {
    try {
      console.log(`🚶 Creating walk-in user: ${name} (${phone}) for ${mealType} on ${date}`);
      
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE}/admin/walk-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          phone,
          date,
          mealType,
          numPeople
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Walk-in user created successfully');
        return { success: true, message: data.message, data: data.data };
      } else {
        console.log('❌ Failed to create walk-in user:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Create walk-in user timed out');
        return { success: false, message: 'Request timed out. Please check your connection and try again.' };
      }
      console.error('❌ Create walk-in user error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    weeklyMenu,
    menuLoading,
    sendOTP,
    verifyOTP,
    registerUser,
    logout,
    checkAuthState,
    fetchWeeklyMenu,
    getMenuForDate,
    fetchMenuForDate,
    // Booking functions
    createBooking,
    fetchBookings,
    updateBookingStatus,
    fetchUserStats,
    fetchMealCapacity,
    // Admin functions
    addOrUpdateDailyMenu,
    fetchDailyMenuForDate,
    deleteDailyMenuOverride,
    createWalkInUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
