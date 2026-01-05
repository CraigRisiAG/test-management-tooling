/**
 * @module mfa
 * @description Multi-Factor Authentication (MFA) using TOTP
 */

import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { hashToken } from './auth-utils';

const MFA_ISSUER = process.env.MFA_ISSUER || 'TestMgr';
const MFA_BACKUP_CODES_COUNT = 10;
const MFA_CODE_WINDOW = 2; // Allow codes from 2 time steps before/after

/**
 * MFA Secret
 */
export interface MFASecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Generate TOTP secret and QR code
 */
export async function generateMFASecret(email: string): Promise<MFASecret> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${MFA_ISSUER} (${email})`,
    issuer: MFA_ISSUER,
    length: 32,
  });

  // Generate QR code
  const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = generateBackupCodes(MFA_BACKUP_CODES_COUNT);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: MFA_CODE_WINDOW,
  });
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX
    const formatted = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
    codes.push(formatted);
  }

  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => hashToken(code.replace('-', '')));
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const normalized = code.replace('-', '').toUpperCase();
  const hash = hashToken(normalized);
  return hashedCodes.indexOf(hash);
}

/**
 * Generate SMS OTP
 */
export function generateSMSOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate Email OTP
 */
export function generateEmailOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * OTP Storage (for SMS/Email)
 */
interface OTPStorage {
  [key: string]: {
    code: string;
    expiresAt: Date;
    attempts: number;
  };
}

const otpStorage: OTPStorage = {};

/**
 * Store OTP for verification
 */
export function storeOTP(userId: string, code: string, expiryMinutes: number = 10): void {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  otpStorage[userId] = {
    code,
    expiresAt,
    attempts: 0,
  };

  // Auto-cleanup after expiry
  setTimeout(() => {
    delete otpStorage[userId];
  }, expiryMinutes * 60 * 1000);
}

/**
 * Verify stored OTP
 */
export function verifyStoredOTP(userId: string, code: string): boolean {
  const stored = otpStorage[userId];
  
  if (!stored) {
    return false;
  }

  // Check expiry
  if (new Date() > stored.expiresAt) {
    delete otpStorage[userId];
    return false;
  }

  // Check attempts
  stored.attempts++;
  if (stored.attempts > 5) {
    delete otpStorage[userId];
    return false;
  }

  // Verify code
  if (stored.code === code) {
    delete otpStorage[userId];
    return true;
  }

  return false;
}

/**
 * Trusted Device Token
 */
export interface TrustedDeviceToken {
  token: string;
  expiresAt: Date;
}

/**
 * Generate trusted device token (remember device for 30 days)
 */
export function generateTrustedDeviceToken(): TrustedDeviceToken {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return { token, expiresAt };
}

/**
 * MFA Challenge
 */
export interface MFAChallenge {
  challengeId: string;
  userId: string;
  methods: ('totp' | 'sms' | 'email')[];
  expiresAt: Date;
}

/**
 * Create MFA challenge
 */
export function createMFAChallenge(
  userId: string,
  methods: ('totp' | 'sms' | 'email')[]
): MFAChallenge {
  return {
    challengeId: crypto.randomUUID(),
    userId,
    methods,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  };
}
