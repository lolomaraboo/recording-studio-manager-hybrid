/**
 * Two-Factor Authentication (2FA) Module
 *
 * Provides TOTP-based 2FA with:
 * - Secret generation and QR code creation
 * - Token verification
 * - Backup codes generation and validation
 *
 * Uses otplib for TOTP and qrcode for QR generation
 */

import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import crypto from 'crypto';

// Configure TOTP settings
authenticator.options = {
  digits: 6,
  step: 30, // 30 seconds
  window: 1, // Allow 1 step before/after for clock drift
};

/**
 * Generate a new TOTP secret
 */
export function generateSecret(): string {
  return authenticator.generateSecret(20); // 20 bytes = 32 chars base32
}

/**
 * Generate otpauth URI for QR code
 */
export function generateOtpAuthUri(
  email: string,
  secret: string,
  issuer: string = 'RSM Studio'
): string {
  return authenticator.keyuri(email, issuer, secret);
}

/**
 * Generate QR code as data URL (base64 PNG)
 */
export async function generateQRCode(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Verify a TOTP token
 */
export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Generate backup codes (10 codes, 8 chars each)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8 character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

/**
 * Verify a backup code against stored hashes
 * Returns the index of matched code or -1 if not found
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const inputHash = hashBackupCode(code);
  return hashedCodes.findIndex((hash) => hash === inputHash);
}

/**
 * Encrypt secret for database storage
 */
export function encryptSecret(secret: string, encryptionKey?: string): string {
  const key = encryptionKey || process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!key) {
    // If no encryption key, store plaintext (not recommended for production)
    return secret;
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    iv
  );

  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt secret from database
 */
export function decryptSecret(encryptedSecret: string, encryptionKey?: string): string {
  const key = encryptionKey || process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!key) {
    // If no encryption key, assume plaintext
    return encryptedSecret;
  }

  // Check if it's in encrypted format
  if (!encryptedSecret.includes(':')) {
    return encryptedSecret;
  }

  const parts = encryptedSecret.split(':');
  if (parts.length !== 3) {
    return encryptedSecret;
  }
  const [ivHex, authTagHex, encrypted] = parts;
  if (!ivHex || !authTagHex || !encrypted) {
    return encryptedSecret;
  }
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted: string = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Format backup codes for display (add dashes)
 */
export function formatBackupCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Parse user-entered backup code (remove dashes and spaces)
 */
export function parseBackupCode(input: string): string {
  return input.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Check if 2FA is properly configured
 */
export function is2FAConfigured(): boolean {
  // Returns true - 2FA is always available
  // Encryption key is optional but recommended
  return true;
}

/**
 * Setup response for enabling 2FA
 */
export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  otpauthUri: string;
}

/**
 * Generate complete 2FA setup data
 */
export async function generateSetupData(
  email: string,
  issuer?: string
): Promise<TwoFactorSetupResponse> {
  const secret = generateSecret();
  const otpauthUri = generateOtpAuthUri(email, secret, issuer);
  const qrCode = await generateQRCode(otpauthUri);
  const backupCodes = generateBackupCodes(10);

  return {
    secret,
    qrCode,
    backupCodes,
    otpauthUri,
  };
}
