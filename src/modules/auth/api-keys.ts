/**
 * @module api-keys
 * @description API Key management for programmatic access
 */

import * as crypto from 'crypto';
import { hashToken } from './auth-utils';

/**
 * API Key
 */
export interface APIKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string;         // Hashed key (not stored in plaintext)
  keyPrefix: string;       // First 8 chars for identification
  scopes: string[];        // Permissions
  rateLimit: number;       // Requests per hour
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  active: boolean;
}

/**
 * API Key with plaintext key (only returned on creation)
 */
export interface APIKeyWithSecret extends APIKey {
  key: string;             // Full key (only shown once)
}

/**
 * API Key Scopes
 */
export const API_KEY_SCOPES = {
  // Boards
  'boards:read': 'Read agile boards',
  'boards:write': 'Create and update boards',
  'boards:delete': 'Delete boards',

  // Stories
  'stories:read': 'Read stories',
  'stories:write': 'Create and update stories',
  'stories:delete': 'Delete stories',

  // Tests
  'tests:read': 'Read tests',
  'tests:write': 'Create and update tests',
  'tests:execute': 'Execute tests',
  'tests:delete': 'Delete tests',

  // Defects
  'defects:read': 'Read defects',
  'defects:write': 'Create and update defects',
  'defects:delete': 'Delete defects',

  // Reports
  'reports:read': 'Read reports and metrics',

  // Code
  'code:read': 'Read code and traces',
  'code:write': 'Update code traces',

  // Pipelines
  'pipelines:read': 'Read pipeline status',
  'pipelines:trigger': 'Trigger pipeline execution',

  // Admin
  'admin:users': 'Manage users',
  'admin:settings': 'Manage system settings',
};

/**
 * API Key Service
 */
export class APIKeyService {
  private keys: Map<string, APIKey> = new Map();
  private usage: Map<string, { count: number; resetAt: Date }> = new Map();

  /**
   * Generate a new API key
   */
  async generateKey(
    userId: string,
    name: string,
    scopes: string[],
    options?: {
      rateLimit?: number;
      expiresInDays?: number;
    }
  ): Promise<APIKeyWithSecret> {
    // Generate random key (64 characters)
    const key = this.generateRandomKey();
    const keyHash = hashToken(key);
    const keyPrefix = key.substring(0, 8);

    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      userId,
      name,
      keyHash,
      keyPrefix,
      scopes,
      rateLimit: options?.rateLimit || 1000,
      createdAt: new Date(),
      expiresAt: options?.expiresInDays
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      active: true,
    };

    this.keys.set(keyHash, apiKey);

