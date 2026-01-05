/**
 * @module oauth
 * @description OAuth 2.0 integration for Google, Microsoft, GitHub, GitLab
 */

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GitLabStrategy } from 'passport-gitlab2';
import type { User } from '../../types';

/**
 * OAuth Provider Configuration
 */
export interface OAuthConfig {
  provider: 'google' | 'microsoft' | 'github' | 'gitlab' | 'okta';
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
}

/**
 * OAuth Profile
 */
export interface OAuthProfile {
  id: string;
  provider: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

/**
 * OAuth Connection
 */
export interface OAuthConnection {
  id: string;
  userId: string;
  provider: string;
  providerId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configure Google OAuth Strategy
 */
export function configureGoogleOAuth(config: OAuthConfig, onAuthenticate: (profile: OAuthProfile) => Promise<User>) {
  return new GoogleStrategy(
    {
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || ['profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        const oauthProfile: OAuthProfile = {
          id: profile.id,
          provider: 'google',
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          avatar: profile.photos?.[0]?.value,
          accessToken,
          refreshToken,
        };

        const user = await onAuthenticate(oauthProfile);
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  );
}

/**
 * Configure Microsoft OAuth Strategy
 */
export function configureMicrosoftOAuth(config: OAuthConfig, onAuthenticate: (profile: OAuthProfile) => Promise<User>) {
  return new MicrosoftStrategy(
    {
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || ['user.read'],
      tenant: 'common',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        const oauthProfile: OAuthProfile = {
          id: profile.id,
          provider: 'microsoft',
          email: profile.emails?.[0]?.value || profile.upn || '',
          name: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          avatar: profile.photos?.[0]?.value,
          accessToken,
          refreshToken,
        };

        const user = await onAuthenticate(oauthProfile);
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  );
}

/**
 * Configure GitHub OAuth Strategy
 */
export function configureGitHubOAuth(config: OAuthConfig, onAuthenticate: (profile: OAuthProfile) => Promise<User>) {
  return new GitHubStrategy(
    {
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || ['user:email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        const oauthProfile: OAuthProfile = {
          id: profile.id,
          provider: 'github',
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || profile.username,
          avatar: profile.photos?.[0]?.value,
          accessToken,
          refreshToken,
        };

        const user = await onAuthenticate(oauthProfile);
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  );
}

/**
 * Configure GitLab OAuth Strategy
 */
export function configureGitLabOAuth(config: OAuthConfig, onAuthenticate: (profile: OAuthProfile) => Promise<User>) {
  return new GitLabStrategy(
    {
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || ['read_user'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        const oauthProfile: OAuthProfile = {
          id: profile.id,
          provider: 'gitlab',
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || profile.username,
          avatar: profile.avatarUrl,
          accessToken,
          refreshToken,
        };

        const user = await onAuthenticate(oauthProfile);
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  );
}

/**
 * OAuth Service for managing connections
 */
export class OAuthService {
  private connections: Map<string, OAuthConnection[]> = new Map();

  /**
   * Save OAuth connection
   */
  async saveConnection(connection: Omit<OAuthConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<OAuthConnection> {
    const newConnection: OAuthConnection = {
      ...connection,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userConnections = this.connections.get(connection.userId) || [];
    userConnections.push(newConnection);
    this.connections.set(connection.userId, userConnections);

    return newConnection;
  }

  /**
   * Get user's OAuth connections
   */
  async getUserConnections(userId: string): Promise<OAuthConnection[]> {
    return this.connections.get(userId) || [];
  }

  /**
   * Get connection by provider
   */
  async getConnectionByProvider(userId: string, provider: string): Promise<OAuthConnection | null> {
    const userConnections = this.connections.get(userId) || [];
    return userConnections.find(conn => conn.provider === provider) || null;
  }

  /**
   * Update OAuth tokens
   */
  async updateTokens(
    userId: string,
    provider: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<void> {
    const userConnections = this.connections.get(userId) || [];
    const connection = userConnections.find(conn => conn.provider === provider);

    if (connection) {
      connection.accessToken = accessToken;
      if (refreshToken) connection.refreshToken = refreshToken;
      if (expiresAt) connection.expiresAt = expiresAt;
      connection.updatedAt = new Date();
    }
  }

  /**
   * Disconnect OAuth provider
   */
  async disconnectProvider(userId: string, provider: string): Promise<boolean> {
    const userConnections = this.connections.get(userId) || [];
    const filtered = userConnections.filter(conn => conn.provider !== provider);

    if (filtered.length < userConnections.length) {
      this.connections.set(userId, filtered);
      return true;
    }

    return false;
  }

  /**
   * Find user by OAuth provider ID
   */
  async findUserByProviderId(provider: string, providerId: string): Promise<string | null> {
    for (const [userId, connections] of this.connections.entries()) {
      const match = connections.find(
        conn => conn.provider === provider && conn.providerId === providerId
      );
      if (match) return userId;
    }
    return null;
  }
}

/**
 * OAuth Token Refresh
 */
export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Refresh OAuth token (generic implementation)
 */
export async function refreshOAuthToken(
  provider: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenRefreshResult | null> {
  const tokenUrls: Record<string, string> = {
    google: 'https://oauth2.googleapis.com/token',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    github: 'https://github.com/login/oauth/access_token',
    gitlab: 'https://gitlab.com/oauth/token',
  };

  const tokenUrl = tokenUrls[provider];
  if (!tokenUrl) return null;

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error(`Failed to refresh ${provider} token:`, error);
    return null;
  }
}

/**
 * Get OAuth authorization URL
 */
export function getAuthorizationURL(config: OAuthConfig): string {
  const authUrls: Record<string, string> = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    github: 'https://github.com/login/oauth/authorize',
    gitlab: 'https://gitlab.com/oauth/authorize',
  };

  const baseUrl = authUrls[config.provider];
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackURL,
    response_type: 'code',
    scope: (config.scope || []).join(' '),
  });

  return `${baseUrl}?${params.toString()}`;
}
