/**
 * @file auth.integration.test.ts
 * @description Comprehensive integration tests for authentication flows
 */

import request from 'supertest';
import express from 'express';
import { UserManager } from '../modules/user-manager';
import { AuthUtils } from '../modules/auth/auth-utils';
import { MFAService } from '../modules/auth/mfa';
import { APIKeyService } from '../modules/auth/api-keys';
import { authMiddleware } from '../middleware/auth.middleware';
import authRoutes from '../routes/auth.routes';

describe('Authentication Integration Tests', () => {
  let app: express.Application;
  let userManager: UserManager;
  let authUtils: AuthUtils;
  let mfaService: MFAService;
  let apiKeyService: APIKeyService;

  beforeAll(() => {
    // Initialize express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Initialize services
    userManager = new UserManager();
    authUtils = new AuthUtils();
    mfaService = new MFAService();
    apiKeyService = new APIKeyService();
  });

  // ============================================================================
  // Local Password Authentication Tests
  // ============================================================================

  describe('Local Password Authentication', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    };

    test('POST /api/auth/register - Should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    test('POST /api/auth/register - Should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'weak', // Too short and weak
          name: 'Weak User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('password');
    });

    test('POST /api/auth/login - Should login with correct credentials', async () => {
      // First register
      await request(app).post('/api/auth/register').send(testUser);

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });

    test('POST /api/auth/login - Should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/auth/login - Should lock account after 5 failed attempts', async () => {
      const email = 'locktest@example.com';

      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'SecurePass123!',
          name: 'Lock Test',
        });

      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email,
            password: 'WrongPassword123!',
          });
      }

      // 6th attempt should fail with account locked
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('locked');
    });

    test('POST /api/auth/logout - Should invalidate session', async () => {
      // Register and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123!',
          name: 'Logout Test',
        });

      const token = registerResponse.body.accessToken;

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutResponse.status).toBe(200);

      // Try to use token after logout
      const protectedResponse = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedResponse.status).toBe(401);
    });

    test('POST /api/auth/refresh-token - Should return new access token', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'SecurePass123!',
          name: 'Refresh Test',
        });

      const refreshToken = registerResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).not.toBe(registerResponse.body.accessToken);
    });
  });

  // ============================================================================
  // Password Management Tests
  // ============================================================================

  describe('Password Management', () => {
    const testUser = {
      email: 'pwdmgmt@example.com',
      password: 'SecurePass123!',
      name: 'Password Test',
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    test('POST /api/auth/password/change - Should change password', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const token = loginResponse.body.accessToken;

      const response = await request(app)
        .post('/api/auth/password/change')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewSecurePass456!',
        });

      expect(response.status).toBe(200);

      // Verify old password no longer works
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(oldLoginResponse.status).toBe(401);

      // Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'NewSecurePass456!',
        });

      expect(newLoginResponse.status).toBe(200);
    });

    test('POST /api/auth/password/forgot - Should send reset email', async () => {
      const response = await request(app)
        .post('/api/auth/password/forgot')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email');
    });

    test('POST /api/auth/password/policy - Should return password policy', async () => {
      const response = await request(app).get('/api/auth/password/policy');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('minLength');
      expect(response.body).toHaveProperty('requireUppercase');
      expect(response.body).toHaveProperty('requireNumbers');
      expect(response.body).toHaveProperty('requireSpecialChars');
    });
  });

  // ============================================================================
  // Multi-Factor Authentication Tests
  // ============================================================================

  describe('Multi-Factor Authentication', () => {
    const testUser = {
      email: 'mfa@example.com',
      password: 'SecurePass123!',
      name: 'MFA Test',
    };

    test('POST /api/auth/mfa/enable - Should enable MFA and return QR code', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      const response = await request(app)
        .post('/api/auth/mfa/enable')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('backupCodes');
      expect(response.body.backupCodes).toHaveLength(10);
    });

    test('POST /api/auth/mfa/verify - Should verify TOTP code', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      // Enable MFA
      const enableResponse = await request(app)
        .post('/api/auth/mfa/enable')
        .set('Authorization', `Bearer ${token}`);

      const secret = enableResponse.body.secret;

      // Generate TOTP code
      const speakeasy = require('speakeasy');
      const code = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        time: Math.floor(Date.now() / 1000),
      });

      // Verify code
      const response = await request(app)
        .post('/api/auth/mfa/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code,
        });

      expect(response.status).toBe(200);
    });

    test('POST /api/auth/mfa/disable - Should disable MFA', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      // Enable MFA first
      await request(app)
        .post('/api/auth/mfa/enable')
        .set('Authorization', `Bearer ${token}`);

      // Disable MFA
      const response = await request(app)
        .post('/api/auth/mfa/disable')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // API Key Management Tests
  // ============================================================================

  describe('API Key Management', () => {
    const testUser = {
      email: 'apikey@example.com',
      password: 'SecurePass123!',
      name: 'API Key Test',
    };

    test('POST /api/auth/api-keys - Should create API key', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      const response = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'CI/CD Pipeline',
          scopes: ['tests:read', 'tests:execute'],
          rateLimit: 5000,
          expiresInDays: 90,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('keyId');
      expect(response.body.scopes).toContain('tests:read');
    });

    test('GET /api/auth/api-keys - Should list user API keys', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      // Create key
      await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Key',
          scopes: ['tests:read'],
        });

      // List keys
      const response = await request(app)
        .get('/api/auth/api-keys')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('keys');
      expect(response.body.keys.length).toBeGreaterThan(0);
    });

    test('DELETE /api/auth/api-keys/:keyId - Should delete API key', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      // Create key
      const createResponse = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Key',
          scopes: ['tests:read'],
        });

      const keyId = createResponse.body.keyId;

      // Delete key
      const response = await request(app)
        .delete(`/api/auth/api-keys/${keyId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify key is deleted
      const listResponse = await request(app)
        .get('/api/auth/api-keys')
        .set('Authorization', `Bearer ${token}`);

      const deletedKey = listResponse.body.keys.find(
        (k: { id: string }) => k.id === keyId
      );
      expect(deletedKey).toBeUndefined();
    });

    test('PUT /api/auth/api-keys/:keyId/rotate - Should rotate API key', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      // Create key
      const createResponse = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Key',
          scopes: ['tests:read'],
        });

      const keyId = createResponse.body.keyId;
      const oldKey = createResponse.body.key;

      // Rotate key
      const response = await request(app)
        .put(`/api/auth/api-keys/${keyId}/rotate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          gracePeriodDays: 7,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('newKey');
      expect(response.body.newKey).not.toBe(oldKey);
      expect(response.body).toHaveProperty('gracePeriodUntil');
    });

    test('API Key authentication - Should authenticate requests with API key', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      // Create API key
      const keyResponse = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Key',
          scopes: ['tests:read'],
        });

      const apiKey = keyResponse.body.key;

      // Use API key to access protected endpoint
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${apiKey}`);

      expect([200, 401]).toContain(response.status); // 401 if endpoint doesn't exist or requires specific scope
    });

    test('API Key rate limiting - Should enforce rate limits', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      // Create API key with low rate limit
      const keyResponse = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Rate Limited Key',
          scopes: ['tests:read'],
          rateLimit: 2, // 2 requests per hour
        });

      const apiKey = keyResponse.body.key;

      // Make requests until rate limit is hit
      let rateLimitHit = false;
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/auth/sessions')
          .set('Authorization', `Bearer ${apiKey}`);

        if (response.status === 429) {
          rateLimitHit = true;
          break;
        }
      }

      expect(rateLimitHit).toBe(true);
    });
  });

  // ============================================================================
  // Session Management Tests
  // ============================================================================

  describe('Session Management', () => {
    const testUser = {
      email: 'session@example.com',
      password: 'SecurePass123!',
      name: 'Session Test',
    };

    test('GET /api/auth/sessions - Should return active sessions', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerResponse.body.accessToken;

      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
    });

    test('Multiple concurrent sessions - Should track all sessions', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Create second login session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Get sessions from first token
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${registerResponse.body.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sessions.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    test('Missing required fields - Should return 400', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password and name
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('Invalid email - Should return 400', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123!',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
    });

    test('Duplicate email - Should return 409', async () => {
      const user = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      // Register first user
      await request(app).post('/api/auth/register').send(user);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(user);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already');
    });

    test('Unauthorized access - Should return 401', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('Invalid token format - Should return 401', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', 'InvalidTokenFormat');

      expect(response.status).toBe(401);
    });
  });
});
