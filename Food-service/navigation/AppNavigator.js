import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import PhoneInputScreen from '../screens/PhoneInputScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import UserRegistrationScreen from '../screens/UserRegistrationScreen';
import UserDashboardScreen from '../screens/UserDashboardScreen';
import BookingScreen from '../screens/BookingScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminMenuManagementScreen from '../screens/AdminMenuManagementScreen';
import AdminBookingManagementScreen from '../screens/AdminBookingManagementScreen';

const Stack = createStackNavigator();

// Loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2196F3" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Auth stack for unauthenticated users
const AuthStack = () => (
  <Stack.Navigator 
    initialRouteName="Login"
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ title: 'Food Service Login' }}
    />
    <Stack.Screen 
      name="PhoneInput" 
      component={PhoneInputScreen}
      options={{ title: 'Enter Phone Number' }}
    />
    <Stack.Screen 
      name="OTPVerification" 
      component={OTPVerificationScreen}
      options={{ 
        title: 'Verify OTP',
        headerBackTitleVisible: false
      }}
    />
    <Stack.Screen 
      name="UserRegistration" 
      component={UserRegistrationScreen}
      options={{ 
        title: 'Registration',
        headerBackTitleVisible: false
      }}
    />
  </Stack.Navigator>
);

// Main app stack for authenticated users
const MainStack = () => {
  const { user } = useAuth();
  
  return (
    <Stack.Navigator 
      initialRouteName={user?.role === 'Admin' ? 'AdminDashboard' : 'UserDashboard'}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="UserDashboard" 
        component={UserDashboardScreen}
        options={{ 
          title: 'User Dashboard',
          headerLeft: () => null, // Disable back button
        }}
      />
      <Stack.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{ 
          title: 'Book Meals',
        }}
      />
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ 
          title: 'Admin Dashboard',
          headerLeft: () => null, // Disable back button
        }}
      />
      <Stack.Screen 
        name="AdminMenuManagement" 
        component={AdminMenuManagementScreen}
        options={{ 
          title: 'Menu Management',
        }}
      />
      <Stack.Screen 
        name="AdminBookingManagement" 
        component={AdminBookingManagementScreen}
        options={{ 
          title: 'Booking Management',
        }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default AppNavigator;