import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Client Portal Authentication Utilities
 *
 * Provides secure token generation, password hashing, and validation
 * for the client portal dual-authentication system (Magic Link + Email/Password)
 */

/**
 * Generate a secure random token (256-bit)
 * Used for magic links, sessions, and password reset tokens
 *
 * @returns {string} 64-character hexadecimal string
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a password using bcrypt
 * Uses cost factor of 10 (same as admin auth for consistency)
 *
 * @param password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password
 * @param hash - Bcrypt hash
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate magic link expiration timestamp
 * Magic links expire after 24 hours for security
 *
 * @returns {Date} Expiration timestamp (now + 24 hours)
 */
export function getMagicLinkExpiration(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now;
}

/**
 * Generate session expiration timestamp
 * Sessions expire after 7 days
 *
 * @returns {Date} Expiration timestamp (now + 7 days)
 */
export function getSessionExpiration(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now;
}

/**
 * Generate password reset token expiration timestamp
 * Reset tokens expire after 1 hour for security
 *
 * @returns {Date} Expiration timestamp (now + 1 hour)
 */
export function getPasswordResetExpiration(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now;
}

/**
 * Check if a token has expired
 *
 * @param expiresAt - Expiration timestamp
 * @returns {boolean} True if token has expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 *
 * @param password - Plain text password
 * @returns {object} Validation result with isValid and errors array
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extract device information from User-Agent string
 * Used for session tracking and security
 *
 * @param userAgent - HTTP User-Agent header
 * @returns {object} Device information
 */
export function parseUserAgent(userAgent: string | undefined): {
  deviceType: string;
  browser: string;
  os: string;
} {
  const ua = userAgent || "";

  // Detect device type
  let deviceType = "desktop";
  if (/mobile/i.test(ua)) {
    deviceType = "mobile";
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = "tablet";
  }

  // Detect browser
  let browser = "Unknown";
  if (/chrome|chromium|crios/i.test(ua) && !/edg/i.test(ua)) {
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
  } else if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/opr\//i.test(ua)) {
    browser = "Opera";
  }

  // Detect OS
  let os = "Unknown";
  if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/mac/i.test(ua)) {
    os = "macOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  } else if (/android/i.test(ua)) {
    os = "Android";
  } else if (/ios|iphone|ipad/i.test(ua)) {
    os = "iOS";
  }

  return {
    deviceType,
    browser,
    os,
  };
}

/**
 * Sanitize email address
 * Trim whitespace and convert to lowercase
 *
 * @param email - Email address
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Generate a magic link URL
 *
 * @param token - Magic link token
 * @param purpose - "login" | "email_verification" | "password_reset"
 * @param baseUrl - Client portal base URL (e.g., "https://portal.studio.com")
 * @returns {string} Complete magic link URL
 */
export function generateMagicLinkUrl(
  token: string,
  purpose: "login" | "email_verification" | "password_reset",
  baseUrl: string
): string {
  const purposeMap = {
    login: "/auth/magic-link",
    email_verification: "/auth/verify-email",
    password_reset: "/auth/reset-password",
  };

  const path = purposeMap[purpose];
  return `${baseUrl}${path}?token=${token}`;
}

/**
 * Rate limiting helper
 * Check if an action should be rate limited based on timestamp
 *
 * @param lastAttemptAt - Timestamp of last attempt
 * @param cooldownMinutes - Cooldown period in minutes
 * @returns {object} Rate limit status
 */
export function checkRateLimit(
  lastAttemptAt: Date | null,
  cooldownMinutes: number
): {
  isLimited: boolean;
  remainingSeconds: number;
} {
  if (!lastAttemptAt) {
    return { isLimited: false, remainingSeconds: 0 };
  }

  const now = new Date();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const lastAttemptMs = new Date(lastAttemptAt).getTime();
  const elapsedMs = now.getTime() - lastAttemptMs;

  if (elapsedMs < cooldownMs) {
    const remainingMs = cooldownMs - elapsedMs;
    return {
      isLimited: true,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    };
  }

  return { isLimited: false, remainingSeconds: 0 };
}
