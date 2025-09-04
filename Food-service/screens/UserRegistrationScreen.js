import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const UserRegistrationScreen = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerUser } = useAuth();
  
  // Get phone and otp from route params
  const { phone, otp, role } = route.params || {};

  useEffect(() => {
    if (!phone || !otp) {
      Alert.alert('Error', 'Missing registration data. Please try again.');
      navigation.goBack();
    }
  }, [phone, otp, navigation]);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters long');
      return;
    }

    setLoading(true);
    
    try {
      await registerUser(phone, otp, name.trim());
      // Navigation will be handled by AuthContext after successful registration
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed', 
        error.message || 'Failed to register. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    Alert.alert(
      'Go Back?',
      'Your OTP verification will be lost. You\'ll need to request a new OTP.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Go Back', onPress: () => navigation.navigate('PhoneInput') }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Complete Registration</Text>
          <Text style={styles.subtitle}>
            Welcome! Please enter your name to complete the registration.
          </Text>
          
          <View style={styles.phoneContainer}>
            <Text style={styles.phoneLabel}>Phone Number:</Text>
            <Text style={styles.phoneNumber}>{phone}</Text>
          </View>

          {role === 'Admin' && (
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>🔑 Admin Account</Text>
              <Text style={styles.roleDescription}>
                You will have administrative privileges
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={255}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Complete Registration</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Back to Phone Input</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  phoneContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  phoneLabel: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  phoneNumber: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 2,
  },
  roleContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#bf360c',
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

export default UserRegistrationScreen;