    return {
      ...apiKey,
      key, // Include full key (only returned once)
    };
  }

  /**
   * Generate random API key
   */
  private generateRandomKey(): string {
    // Format: testmgr_<32 random chars>
    const randomPart = crypto.randomBytes(32).toString('base64url');
    return `testmgr_${randomPart}`;
  }

  /**
   * Validate API key
   */
  async validateKey(key: string): Promise<APIKey | null> {
    const keyHash = hashToken(key);
    const apiKey = this.keys.get(keyHash);

    if (!apiKey) {
      return null;
    }

    // Check if active
    if (!apiKey.active) {
      return null;
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      apiKey.active = false;
      return null;
    }

    // Check rate limit
    if (!(await this.checkRateLimit(keyHash, apiKey.rateLimit))) {
      return null;
    }

    // Update last used
    apiKey.lastUsedAt = new Date();

    return apiKey;
  }

  /**
   * Check rate limit
   */
  private async checkRateLimit(keyHash: string, limit: number): Promise<boolean> {
    const now = new Date();
    const usage = this.usage.get(keyHash);

    // Initialize or reset usage
    if (!usage || now > usage.resetAt) {
      this.usage.set(keyHash, {
        count: 1,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      });
      return true;
    }

    // Increment usage
    usage.count++;

    // Check if over limit
    if (usage.count > limit) {
      return false;
    }

    return true;
  }

  /**
   * Get user's API keys
   */
  async getUserKeys(userId: string): Promise<APIKey[]> {
    return Array.from(this.keys.values()).filter(key => key.userId === userId);
  }

  /**
   * Get API key by ID
   */
  async getKeyById(keyId: string): Promise<APIKey | null> {
    return Array.from(this.keys.values()).find(key => key.id === keyId) || null;
  }

  /**
   * Revoke API key
   */
  async revokeKey(keyId: string): Promise<boolean> {
    const key = await this.getKeyById(keyId);
    if (key) {
      key.active = false;
      return true;
    }
    return false;
  }

  /**
   * Delete API key
   */
  async deleteKey(keyId: string): Promise<boolean> {
    const key = await this.getKeyById(keyId);
    if (key) {
      this.keys.delete(key.keyHash);
      this.usage.delete(key.keyHash);
      return true;
    }
    return false;
  }

  /**
   * Rotate API key (generate new key, deprecate old one)
   */
  async rotateKey(keyId: string, gracePeriodDays: number = 7): Promise<APIKeyWithSecret | null> {
    const oldKey = await this.getKeyById(keyId);
    if (!oldKey) {
      return null;
    }

    // Generate new key with same settings
    const newKey = await this.generateKey(
      oldKey.userId,
      oldKey.name,
      oldKey.scopes,
      {
        rateLimit: oldKey.rateLimit,
        expiresInDays: oldKey.expiresAt
          ? Math.ceil((oldKey.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          : undefined,
      }
    );

    // Set expiration on old key (grace period)
    oldKey.expiresAt = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);

    return newKey;
  }

  /**
   * Update API key
   */
  async updateKey(
    keyId: string,
    updates: {
      name?: string;
      scopes?: string[];
      rateLimit?: number;
      active?: boolean;
    }
  ): Promise<APIKey | null> {
    const key = await this.getKeyById(keyId);
    if (!key) {
      return null;
    }

    if (updates.name !== undefined) key.name = updates.name;
    if (updates.scopes !== undefined) key.scopes = updates.scopes;
    if (updates.rateLimit !== undefined) key.rateLimit = updates.rateLimit;
    if (updates.active !== undefined) key.active = updates.active;

    return key;
  }

  /**
   * Check if key has scope
   */
  hasScope(key: APIKey, requiredScope: string): boolean {
    // Check for wildcard
    if (key.scopes.includes('*')) {
      return true;
    }

    // Check exact match
    if (key.scopes.includes(requiredScope)) {
      return true;
    }

    // Check resource wildcard (e.g., "boards:*" matches "boards:read")
    const [resource] = requiredScope.split(':');
    if (key.scopes.includes(`${resource}:*`)) {
      return true;
    }

    return false;
  }

  /**
   * Get remaining rate limit
   */
  getRemainingRateLimit(keyHash: string, limit: number): {
    remaining: number;
    resetAt: Date;
  } {
    const usage = this.usage.get(keyHash);

    if (!usage) {
      return {
        remaining: limit,
        resetAt: new Date(Date.now() + 60 * 60 * 1000),
      };
    }

    return {
      remaining: Math.max(0, limit - usage.count),
      resetAt: usage.resetAt,
    };
  }

  /**
   * Get API key usage statistics
   */
  async getKeyStats(keyId: string): Promise<{
    totalRequests: number;
    requestsThisHour: number;
    rateLimit: number;
    remaining: number;
    lastUsed?: Date;
  } | null> {
    const key = await this.getKeyById(keyId);
    if (!key) {
      return null;
    }

    const usage = this.usage.get(key.keyHash);
    const requestsThisHour = usage?.count || 0;

    return {
      totalRequests: 0, // Would track in persistent storage
      requestsThisHour,
      rateLimit: key.rateLimit,
      remaining: key.rateLimit - requestsThisHour,
      lastUsed: key.lastUsedAt,
    };
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const now = new Date();
    let count = 0;

    for (const [keyHash, key] of this.keys.entries()) {
      if (key.expiresAt && now > key.expiresAt) {
        this.keys.delete(keyHash);
        this.usage.delete(keyHash);
        count++;
      }
    }

    return count;
  }

  /**
   * Validate scopes
   */
  validateScopes(scopes: string[]): { valid: boolean; invalidScopes: string[] } {
    const invalidScopes: string[] = [];
    const validScopes = Object.keys(API_KEY_SCOPES);

    for (const scope of scopes) {
      if (scope !== '*' && !validScopes.includes(scope) && !scope.endsWith(':*')) {
        invalidScopes.push(scope);
      }
    }

    return {
      valid: invalidScopes.length === 0,
      invalidScopes,
    };
  }
}

/**
 * Extract API key from request header
 */
export function extractAPIKey(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer" and "ApiKey" schemes
  const match = authHeader.match(/^(Bearer|ApiKey) (.+)$/i);
  if (!match) {
    return null;
  }

  const key = match[2];

  // Validate format
  if (!key.startsWith('testmgr_')) {
    return null;
  }

  return key;
}
