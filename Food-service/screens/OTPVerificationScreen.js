import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { phone } = route.params;
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { verifyOTP, sendOTP } = useAuth();
  
  // Refs for OTP inputs
  const otpRefs = useRef([]);

  useEffect(() => {
    // Focus on first input when screen loads
    if (otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, []);

  const handleOTPChange = (text, index) => {
    // Only allow digits
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= 1) {
      const newOTP = [...otp];
      newOTP[index] = numericText;
      setOTP(newOTP);

      // Auto-focus next input
      if (numericText && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }

      // Auto-verify when all digits are entered
      if (index === 5 && numericText) {
        const completeOTP = [...newOTP];
        completeOTP[5] = numericText;
        
        if (completeOTP.every(digit => digit !== '')) {
          handleVerifyOTP(completeOTP.join(''));
        }
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const codeToVerify = otpCode || otp.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      const result = await verifyOTP(phone, codeToVerify);
      
      if (result.success) {
        if (result.userExists) {
          // User exists - login directly
          // Navigation will be handled by AuthContext automatically
          console.log('User authenticated, navigation handled by AuthContext');
        } else {
          // User doesn't exist - navigate to registration
          navigation.navigate('UserRegistration', {
            phone: result.phone,
            otp: codeToVerify,
            role: result.role
          });
        }
      } else {
        Alert.alert('Verification Failed', result.message);
        // Clear OTP inputs on failure
        setOTP(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Verification failed. Please try again.');
      // Clear OTP inputs on error
      setOTP(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    
    try {
      const result = await sendOTP(phone);
      
      if (result.success) {
        Alert.alert('OTP Sent', 'A new verification code has been sent to your phone.');
        // Clear current OTP
        setOTP(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleBackToPhone = () => {
    navigation.goBack();
  };

  const renderOTPInputs = () => {
    return otp.map((digit, index) => (
      <TextInput
        key={index}
        ref={(ref) => otpRefs.current[index] = ref}
        style={[
          styles.otpInput,
          digit && styles.otpInputFilled,
          loading && styles.otpInputDisabled
        ]}
        value={digit}
        onChangeText={(text) => handleOTPChange(text, index)}
        onKeyPress={(e) => handleKeyPress(e, index)}
        keyboardType="numeric"
        maxLength={1}
        selectTextOnFocus
        editable={!loading}
      />
    ));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneNumber}>{phone}</Text>
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Verification Code</Text>
          
          <View style={styles.otpContainer}>
            {renderOTPInputs()}
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => handleVerifyOTP()}
            disabled={loading || otp.some(digit => !digit)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity 
              onPress={handleResendOTP}
              disabled={resending}
              style={styles.resendButton}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#2196F3" />
              ) : (
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleBackToPhone}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Change Phone Number</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.helpText}>
            The verification code expires in 10 minutes
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    fontWeight: '600',
    color: '#333',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#f9f9f9',
  },
  otpInputFilled: {
    borderColor: '#2196F3',
    backgroundColor: '#f0f8ff',
  },
  otpInputDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default OTPVerificationScreen;
