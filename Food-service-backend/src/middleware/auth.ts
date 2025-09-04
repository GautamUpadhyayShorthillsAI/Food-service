import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthConfig } from '../config';
import { db, users } from '../db';
import { eq } from 'drizzle-orm';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        phone: string;
        name: string;
        role: 'User' | 'Admin';
      };
    }
  }
}

export interface JWTPayload {
  id: number;
  role: 'User' | 'Admin';
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization header required. Format: Bearer <token>'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token not provided'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, AuthConfig.jwtSecret) as JWTPayload;

    // Get user from database
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (userResult.length === 0) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const user = userResult[0];

    // Attach user to request object
    req.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    };

    next();
    return;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
};

// Middleware to check if user is admin
export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (req.user.role !== 'Admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }

  next();
};

// Generate JWT token
export const generateToken = (payload: { id: number; role: 'User' | 'Admin' }): string => {
  return jwt.sign(payload, AuthConfig.jwtSecret, {
    expiresIn: AuthConfig.jwtExpiresIn,
  } as jwt.SignOptions);
};
