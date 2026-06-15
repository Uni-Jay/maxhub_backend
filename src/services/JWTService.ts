import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '@types/express';

export interface JWTPayload {
  id: number;
  uuid: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || 'access-secret-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
    this.accessTokenExpiry = process.env.JWT_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(user: AuthenticatedUser): string {
    const payload = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      algorithm: 'HS256',
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(user: AuthenticatedUser): string {
    const payload = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      algorithm: 'HS256',
    });
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
      }) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ['HS256'],
      }) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  /**
   * Get time until token expiration in seconds
   */
  getTimeUntilExpiry(token: string): number {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return 0;
      return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    } catch (error) {
      return 0;
    }
  }
}

export default new JWTService();
