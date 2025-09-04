import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';

const AdminBookingManagementScreen = ({ navigation }) => {
  const { user, fetchBookings, updateBookingStatus } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBookings, setTotalBookings] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];
  
  // Get maximum date (30 days from now)
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => {
    if (selectedDate) {
      fetchBookingsForDate();
    }
  }, [selectedDate]);

  const fetchBookingsForDate = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const result = await fetchBookings(selectedDate);
      if (result.success) {
        setBookings(result.data.bookings);
        setTotalBookings(result.data.totalBookings || 0);
        setStatusCounts(result.data.statusCounts || {});
      } else {
        Alert.alert('Error', result.message);
        setBookings({});
        setTotalBookings(0);
        setStatusCounts({});
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleStatusUpdate = async (bookingId, newStatus, userInfo) => {
    const statusMap = {
      'Booked': 'Booked',
      'Attended': 'Attended',
      'Cancelled': 'Cancelled'
    };

    Alert.alert(
      'Update Booking Status',
      `Update ${userInfo.name}'s booking to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await updateBookingStatus(bookingId, statusMap[newStatus]);
              
              if (result.success) {
                Alert.alert('Success', `Booking updated to ${newStatus}`);
                fetchBookingsForDate(); // Refresh the data
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update booking status');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked': return '#4CAF50';
      case 'Cancelled': return '#F44336';
      case 'Attended': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusActions = (currentStatus) => {
    switch (currentStatus) {
      case 'Booked':
        return ['Attended', 'Cancelled'];
      case 'Cancelled':
        return ['Booked'];
      case 'Attended':
        return ['Cancelled'];
      default:
        return [];
    }
  };

  const renderBookingCard = (booking) => {
    const statusActions = getStatusActions(booking.status);
    
    return (
      <View key={booking.id} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{booking.user.name}</Text>
            <Text style={styles.userPhone}>{booking.user.phone}</Text>
          </View>
          <View style={styles.bookingDetails}>
            <Text style={styles.peopleCount}>
              {booking.numPeople} {booking.numPeople === 1 ? 'person' : 'people'}
            </Text>
            <Text style={[styles.status, { color: getStatusColor(booking.status) }]}>
              {booking.status}
            </Text>
          </View>
        </View>
        
        {statusActions.length > 0 && (
          <View style={styles.actionButtons}>
            {statusActions.map((action) => (
              <TouchableOpacity
                key={action}
                style={[styles.actionButton, { backgroundColor: getStatusColor(action) }]}
                onPress={() => handleStatusUpdate(booking.id, action, booking.user)}
              >
                <Text style={styles.actionButtonText}>Mark {action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMealSection = (mealType, mealBookings) => {
    if (!mealBookings || mealBookings.length === 0) {
      return (
        <View key={mealType} style={styles.mealSection}>
          <Text style={styles.mealTitle}>{mealType}</Text>
          <Text style={styles.noBookingsText}>No bookings</Text>
        </View>
      );
    }

    const mealTotalPeople = mealBookings.reduce((sum, booking) => sum + booking.numPeople, 0);

    return (
      <View key={mealType} style={styles.mealSection}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealTitle}>{mealType}</Text>
          <Text style={styles.mealStats}>
            {mealBookings.length} bookings • {mealTotalPeople} people
          </Text>
        </View>
        {mealBookings.map(renderBookingCard)}
      </View>
    );
  };

  // Create marked dates for calendar
  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#2196F3'
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchBookingsForDate} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Booking Management</Text>
        <Text style={styles.subtitle}>Welcome {user?.name}</Text>
      </View>

      {/* Calendar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          minDate={minDate}
          maxDate={maxDate}
          theme={{
            selectedDayBackgroundColor: '#2196F3',
            todayTextColor: '#2196F3',
            arrowColor: '#2196F3',
          }}
        />
      </View>

      {selectedDate && (
        <>
          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary for {selectedDate}</Text>
            {loading ? (
              <ActivityIndicator style={styles.loading} />
            ) : (
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{totalBookings}</Text>
                  <Text style={styles.summaryLabel}>Total Bookings</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: '#4CAF50' }]}>
                    {statusCounts.Booked || 0}
                  </Text>
                  <Text style={styles.summaryLabel}>Booked</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: '#2196F3' }]}>
                    {statusCounts.Attended || 0}
                  </Text>
                  <Text style={styles.summaryLabel}>Attended</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: '#F44336' }]}>
                    {statusCounts.Cancelled || 0}
                  </Text>
                  <Text style={styles.summaryLabel}>Cancelled</Text>
                </View>
              </View>
            )}
          </View>

          {/* Bookings by Meal Type */}
          {!loading && totalBookings > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bookings by Meal</Text>
              {renderMealSection('Breakfast', bookings.Breakfast)}
              {renderMealSection('Lunch', bookings.Lunch)}
              {renderMealSection('Dinner', bookings.Dinner)}
            </View>
          )}

          {!loading && totalBookings === 0 && (
            <View style={styles.section}>
              <Text style={styles.noBookingsText}>No bookings for this date</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mealSection: {
    marginBottom: 24,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  mealStats: {
    fontSize: 14,
    color: '#666',
  },
  bookingCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bookingDetails: {
    alignItems: 'flex-end',
  },
  peopleCount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noBookingsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  loading: {
    marginTop: 20,
  },
});

export default AdminBookingManagementScreen;
