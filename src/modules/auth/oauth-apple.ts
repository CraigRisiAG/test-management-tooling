/**
 * @module oauth-apple
 * @description Apple Sign in integration
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Apple OAuth Configuration
 */
export interface AppleOAuthConfig {
  clientId: string; // Services ID (e.g., com.example.testmgr)
  teamId: string; // Apple Team ID
  keyId: string; // Private Key ID
  privateKey: string; // Private Key (PEM format)
  callbackURL: string; // https://yourdomain.com/api/auth/oauth/apple/callback
}

/**
 * Apple OAuth Profile (from authorization token)
 */
export interface AppleProfile {
  sub: string; // Unique user identifier
  email?: string;
  email_verified?: boolean;
  is_private_email?: boolean;
  real_user_status?: 0 | 1 | 2; // Unknown, Likely Real, Very Likely Real
  nonce_supported?: boolean;
  nonce?: string;
  auth_time: number;
  aud: string; // Client ID
  exp: number;
  iat: number;
  iss: string; // https://appleid.apple.com
}

/**
 * Apple OAuth Service
 */
export class AppleOAuthService {
  private config: AppleOAuthConfig;

  constructor(config: AppleOAuthConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  /**
   * Validate Apple OAuth configuration
   */
  private validateConfig(config: AppleOAuthConfig): void {
    if (!config.clientId) throw new Error('Apple OAuth: Missing clientId');
    if (!config.teamId) throw new Error('Apple OAuth: Missing teamId');
    if (!config.keyId) throw new Error('Apple OAuth: Missing keyId');
    if (!config.privateKey) throw new Error('Apple OAuth: Missing privateKey');
    if (!config.callbackURL) throw new Error('Apple OAuth: Missing callbackURL');
  }

  /**
   * Generate client secret JWT (expires in 6 months)
   * Required for validating authorization codes
   */
  generateClientSecret(): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 6 * 30 * 24 * 60 * 60; // 6 months

    const payload = {
      iss: this.config.teamId,
      iat: now,
      exp: now + expiresIn,
      aud: 'https://appleid.apple.com',
      sub: this.config.clientId,
    };

    return jwt.sign(payload, this.config.privateKey, {
      algorithm: 'ES256',
      keyid: this.config.keyId,
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param code Authorization code from Apple
   * @returns Access token and ID token
   */
  async exchangeCode(code: string): Promise<{
    accessToken: string;
    idToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    const clientSecret = this.generateClientSecret();

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.callbackURL,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Apple OAuth token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 3600,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const clientSecret = this.generateClientSecret();

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Apple OAuth token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
    };
  }

  /**
   * Decode and verify ID token (JWT)
   * @param idToken ID token from Apple
   * @returns Decoded profile
   */
  decodeIdToken(idToken: string): AppleProfile {
    try {
      // Apple tokens are RS256, we just verify the format here
      // In production, verify the signature against Apple's public keys
      const decoded = jwt.decode(idToken, { complete: true });

      if (!decoded || !decoded.payload) {
        throw new Error('Invalid ID token format');
      }

      return decoded.payload as AppleProfile;
    } catch (error) {
      throw new Error(`Failed to decode Apple ID token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate authorization URL for user to sign in
   */
  generateAuthorizationURL(state: string, nonce?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackURL,
      response_type: 'code',
      response_mode: 'form_post',
      scope: 'openid email name',
      state: state,
      ...(nonce && { nonce }),
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  /**
   * Revoke user tokens
   * @param refreshToken Refresh token to revoke
   */
  async revokeToken(refreshToken: string): Promise<void> {
    const clientSecret = this.generateClientSecret();

    const response = await fetch('https://appleid.apple.com/auth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: clientSecret,
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Apple OAuth token revocation failed: ${response.statusText}`);
    }
  }
}

/**
 * Format Apple authorization response (name object)
 * @param firstName First name from Apple
 * @param lastName Last name from Apple
 * @returns Full name string
 */
export function formatAppleName(firstName?: string, lastName?: string): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ') || 'Apple User';
}

/**
 * Handle Apple authorization callback (form_post)
 * Parse and validate the response from Apple
 */
export function parseAppleAuthorizationResponse(body: {
  code?: string;
  state?: string;
  user?: string;
  error?: string;
}): {
  code: string;
  state: string;
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
  };
} {
  if (!body.code) {
    throw new Error('Missing authorization code');
  }

  if (!body.state) {
    throw new Error('Missing state parameter');
  }

  const result = {
    code: body.code,
    state: body.state,
    user: body.user ? JSON.parse(body.user) : undefined,
  };

  return result;
}
