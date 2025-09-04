import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logout, fetchBookings, updateBookingStatus, createWalkInUser, fetchMealCapacity } = useAuth();
  
  // View mode and date selection state
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  
  // Walk-in registration state
  const [walkInModalVisible, setWalkInModalVisible] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    phone: '',
    mealType: 'Lunch',
    numPeople: '1'
  });
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // Live booking data for selected date
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Meal capacity status for selected date
  const [capacityStatus, setCapacityStatus] = useState({
    Breakfast: { currentCapacity: 0, maxCapacity: 100, utilizationPercentage: 0, isFull: false },
    Lunch: { currentCapacity: 0, maxCapacity: 100, utilizationPercentage: 0, isFull: false },
    Dinner: { currentCapacity: 0, maxCapacity: 100, utilizationPercentage: 0, isFull: false }
  });
  const [loadingCapacity, setLoadingCapacity] = useState(false);

  // Date selection handler
  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    setShowDetailView(true);
    loadBookingsForDate(day.dateString);
    loadCapacityForDate(day.dateString);
  };

  // Load capacity status for selected date
  const loadCapacityForDate = async (dateString) => {
    setLoadingCapacity(true);
    try {
      const result = await fetchMealCapacity(dateString);
      if (result.success) {
        setCapacityStatus(result.data.capacityStatus);
      } else {
        console.error('Failed to load capacity status:', result.message);
      }
    } catch (error) {
      console.error('Error loading capacity status:', error);
    } finally {
      setLoadingCapacity(false);
    }
  };

  // Load booking data for selected date
  const loadBookingsForDate = async (dateString) => {
    setLoadingBookings(true);
    try {
      const result = await fetchBookings(dateString);
      if (result.success) {
        // Convert API response to attendance format
        const bookingData = [];
        
        // Process grouped bookings by meal type
        if (result.data.bookings.Breakfast) {
          bookingData.push(...result.data.bookings.Breakfast.map(booking => ({
            id: booking.id.toString(),
            name: booking.user.name,
            phone: booking.user.phone,
            peopleCount: booking.numPeople,
            mealType: 'Breakfast',
            attended: booking.status === 'Attended',
            status: booking.status,
            bookingId: booking.id
          })));
        }
        
        if (result.data.bookings.Lunch) {
          bookingData.push(...result.data.bookings.Lunch.map(booking => ({
            id: booking.id.toString(),
            name: booking.user.name,
            phone: booking.user.phone,
            peopleCount: booking.numPeople,
            mealType: 'Lunch',
            attended: booking.status === 'Attended',
            status: booking.status,
            bookingId: booking.id
          })));
        }
        
        if (result.data.bookings.Dinner) {
          bookingData.push(...result.data.bookings.Dinner.map(booking => ({
            id: booking.id.toString(),
            name: booking.user.name,
            phone: booking.user.phone,
            peopleCount: booking.numPeople,
            mealType: 'Dinner',
            attended: booking.status === 'Attended',
            status: booking.status,
            bookingId: booking.id
          })));
        }
        
        setAttendanceData(bookingData);
      } else {
        console.error('Failed to load bookings:', result.message);
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Error loading bookings for date:', error);
      setAttendanceData([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Back to calendar handler
  const handleBackToCalendar = () => {
    setShowDetailView(false);
    setSelectedDate(null);
  };

  const handleAttendanceToggle = async (userId) => {
    const booking = attendanceData.find(item => item.id === userId);
    if (!booking) return;

    const newStatus = booking.attended ? 'Booked' : 'Attended';
    
    try {
      const result = await updateBookingStatus(booking.bookingId, newStatus);
      if (result.success) {
        // Update local state
        setAttendanceData(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, attended: !user.attended, status: newStatus }
              : user
          )
        );
        // Refresh capacity status after attendance change
        loadCapacityForDate(selectedDate);
      } else {
        Alert.alert('Error', result.message || 'Failed to update attendance');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance. Please try again.');
    }
  };

  const handleOpenWalkInModal = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date first');
      return;
    }
    setWalkInModalVisible(true);
  };

  const handleCloseWalkInModal = () => {
    setWalkInModalVisible(false);
    setWalkInForm({
      name: '',
      phone: '',
      mealType: 'Lunch',
      numPeople: '1'
    });
  };

  const handleWalkInSubmit = async () => {
    // Validate form
    if (!walkInForm.name.trim()) {
      Alert.alert('Error', 'Please enter the customer\'s name');
      return;
    }
    
    if (!walkInForm.phone.trim()) {
      Alert.alert('Error', 'Please enter the customer\'s phone number');
      return;
    }

    // Format phone number to include country code if not present
    let formattedPhone = walkInForm.phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone; // Default to +91 for India
    }

    const numPeople = parseInt(walkInForm.numPeople);
    if (!numPeople || numPeople <= 0) {
      Alert.alert('Error', 'Please enter a valid number of people');
      return;
    }

    setSubmittingWalkIn(true);
    
    try {
      const result = await createWalkInUser(
        walkInForm.name.trim(),
        formattedPhone,
        selectedDate,
        walkInForm.mealType,
        numPeople
      );

      if (result.success) {
        Alert.alert('Success', result.message);
        handleCloseWalkInModal();
        // Refresh the booking data and capacity status to show the new walk-in
        loadBookingsForDate(selectedDate);
        loadCapacityForDate(selectedDate);
      } else {
        Alert.alert('Error', result.message || 'Failed to register walk-in customer');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to register walk-in customer. Please try again.');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const getAttendanceStats = () => {
    const totalRegistered = attendanceData.length;
    const totalAttended = attendanceData.filter(user => user.attended).length;
    const totalPeople = attendanceData.reduce((sum, user) => sum + user.peopleCount, 0);
    const attendedPeople = attendanceData
      .filter(user => user.attended)
      .reduce((sum, user) => sum + user.peopleCount, 0);
    
    return { totalRegistered, totalAttended, totalPeople, attendedPeople };
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

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.attendanceItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.peopleCount}>
          {item.peopleCount} {item.peopleCount === 1 ? 'person' : 'people'}
        </Text>
        <Text style={styles.mealTypeText}>{item.mealType}</Text>
      </View>
      
      <View style={styles.attendanceControl}>
        <Text style={[styles.attendanceStatus, item.attended && styles.attendedText]}>
          {item.attended ? 'Present' : 'Absent'}
        </Text>
        <Switch
          value={item.attended}
          onValueChange={() => handleAttendanceToggle(item.id)}
          trackColor={{ false: '#ddd', true: '#4CAF50' }}
          thumbColor={item.attended ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  const stats = getAttendanceStats();

  // Calendar View
  const renderCalendarView = () => (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Welcome, {user?.name || 'Admin'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Admin Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminMenuManagement')}
          >
            <Text style={styles.actionButtonText}>📋 Manage Menus</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.calendarSubtitle}>Select a date to view attendance details</Text>
        
        <Calendar
          onDayPress={handleDateSelect}
          markingType={'simple'}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: '#2196F3'
            }
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196F3',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#2196F3',
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
      </View>
    </View>
  );

  // Detail View for selected date
  const renderDetailView = () => (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToCalendar}>
            <Text style={styles.backButtonText}>← Back to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Day Details</Text>
        <Text style={styles.subtitle}>
          {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {/* Walk-in Customers Section */}
        <View style={styles.walkInContainer}>
          <Text style={styles.walkInTitle}>Walk-in Customers</Text>
          <TouchableOpacity 
            style={styles.addWalkInButton}
            onPress={handleOpenWalkInModal}
          >
            <Text style={styles.addWalkInButtonText}>+ Register Walk-in Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Meal Capacity Status */}
        <View style={styles.capacityContainer}>
          <Text style={styles.capacityTitle}>Meal Capacity Status</Text>
          
          {loadingCapacity ? (
            <View style={styles.capacityLoadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.capacityLoadingText}>Loading capacity...</Text>
            </View>
          ) : (
            <View style={styles.capacityBarsContainer}>
              {['Breakfast', 'Lunch', 'Dinner'].map((mealType) => {
                const capacity = capacityStatus[mealType];
                const fillPercentage = Math.min(capacity.utilizationPercentage, 100);
                const isNearFull = fillPercentage >= 80;
                const isFull = capacity.isFull;

                return (
                  <View key={mealType} style={styles.capacityBarSection}>
                    <View style={styles.capacityBarHeader}>
                      <Text style={styles.capacityMealType}>{mealType}</Text>
                      <Text style={[
                        styles.capacityCount,
                        isFull && styles.capacityCountFull,
                        isNearFull && !isFull && styles.capacityCountNearFull
                      ]}>
                        {capacity.currentCapacity}/{capacity.maxCapacity}
                      </Text>
                    </View>
                    
                    <View style={styles.capacityBarBackground}>
                      <View 
                        style={[
                          styles.capacityBarFill,
                          { width: `${fillPercentage}%` },
                          isFull && styles.capacityBarFull,
                          isNearFull && !isFull && styles.capacityBarNearFull
                        ]} 
                      />
                    </View>
                    
                    <Text style={styles.capacityPercentage}>{fillPercentage}% full</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Attendance Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalAttended}</Text>
            <Text style={styles.statLabel}>Attended</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalRegistered}</Text>
            <Text style={styles.statLabel}>Registered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.attendedPeople}</Text>
            <Text style={styles.statLabel}>People Fed</Text>
          </View>
        </View>

        {/* Attendance List Section */}
        <View style={styles.attendanceSection}>
          <Text style={styles.attendanceSectionTitle}>Registered People</Text>
          
          {loadingBookings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading bookings...</Text>
            </View>
          ) : attendanceData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found for this date</Text>
            </View>
          ) : (
            <View style={styles.attendanceListContainer}>
              {attendanceData.map((item) => (
                <View key={item.id} style={styles.attendanceItem}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.peopleCount}>
                      {item.peopleCount} {item.peopleCount === 1 ? 'person' : 'people'}
                    </Text>
                    <Text style={styles.mealTypeText}>{item.mealType}</Text>
                  </View>
                  
                  <View style={styles.attendanceControl}>
                    <Text style={[styles.attendanceStatus, item.attended && styles.attendedText]}>
                      {item.attended ? 'Present' : 'Absent'}
                    </Text>
                    <Switch
                      value={item.attended}
                      onValueChange={() => handleAttendanceToggle(item.id)}
                      trackColor={{ false: '#ddd', true: '#4CAF50' }}
                      thumbColor={item.attended ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Bottom padding for scroll space */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );

  // Main render
  return (
    <>
      {showDetailView ? renderDetailView() : renderCalendarView()}
      
      {/* Walk-in Registration Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={walkInModalVisible}
        onRequestClose={handleCloseWalkInModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Register Walk-in Customer</Text>
            <Text style={styles.modalSubtitle}>
              {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : ''}
            </Text>
            
            {/* Name Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="Customer Name *"
              value={walkInForm.name}
              onChangeText={(text) => setWalkInForm(prev => ({ ...prev, name: text }))}
              maxLength={100}
            />
            
            {/* Phone Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number *"
              value={walkInForm.phone}
              onChangeText={(text) => setWalkInForm(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
              maxLength={15}
            />
            
            {/* Meal Type Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Meal Type:</Text>
              <View style={styles.pickerButtons}>
                {['Breakfast', 'Lunch', 'Dinner'].map((meal) => (
                  <TouchableOpacity
                    key={meal}
                    style={[
                      styles.pickerButton,
                      walkInForm.mealType === meal && styles.pickerButtonSelected
                    ]}
                    onPress={() => setWalkInForm(prev => ({ ...prev, mealType: meal }))}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      walkInForm.mealType === meal && styles.pickerButtonTextSelected
                    ]}>
                      {meal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Number of People */}
            <TextInput
              style={styles.modalInput}
              placeholder="Number of People"
              value={walkInForm.numPeople}
              onChangeText={(text) => setWalkInForm(prev => ({ ...prev, numPeople: text }))}
              keyboardType="numeric"
              maxLength={2}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={handleCloseWalkInModal}
                disabled={submittingWalkIn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalConfirmButton, submittingWalkIn && styles.modalButtonDisabled]}
                onPress={handleWalkInSubmit}
                disabled={submittingWalkIn}
              >
                {submittingWalkIn ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Register</Text>
                )}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
  attendanceSection: {
    marginTop: 8,
  },
  attendanceSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  attendanceListContainer: {
    // No flex: 1 here since we're in ScrollView
  },
  attendanceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  peopleCount: {
    fontSize: 14,
    color: '#666',
  },
  mealTypeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginTop: 2,
  },
  attendanceControl: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  attendanceStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f44336',
    marginRight: 12,
    minWidth: 60,
    textAlign: 'center',
  },
  attendedText: {
    color: '#4CAF50',
  },
  // Walk-in styles
  walkInContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walkInTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  addWalkInButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addWalkInButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Calendar styles
  calendar: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Fixed header styles for detail view
  fixedHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1,
  },
  // Scrollable content styles
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  // New styles for logout functionality
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Modal styles for walk-in registration
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  pickerButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pickerButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
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
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  // Capacity status styles
  capacityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  capacityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  capacityLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  capacityLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  capacityBarsContainer: {
    gap: 16,
  },
  capacityBarSection: {
    marginBottom: 4,
  },
  capacityBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityMealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  capacityCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  capacityCountNearFull: {
    color: '#ff9800',
  },
  capacityCountFull: {
    color: '#f44336',
  },
  capacityBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  capacityBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  capacityBarNearFull: {
    backgroundColor: '#ff9800',
  },
  capacityBarFull: {
    backgroundColor: '#f44336',
  },
  capacityPercentage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  // Additional layout styles
  bottomPadding: {
    height: 20,
  },
  // Calendar view container with padding
  calendarContainer: {
    padding: 16,
  },
});

export default AdminDashboardScreen;
