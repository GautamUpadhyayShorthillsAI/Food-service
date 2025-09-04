import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';

const UserDashboardScreen = ({ navigation }) => {
  const { 
    user, 
    logout, 
    fetchWeeklyMenu, 
    getMenuForDate, 
    weeklyMenu, 
    menuLoading,
    createBooking,
    fetchBookings,
    updateBookingStatus,
    fetchUserStats
  } = useAuth();
  
  // View state management
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayView, setShowDayView] = useState(false);
  
  // State for bookings
  const [userBookings, setUserBookings] = useState({});
  
  // Modal state for meal registration
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  
  // Day view menu state
  const [menuData, setMenuData] = useState(null);
  const [loadingDayMenu, setLoadingDayMenu] = useState(false);

  // User statistics state
  const [userStats, setUserStats] = useState({
    totalBooked: 0,
    totalAttended: 0,
    totalMissed: 0,
    upcomingBookings: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch menu data and user bookings when component mounts
  useEffect(() => {
    fetchWeeklyMenu();
    loadUserBookings();
    loadUserStats();
  }, []);

  // Load user statistics
  const loadUserStats = async () => {
    setLoadingStats(true);
    try {
      const result = await fetchUserStats();
      if (result.success) {
        setUserStats(result.data);
      } else {
        console.error('Failed to load user stats:', result.message);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load user's bookings for calendar display
  const loadUserBookings = async () => {
    try {
      // Get current and future dates (next 30 days)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);
      
      const bookingsData = {};
      
      // Load bookings for each day in the range
      for (let d = new Date(today); d <= futureDate; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD format
        try {
          const result = await fetchBookings(dateString);
          if (result.success && result.data.bookings.length > 0) {
            // Convert array of bookings to object for easier access
            const dayBookings = {};
            result.data.bookings.forEach(booking => {
              dayBookings[booking.mealType.toLowerCase()] = {
                numPeople: booking.numPeople,
                status: booking.status,
                id: booking.id
              };
            });
            bookingsData[dateString] = dayBookings;
          }
        } catch (error) {
          // Silently continue if individual day fails
          console.log(`Failed to load bookings for ${dateString}:`, error);
        }
      }
      
      setUserBookings(bookingsData);
    } catch (error) {
      console.error('Error loading user bookings:', error);
    }
  };

  // Load day menu when selectedDate changes
  useEffect(() => {
    if (selectedDate && showDayView) {
      const loadDayMenu = async () => {
        setLoadingDayMenu(true);
        try {
          const data = await getMenuForDateLocal(selectedDate);
          setMenuData(data);
        } catch (error) {
          console.error('Error loading day menu:', error);
          setMenuData(null);
        } finally {
          setLoadingDayMenu(false);
        }
      };
      loadDayMenu();
    }
  }, [selectedDate, showDayView]);

  // Date selection handlers
  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    setShowDayView(true);
  };

  const handleBackToCalendar = () => {
    setShowDayView(false);
    setSelectedDate(null);
  };

  // Function to get menu for a specific date - now uses dynamic data from API
  const getMenuForDateLocal = async (dateString) => {
    return await getMenuForDate(dateString);
  };

  const handleMealRegister = async (dateString, meal, mealType) => {
    const displayDate = new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Check if already registered for this meal
    if (userBookings[dateString] && userBookings[dateString][meal]) {
      const existingBooking = userBookings[dateString][meal];
      // Show cancel confirmation
      Alert.alert(
        'Cancel Registration',
        `Are you sure you want to cancel your ${mealType.toLowerCase()} registration for ${displayDate}? You were registered for ${existingBooking.numPeople} people.`,
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await updateBookingStatus(existingBooking.id, 'Cancelled');
                if (result.success) {
                  // Update local state
                  setUserBookings(prev => {
                    const newBookings = { ...prev };
                    if (newBookings[dateString]) {
                      delete newBookings[dateString][meal];
                      // If no meals left for this date, remove the date entry
                      if (Object.keys(newBookings[dateString]).length === 0) {
                        delete newBookings[dateString];
                      }
                    }
                    return newBookings;
                  });
                  Alert.alert('Success', 'Booking cancelled successfully');
                  // Refresh user stats after cancellation
                  loadUserStats();
                } else {
                  Alert.alert('Error', result.message || 'Failed to cancel booking');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to cancel booking. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      // Show registration modal
      setSelectedDay(dateString);
      setSelectedMeal(meal);
      setSelectedMealType(mealType);
      setNumberOfPeople('');
      setModalVisible(true);
    }
  };

  const handleConfirmRegistration = async () => {
    if (numberOfPeople && parseInt(numberOfPeople) > 0) {
      try {
        // Convert meal key back to proper case for API
        const mealTypeForAPI = selectedMealType; // This is already in proper case like "Breakfast"
        
        const result = await createBooking(selectedDay, mealTypeForAPI, parseInt(numberOfPeople));
        
        if (result.success) {
          // Update local state with new booking
          setUserBookings(prev => ({
            ...prev,
            [selectedDay]: {
              ...prev[selectedDay],
              [selectedMeal]: {
                numPeople: parseInt(numberOfPeople),
                status: 'Booked',
                id: result.booking.id
              }
            }
          }));
          
          setModalVisible(false);
          setNumberOfPeople('');
          setSelectedDay('');
          setSelectedMeal('');
          setSelectedMealType('');
          
          Alert.alert('Success', result.message || 'Booking confirmed successfully');
          // Refresh user stats after booking
          loadUserStats();
        } else {
          Alert.alert('Error', result.message || 'Failed to create booking');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to create booking. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter a valid number of people (greater than 0)');
    }
  };

  const handleCancelModal = () => {
    setModalVisible(false);
    setNumberOfPeople('');
    setSelectedDay('');
    setSelectedMeal('');
    setSelectedMealType('');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDisplayDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderMealSection = (mealType, items, day, onRegister) => {
    const mealKey = mealType.toLowerCase();
    const isRegistered = userBookings[day] && userBookings[day][mealKey] && userBookings[day][mealKey].status === 'Booked';
    const booking = userBookings[day] && userBookings[day][mealKey];
    
    return (
      <View style={styles.mealSection}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealTitle}>{mealType}</Text>
          <TouchableOpacity 
            style={[
              styles.mealRegisterButton, 
              isRegistered && styles.mealRegisteredButton
            ]}
            onPress={() => onRegister(day, mealKey, mealType)}
          >
            <Text style={styles.mealRegisterText}>
              {isRegistered ? '✓ Registered' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mealItems}>
          {(items || []).map((foodItem, index) => (
            <Text key={index} style={styles.foodItemText}>• {foodItem}</Text>
          ))}
        </View>
        {isRegistered && booking && (
          <View style={styles.mealRegistrationInfo}>
            <Text style={styles.mealRegistrationText}>
              ✓ {booking.numPeople} {booking.numPeople === 1 ? 'person' : 'people'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Calendar View
  const renderCalendarView = () => {
    // Get dates that have bookings to mark them on calendar
    const markedDates = {};
    Object.keys(userBookings).forEach(dateString => {
      const activeBookings = Object.values(userBookings[dateString]).filter(booking => 
        booking.status === 'Booked' || booking.status === 'Attended'
      );
      const bookingCount = activeBookings.length;
      
      if (bookingCount > 0) {
        markedDates[dateString] = {
          marked: true,
          dotColor: '#4CAF50',
          customStyles: {
            container: {
              backgroundColor: '#e8f5e8'
            },
            text: {
              color: '#2e7d32',
              fontWeight: 'bold'
            }
          }
        };
      }
    });

    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.title}>Food Service Menu</Text>
            <Text style={styles.subtitle}>Welcome, {user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.calendarSubtitle}>Select a date to view meal options</Text>
        
        {menuLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.loadingText}>Loading menu...</Text>
          </View>
        )}
        
        <Calendar
          onDayPress={handleDateSelect}
          markingType={'custom'}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196F3',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#4CAF50',
            selectedDotColor: '#ffffff',
            arrowColor: '#2196F3',
            monthTextColor: '#2d4150',
            indicatorColor: '#2196F3',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14
          }}
          style={styles.calendar}
        />
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Meals registered</Text>
          </View>
        </View>

        {/* Dashboard Summary Section */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Dashboard Summary</Text>
          
          {loadingStats ? (
            <View style={styles.summaryLoadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.summaryLoadingText}>Loading statistics...</Text>
            </View>
          ) : (
            <View style={styles.summaryStatsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{userStats.totalBooked}</Text>
                <Text style={styles.statLabel}>Total Booked</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, styles.attendedNumber]}>{userStats.totalAttended}</Text>
                <Text style={styles.statLabel}>Total Attended</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, styles.missedNumber]}>{userStats.totalMissed}</Text>
                <Text style={styles.statLabel}>Total Missed</Text>
              </View>
            </View>
          )}

          {/* Additional Info */}
          {!loadingStats && userStats.upcomingBookings > 0 && (
            <View style={styles.summaryInfoContainer}>
              <Text style={styles.summaryInfoText}>
                📅 You have {userStats.upcomingBookings} upcoming meal{userStats.upcomingBookings !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Day Detail View
  const renderDayDetailView = () => {
    
    // Show loading or error state if menu data is not available
    if (loadingDayMenu || !menuData) {
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToCalendar}>
              <Text style={styles.backButtonText}>← Back to Calendar</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            {loadingDayMenu ? (
              <>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading menu...</Text>
              </>
            ) : (
              <Text style={styles.errorText}>Unable to load menu data</Text>
            )}
          </View>
        </View>
      );
    }
    const dateBookings = userBookings[selectedDate] || {};
    const activeBookings = Object.values(dateBookings).filter(booking => 
      booking.status === 'Booked' || booking.status === 'Attended'
    );
    const totalMealsRegistered = activeBookings.length;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToCalendar}>
              <Text style={styles.backButtonText}>← Back to Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Meals for {menuData.dayName}</Text>
          <Text style={styles.subtitle}>{formatDisplayDate(selectedDate)}</Text>
          {totalMealsRegistered > 0 && (
            <Text style={styles.totalRegistrationsText}>
              {totalMealsRegistered} meal{totalMealsRegistered > 1 ? 's' : ''} registered
            </Text>
          )}
        </View>
        
        <View style={styles.mealsContainer}>
          {renderMealSection('Breakfast', menuData.breakfast, selectedDate, handleMealRegister)}
          {renderMealSection('Lunch', menuData.lunch, selectedDate, handleMealRegister)}
          {renderMealSection('Dinner', menuData.dinner, selectedDate, handleMealRegister)}
        </View>
      </View>
    );
  };

  // Main render
  return (
    <>
      {showDayView ? renderDayDetailView() : renderCalendarView()}

      {/* Registration Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Register for {selectedMealType}</Text>
            <Text style={styles.modalSubtitle}>{selectedDay ? formatDate(selectedDay) : ''} - How many people?</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Number of people"
              value={numberOfPeople}
              onChangeText={setNumberOfPeople}
              keyboardType="numeric"
              maxLength={2}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={handleCancelModal}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleConfirmRegistration}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuList: {
    flex: 1,
  },
  dayContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  totalRegistrationsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  // Calendar styles
  calendar: {
    marginTop: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  // Header styles for day detail view
  header: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  mealsContainer: {
    marginTop: 4,
  },
  mealSection: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  mealRegisterButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
  },
  mealRegisteredButton: {
    backgroundColor: '#4CAF50',
  },
  mealRegisterText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  mealItems: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  foodItemText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 2,
  },
  mealRegistrationInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  mealRegistrationText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 0.45,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 0.45,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  // New styles for logout functionality
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
  // Dashboard Summary styles
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  summaryLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  summaryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  attendedNumber: {
    color: '#4CAF50',
  },
  missedNumber: {
    color: '#f44336',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryInfoContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  summaryInfoText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default UserDashboardScreen;
