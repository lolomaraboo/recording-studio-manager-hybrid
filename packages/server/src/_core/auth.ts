/**
 * JWT Authentication Module
 *
 * Features:
 * - Access tokens (15 min expiry)
 * - Refresh tokens (7 days expiry, stored in httpOnly cookie)
 * - Password hashing with bcrypt
 * - Token verification middleware
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';

// Environment config with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const BCRYPT_ROUNDS = 12;

/**
 * Token payload type
 */
export interface TokenPayload {
  userId: number;
  email: string;
  role: 'admin' | 'member' | 'client';
  organizationId: number | null;
}

/**
 * Decoded token type (includes JWT standard claims)
 */
export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Auth result returned after successful login
 */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: 'admin' | 'member' | 'client';
    organizationId: number | null;
  };
  expiresIn: number; // seconds
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate access token (short-lived, sent in response body)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate refresh token (long-lived, stored in httpOnly cookie)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verify access token
 * @returns Decoded payload or null if invalid
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Set refresh token as httpOnly cookie
 */
export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/api/trpc/auth.refresh', // Only sent to refresh endpoint
  });
}

/**
 * Clear refresh token cookie
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/trpc/auth.refresh',
  });
}

/**
 * Extract bearer token from Authorization header
 * @returns Token string or null if not present/invalid format
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // Remove "Bearer " prefix
}

/**
 * Get refresh token from cookie
 */
export function getRefreshTokenFromCookie(req: Request): string | null {
  return req.cookies?.refreshToken || null;
}
