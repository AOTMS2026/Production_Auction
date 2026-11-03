import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, type IUser } from '../models/User.model.ts';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
  userDoc?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'auction_super_secret_jwt_key_2026';

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Bearer token missing.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload;
    req.user = decoded;

    const userDoc = await UserModel.findById(decoded.userId);
    if (!userDoc) {
      res.status(401).json({ success: false, message: 'User account no longer exists.' });
      return;
    }
    req.userDoc = userDoc;
    req.user = {
      userId: userDoc._id.toString(),
      email: userDoc.email,
      role: userDoc.role,
      isEmailVerified: userDoc.isEmailVerified,
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload;
    const userDoc = await UserModel.findById(decoded.userId);
    if (userDoc) {
      req.userDoc = userDoc;
      req.user = {
        userId: userDoc._id.toString(),
        email: userDoc.email,
        role: userDoc.role,
        isEmailVerified: userDoc.isEmailVerified,
      };
    } else {
      req.user = decoded;
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
}

export function requireVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userDoc || !req.userDoc.isEmailVerified) {
    res.status(403).json({
      success: false,
      message: 'Email verification required to access this resource.',
      requiresVerification: true,
    });
    return;
  }
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userDoc || req.userDoc.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator authorization required.',
    });
    return;
  }
  next();
}
