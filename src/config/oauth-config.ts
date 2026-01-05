/**
 * @file oauth-config.ts
 * @description OAuth configuration for Google, Microsoft, Apple, GitHub, and GitLab
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
}

export interface AppleOAuthConfig extends OAuthConfig {
  teamId: string;
  keyId: string;
  privateKey: string;
}

/**
 * Google OAuth Configuration
 * 
 * Steps to get credentials:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project
 * 3. Enable Google+ API
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add authorized redirect URIs: http://localhost:4001/api/auth/oauth/google/callback
 * 6. Copy Client ID and Client Secret
 */
export const GOOGLE_OAUTH_CONFIG: OAuthConfig = {
  clientId: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.OAUTH_GOOGLE_CALLBACK_URL || 'http://localhost:4001/api/auth/oauth/google/callback',
  scope: ['profile', 'email'],
};

/**
 * Microsoft OAuth Configuration (Azure AD / Microsoft Authenticator)
 * 
 * Steps to get credentials:
 * 1. Go to https://portal.azure.com/
 * 2. Navigate to Azure Active Directory → App registrations
 * 3. Click "New registration"
 * 4. Set name: "TestMgr"
 * 5. Add Web redirect URI: http://localhost:4001/api/auth/oauth/microsoft/callback
 * 6. Under Certificates & secrets, create a new client secret
 * 7. Copy Application (client) ID and client secret value
 * 
 * Scopes:
 * - openid: Get ID token
 * - profile: Get profile info
 * - email: Get email
 * - offline_access: Get refresh token
 */
export const MICROSOFT_OAUTH_CONFIG: OAuthConfig = {
  clientId: process.env.OAUTH_MICROSOFT_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_MICROSOFT_CLIENT_SECRET || '',
  callbackURL: process.env.OAUTH_MICROSOFT_CALLBACK_URL || 'http://localhost:4001/api/auth/oauth/microsoft/callback',
  scope: ['openid', 'profile', 'email', 'offline_access'],
};

/**
 * Apple OAuth Configuration (Sign in with Apple)
 * 
 * Steps to get credentials:
 * 1. Go to https://developer.apple.com/
 * 2. Sign in with Apple Developer account
 * 3. Go to Certificates, Identifiers & Profiles
 * 4. Select "Identifiers"
 * 5. Create new identifier (App ID)
 * 6. Enable "Sign in with Apple"
 * 7. Configure Web Domain: testmgr.example.com
 * 8. Add Redirect URI: https://testmgr.example.com/api/auth/oauth/apple/callback
 * 9. Create a private key for authentication
 * 10. Download the key and get: Team ID, Key ID, Client ID (from App ID)
 * 
 * For local development with certificates:
 * 1. Generate Apple developer certificate (requires team membership)
 * 2. Use certificate to sign requests
 * 3. Apple requires HTTPS even for localhost (use ngrok or similar for testing)
 */
export const APPLE_OAUTH_CONFIG: AppleOAuthConfig = {
  clientId: process.env.OAUTH_APPLE_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_APPLE_CLIENT_SECRET || '',
  callbackURL: process.env.OAUTH_APPLE_CALLBACK_URL || 'https://testmgr.example.com/api/auth/oauth/apple/callback',
  teamId: process.env.OAUTH_APPLE_TEAM_ID || '',
  keyId: process.env.OAUTH_APPLE_KEY_ID || '',
  privateKey: process.env.OAUTH_APPLE_PRIVATE_KEY || '',
  scope: ['email', 'name'],
};

/**
 * GitHub OAuth Configuration
 * 
 * Steps to get credentials:
 * 1. Go to https://github.com/settings/developers
 * 2. Click "New OAuth App"
 * 3. Fill in:
 *    - Application name: TestMgr
 *    - Homepage URL: http://localhost:4001
 *    - Authorization callback URL: http://localhost:4001/api/auth/oauth/github/callback
 * 4. Copy Client ID and Client Secret
 */
export const GITHUB_OAUTH_CONFIG: OAuthConfig = {
  clientId: process.env.OAUTH_GITHUB_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET || '',
  callbackURL: process.env.OAUTH_GITHUB_CALLBACK_URL || 'http://localhost:4001/api/auth/oauth/github/callback',
  scope: ['user:email', 'read:user'],
};

/**
 * GitLab OAuth Configuration
 * 
 * Steps to get credentials:
 * 1. Go to https://gitlab.com/-/profile/applications
 * 2. Click "Add new application"
 * 3. Fill in:
 *    - Name: TestMgr
 *    - Redirect URI: http://localhost:4001/api/auth/oauth/gitlab/callback
 *    - Scopes: read_user, read_repository, write_repository
 * 4. Copy Application ID and Secret
 */
export const GITLAB_OAUTH_CONFIG: OAuthConfig = {
  clientId: process.env.OAUTH_GITLAB_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_GITLAB_CLIENT_SECRET || '',
  callbackURL: process.env.OAUTH_GITLAB_CALLBACK_URL || 'http://localhost:4001/api/auth/oauth/gitlab/callback',
  scope: ['read_user', 'read_repository', 'write_repository'],
};

/**
 * Helper function to validate OAuth configurations
 */
export function validateOAuthConfig(provider: string, config: OAuthConfig): string[] {
  const errors: string[] = [];

  if (!config.clientId) {
    errors.push(`${provider}: Missing clientId`);
  }

  if (!config.clientSecret && provider !== 'apple') {
    errors.push(`${provider}: Missing clientSecret`);
  }

  if (!config.callbackURL) {
    errors.push(`${provider}: Missing callbackURL`);
  }

  return errors;
}

/**
 * Helper function to validate Apple OAuth configuration
 */
export function validateAppleConfig(config: AppleOAuthConfig): string[] {
  const errors = validateOAuthConfig('Apple', config);

  if (!config.teamId) {
    errors.push('Apple: Missing teamId');
  }

  if (!config.keyId) {
    errors.push('Apple: Missing keyId');
  }

  if (!config.privateKey) {
    errors.push('Apple: Missing privateKey');
  }

  return errors;
}

/**
 * Get enabled providers based on configuration
 */
export function getEnabledProviders(): string[] {
  const providers: string[] = [];

  if (GOOGLE_OAUTH_CONFIG.clientId) {
    providers.push('google');
  }

  if (MICROSOFT_OAUTH_CONFIG.clientId) {
    providers.push('microsoft');
  }

  if (APPLE_OAUTH_CONFIG.clientId) {
    providers.push('apple');
  }

  if (GITHUB_OAUTH_CONFIG.clientId) {
    providers.push('github');
  }

  if (GITLAB_OAUTH_CONFIG.clientId) {
    providers.push('gitlab');
  }

  return providers;
}
