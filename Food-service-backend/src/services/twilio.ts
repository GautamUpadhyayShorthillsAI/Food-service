import twilio from 'twilio';
import { TwilioConfig } from '../config';

const client = twilio(TwilioConfig.accountSid, TwilioConfig.authToken);

// Development mode - bypass Twilio for testing
const DEVELOPMENT_MODE = true;

export const sendOtp = async (phone: string): Promise<boolean> => {
  if (DEVELOPMENT_MODE) {
    console.log(`🚀 [DEV MODE] Mock OTP sent to: ${phone}`);
    console.log(`📱 [DEV MODE] Use OTP codes: 123456 (User) or 666666 (Admin)`);
    return true; // Always return success in dev mode
  }

  try {
    console.log(`🔥 Attempting to send OTP to: ${phone}`);
    console.log(`🔧 Using Verify Service ID: ${TwilioConfig.verifySid}`);
    
    const verification = await client.verify.v2
      .services(TwilioConfig.verifySid)
      .verifications.create({ to: phone, channel: 'sms' });
    
    console.log(`✅ OTP sent to ${phone}: ${verification.status}`);
    return verification.status === 'pending';
  } catch (error) {
    console.error(`❌ Error sending OTP to ${phone}:`, error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
};

export const verifyOtp = async (phone: string, otp: string): Promise<{ success: boolean; role?: 'User' | 'Admin' }> => {
  if (DEVELOPMENT_MODE) {
    console.log(`🚀 [DEV MODE] Verifying OTP: ${otp} for phone: ${phone}`);
    
    if (otp === '123456') {
      console.log(`✅ [DEV MODE] Valid User OTP - role: User`);
      return { success: true, role: 'User' };
    } else if (otp === '666666') {
      console.log(`✅ [DEV MODE] Valid Admin OTP - role: Admin`);
      return { success: true, role: 'Admin' };
    } else {
      console.log(`❌ [DEV MODE] Invalid OTP: ${otp}`);
      return { success: false };
    }
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(TwilioConfig.verifySid)
      .verificationChecks.create({ to: phone, code: otp });
    console.log(`OTP verification for ${phone}: ${verificationCheck.status}`);
    return { success: verificationCheck.status === 'approved', role: 'User' };
  } catch (error) {
    console.error(`Error verifying OTP for ${phone}:`, error);
    return { success: false };
  }
};