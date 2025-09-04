import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const DBConfig = {
  url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
};

export const ServerConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export const TwilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  verifySid: process.env.TWILIO_VERIFY_SID || '',
};
