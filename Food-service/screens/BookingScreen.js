import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';

const BookingScreen = ({ navigation }) => {
  const { user, createBooking, fetchBookings, updateBookingStatus } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
  const peopleOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];
  
  // Get maximum date (30 days from now)
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => {
    if (selectedDate) {
      fetchUserBookings();
    }
  }, [selectedDate]);

  const fetchUserBookings = async () => {
    if (!selectedDate) return;
    
    setRefreshing(true);
    try {
      const result = await fetchBookings(selectedDate);
      if (result.success) {
        // Filter to show only user's own bookings
        const allBookings = result.data.bookings;
        const myBookings = Array.isArray(allBookings) 
          ? allBookings.filter(booking => booking.userId === user.id)
          : [];
        setUserBookings(myBookings);
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleCreateBooking = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    if (!selectedMealType) {
      Alert.alert('Error', 'Please select a meal type');
      return;
    }

    setLoading(true);
    
    try {
      const result = await createBooking(selectedDate, selectedMealType, numPeople);
      
      if (result.success) {
        Alert.alert(
          'Success',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form and refresh bookings
                setSelectedMealType('');
                setNumPeople(1);
                fetchUserBookings();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await updateBookingStatus(bookingId, 'Cancelled');
              
              if (result.success) {
                Alert.alert('Success', 'Booking cancelled successfully');
                fetchUserBookings();
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
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

  // Create marked dates for calendar
  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#2196F3'
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book a Meal</Text>
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
          {/* Meal Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Meal Type</Text>
            <View style={styles.buttonGrid}>
              {mealTypes.map((mealType) => (
                <TouchableOpacity
                  key={mealType}
                  style={[
                    styles.optionButton,
                    selectedMealType === mealType && styles.selectedButton
                  ]}
                  onPress={() => setSelectedMealType(mealType)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedMealType === mealType && styles.selectedText
                  ]}>
                    {mealType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Number of People */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of People</Text>
            <View style={styles.buttonGrid}>
              {peopleOptions.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.numberButton,
                    numPeople === count && styles.selectedButton
                  ]}
                  onPress={() => setNumPeople(count)}
                >
                  <Text style={[
                    styles.optionText,
                    numPeople === count && styles.selectedText
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={[styles.bookButton, (!selectedMealType || loading) && styles.disabledButton]}
            onPress={handleCreateBooking}
            disabled={!selectedMealType || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>
                Book {selectedMealType} for {numPeople} {numPeople === 1 ? 'person' : 'people'}
              </Text>
            )}
          </TouchableOpacity>

          {/* User's Existing Bookings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Your Bookings for {selectedDate}
            </Text>
            {refreshing ? (
              <ActivityIndicator style={styles.loading} />
            ) : userBookings.length > 0 ? (
              userBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingMeal}>{booking.mealType}</Text>
                    <Text style={styles.bookingDetails}>
                      {booking.numPeople} {booking.numPeople === 1 ? 'person' : 'people'}
                    </Text>
                    <Text style={[styles.bookingStatus, { color: getStatusColor(booking.status) }]}>
                      {booking.status}
                    </Text>
                  </View>
                  {booking.status === 'Booked' && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelBooking(booking.id)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noBookingsText}>No bookings for this date</Text>
            )}
          </View>
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
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  numberButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 50,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingMeal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bookingStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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

export default BookingScreen;
