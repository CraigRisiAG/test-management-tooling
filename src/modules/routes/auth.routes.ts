import express from 'express';
import * as AuthUtils from '../auth/auth-utils';
import { UserManager } from '../user-manager';

const router = express.Router();
const userManager = new UserManager();

let initialized = false;
const tokenSessions = new Map<string, string>();

async function ensureInitialized() {
  if (!initialized) {
    await userManager.initialize();
    initialized = true;
  }
}

function getBearerToken(req: express.Request): string | undefined {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return undefined;
}

function getUserIdFromToken(token?: string): string | undefined {
  if (!token) return undefined;
  const payload = AuthUtils.verifyToken(token);
  return payload?.sub;
}

// Register
router.post('/register', async (req, res) => {
  try {
    await ensureInitialized();
    const { email, password, name, role } = req.body || {};
    const user = await userManager.createUser(email, name, role || 'user', password);

    const accessToken = AuthUtils.generateAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: Array.from(user.modulePermissions.entries()).map(([m, r]) => `${m}:${r}`),
    });
    const refreshToken = AuthUtils.generateRefreshToken(user.id);

    const session = await userManager.startSession(user.id);
    tokenSessions.set(accessToken, session.id);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err: any) {
    const message = err.message || 'Registration failed';
    res.status(400).json({ error: message.includes('validation failed') ? 'password requirements not met' : message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    await ensureInitialized();
    const { email, password } = req.body || {};
    const result = await userManager.authenticateUser(email, password);
    if (!result) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = AuthUtils.generateAccessToken({
      sub: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      permissions: Array.from(result.user.modulePermissions.entries()).map(([m, r]) => `${m}:${r}`),
    });
    const refreshToken = AuthUtils.generateRefreshToken(result.user.id);

    const session = await userManager.startSession(result.user.id);
    tokenSessions.set(accessToken, session.id);

    res.json({ user: result.user, accessToken, refreshToken });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Login failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    await ensureInitialized();
    const token = getBearerToken(req);
    const sessionId = token ? tokenSessions.get(token) : undefined;
    if (sessionId) {
      await userManager.endSession(sessionId);
      tokenSessions.delete(token!);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Logout failed' });
  }
});

// Sessions
router.get('/sessions', async (_req, res) => {
  try {
    await ensureInitialized();
    res.json({ sessions: userManager.getActiveSessions() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to get sessions' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    await ensureInitialized();
    const token = getBearerToken(req);
    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const accessToken = AuthUtils.generateAccessToken({
      sub: userId,
      email: '',
      name: '',
      role: 'user',
      permissions: [],
    });
    res.json({ accessToken });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to refresh token' });
  }
});

// Password change
router.post('/password/change', async (req, res) => {
  try {
    await ensureInitialized();
    const token = getBearerToken(req);
    const userId = getUserIdFromToken(token);
    const { currentPassword, newPassword } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await userManager.changePassword(userId, currentPassword, newPassword);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change password' });
  }
});

// Password policy
router.get('/password/policy', (_req, res) => {
  res.json(AuthUtils.DEFAULT_PASSWORD_POLICY);
});

// Password forgot (mock)
router.post('/password/forgot', async (_req, res) => {
  res.json({ success: true });
});

// MFA enable
router.post('/mfa/enable', async (req, res) => {
  try {
    await ensureInitialized();
    const token = getBearerToken(req);
    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await userManager.enableMFA(userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to enable MFA' });
  }
});

// MFA verify
router.post('/mfa/verify', async (req, res) => {
  try {
    await ensureInitialized();
    const token = getBearerToken(req);
    const userId = getUserIdFromToken(token);
    const { code } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const valid = await userManager.verifyMFA(userId, code);
    res.json({ valid });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to verify MFA' });
  }
});

// MFA disable
router.post('/mfa/disable', async (req, res) => {
  try {
    await ensureInitialized();
    const token = getBearerToken(req);
    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await userManager.disableMFA(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to disable MFA' });
  }
});

// Simple in-memory API keys
type ApiKey = { keyId: string; key: string; name?: string; rateLimitPerMinute?: number };
const userKeys = new Map<string, ApiKey[]>();

router.post('/api-keys', async (req, res) => {
  try {
    const token = getBearerToken(req);
    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { name, rateLimitPerMinute } = req.body || {};
    const key: ApiKey = {
      keyId: `KEY-${Date.now()}`,
      key: AuthUtils.generateToken(24),
      name,
      rateLimitPerMinute,
    };
    const list = userKeys.get(userId) || [];
    list.push(key);
    userKeys.set(userId, list);
    res.status(201).json(key);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create API key' });
  }
});

router.get('/api-keys', (req, res) => {
  const token = getBearerToken(req);
  const userId = getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ keys: userKeys.get(userId) || [] });
});

router.delete('/api-keys/:keyId', (req, res) => {
  const token = getBearerToken(req);
  const userId = getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const list = userKeys.get(userId) || [];
  const idx = list.findIndex(k => k.keyId === req.params.keyId);
  if (idx >= 0) list.splice(idx, 1);
  userKeys.set(userId, list);
  res.json({ success: true });
});

router.put('/api-keys/:keyId/rotate', (req, res) => {
  const token = getBearerToken(req);
  const userId = getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const list = userKeys.get(userId) || [];
  const item = list.find(k => k.keyId === req.params.keyId);
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.key = AuthUtils.generateToken(24);
  res.json(item);
});

export default router;