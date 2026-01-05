import {
  User,
  UserSession,
  UserAuditLog,
  UserFilter,
  UserMetrics,
  ModuleName,
  UserRole,
} from '../types';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as AuthUtils from './auth/auth-utils';
import * as MFA from './auth/mfa';
import { OAuthProfile } from './auth/oauth';
import { SAMLProfile } from './auth/saml';
import { LDAPUser } from './auth/ldap';

/**
 * User Administration Manager
 * Handles user creation, role assignment, and access control
 */
export class UserManager {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private auditLog: UserAuditLog[] = [];
  private logger: Logger;
  private dataDir: string;
  private usersFile: string;
  private sessionsFile: string;
  private auditFile: string;
  private currentUser?: User;

  constructor(dataDir: string = './test-data') {
    this.logger = new Logger();
    this.dataDir = dataDir;
    this.usersFile = path.join(dataDir, 'users.json');
    this.sessionsFile = path.join(dataDir, 'user-sessions.json');
    this.auditFile = path.join(dataDir, 'user-audit.json');
  }

  /**
   * Initialize user manager and load existing users
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadUsers();
      await this.loadSessions();
      await this.loadAuditLog();
      Logger.info('User manager initialized');
    } catch (error) {
      Logger.error('Failed to initialize user manager');
      throw error;
    }
  }

  /**
   * Load users from file
   */
  private async loadUsers(): Promise<void> {
    try {
      if (await this.fileExists(this.usersFile)) {
        const data = await fs.readFile(this.usersFile, 'utf-8');
        const users: User[] = JSON.parse(data);
        users.forEach((user) => {
          user.createdDate = new Date(user.createdDate);
          user.lastLogin = user.lastLogin ? new Date(user.lastLogin) : undefined;
          user.lastModified = new Date(user.lastModified);
          user.modulePermissions = new Map(Object.entries(user.modulePermissions as any) as Array<[ModuleName, UserRole]>);
          this.users.set(user.id, user);
        });
      }
    } catch (error) {
      Logger.error('Failed to load users, starting fresh');
    }
  }

  /**
   * Load sessions from file
   */
  private async loadSessions(): Promise<void> {
    try {
      if (await this.fileExists(this.sessionsFile)) {
        const data = await fs.readFile(this.sessionsFile, 'utf-8');
        const sessions: UserSession[] = JSON.parse(data);
        sessions.forEach((session) => {
          session.loginTime = new Date(session.loginTime);
          session.lastActivityTime = new Date(session.lastActivityTime);
          session.logoutTime = session.logoutTime ? new Date(session.logoutTime) : undefined;
          this.sessions.set(session.id, session);
        });
      }
    } catch (error) {
      Logger.error('Failed to load sessions, starting fresh');
    }
  }

  /**
   * Load audit log from file
   */
  private async loadAuditLog(): Promise<void> {
    try {
      if (await this.fileExists(this.auditFile)) {
        const data = await fs.readFile(this.auditFile, 'utf-8');
        const logs: UserAuditLog[] = JSON.parse(data);
        logs.forEach((log) => {
          log.timestamp = new Date(log.timestamp);
        });
        this.auditLog = logs;
      }
    } catch (error) {
      Logger.error('Failed to load audit log, starting fresh');
    }
  }

  /**
   * Create a new user
   */
  async createUser(
    email: string,
    name: string,
    role: 'admin' | 'user' = 'user',
    password?: string
  ): Promise<User> {
    if (this.users.has(email)) {
      throw new Error(`User with email ${email} already exists`);
    }

    const newUser: User = {
      id: `USER-${Date.now()}`,
      email,
      name,
      status: 'active',
      role,
      modulePermissions: new Map(),
      authProvider: password ? 'local' : 'oauth',
      emailVerified: false,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      createdDate: new Date(),
      lastModified: new Date(),
      modifiedBy: this.currentUser?.email || 'system',
    };

    // Hash password if provided
    if (password) {
      // Validate password
      const validation = AuthUtils.validatePassword(password, undefined, { email, name });
      if (!validation.valid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }
      newUser.passwordHash = await AuthUtils.hashPassword(password);
      newUser.passwordChangedAt = new Date();
      newUser.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    }

    // Set default module permissions based on role
    if (role === 'admin') {
      const modules: ModuleName[] = [
        'test-registry',
        'test-executor',
        'code-tracer',
        'issue-manager',
        'defect-manager',
        'dashboard-reporter',
        'agile',
        'gitops',
        'user-admin',
      ];
      modules.forEach((mod) => newUser.modulePermissions.set(mod, 'admin'));
    } else {
      // Regular users get read/user access by default
      const modules: ModuleName[] = [
        'test-registry',
        'test-executor',
        'code-tracer',
        'issue-manager',
        'defect-manager',
        'dashboard-reporter',
        'agile',
      ];
      modules.forEach((mod) => newUser.modulePermissions.set(mod, 'user'));
      newUser.modulePermissions.set('user-admin', 'read'); // Can only read user admin
    }

    this.users.set(newUser.id, newUser);
    await this.saveUsers();
    this.logAudit(newUser.id, 'user.created', 'user-admin', newUser.id, { email, name, role });

    return newUser;
  }

  /**
   * Get user by ID or email
   */
  getUser(idOrEmail: string): User | undefined {
    // Try by ID first
    if (this.users.has(idOrEmail)) {
      return this.users.get(idOrEmail);
    }

    // Try by email
    for (const user of this.users.values()) {
      if (user.email === idOrEmail) {
        return user;
      }
    }

    return undefined;
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Filter users by criteria
   */
  filterUsers(filter: UserFilter): User[] {
    return Array.from(this.users.values()).filter((user) => {
      if (filter.status && !filter.status.includes(user.status)) return false;
      if (filter.role && !filter.role.includes(user.role)) return false;

      if (filter.moduleName) {
        const userRole = user.modulePermissions.get(filter.moduleName);
        if (filter.moduleRole && userRole !== filter.moduleRole) return false;
        if (!userRole) return false;
      }

      return true;
    });
  }

  /**
   * Assign a role to user for a specific module
   */
  async assignModuleRole(
    userId: string,
    moduleName: ModuleName,
    role: UserRole
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);

    user.modulePermissions.set(moduleName, role);
    user.lastModified = new Date();
    user.modifiedBy = this.currentUser?.email || 'system';

    await this.saveUsers();
    this.logAudit(userId, 'role.assigned', 'user-admin', userId, { moduleName, role });
  }

  /**
   * Get user's role for a module
   */
  getModuleRole(userId: string, moduleName: ModuleName): UserRole | undefined {
    const user = this.users.get(userId);
    return user?.modulePermissions.get(moduleName);
  }

  /**
   * Check if user has permission for action
   */
  hasPermission(userId: string, moduleName: ModuleName, action: 'read' | 'write' | 'delete' | 'manage'): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    if (user.status !== 'active') return false;

    const role = user.modulePermissions.get(moduleName);
    if (!role) return false;

    // Role permissions
    if (role === 'read') return action === 'read';
    if (role === 'user') return action === 'read' || action === 'write';
    if (role === 'admin') return true;

    return false;
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: User['status']): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);

    const oldStatus = user.status;
    user.status = status;
    user.lastModified = new Date();
    user.modifiedBy = this.currentUser?.email || 'system';

    await this.saveUsers();
    this.logAudit(userId, 'status.changed', 'user-admin', userId, { oldStatus, newStatus: status });
  }

  /**
   * Start a user session (login)
   */
  async startSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserSession> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    if (user.status !== 'active') throw new Error(`User ${user.email} is ${user.status}`);

    const session: UserSession = {
      id: `SESSION-${Date.now()}`,
      userId,
      email: user.email,
      loginTime: new Date(),
      lastActivityTime: new Date(),
      ipAddress,
      userAgent,
      active: true,
    };

    this.sessions.set(session.id, session);
    this.currentUser = user;
    user.lastLogin = new Date();

    await this.saveSessions();
    await this.saveUsers();
    this.logAudit(userId, 'login', 'user-admin', session.id, { ipAddress });

    return session;
  }

  /**
   * End a user session (logout)
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.active = false;
    session.logoutTime = new Date();

    if (this.currentUser?.id === session.userId) {
      this.currentUser = undefined;
    }

    await this.saveSessions();
    this.logAudit(session.userId, 'logout', 'user-admin', sessionId);
  }

  /**
   * Update activity timestamp for session
   */
  async updateActivity(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityTime = new Date();
      await this.saveSessions();
    }
  }

  /**
   * Get active sessions for user
   */
  getUserSessions(userId: string): UserSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId && s.active);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.active);
  }

  /**
   * Log an audit event
   */
  private logAudit(
    userId: string,
    action: string,
    moduleName: ModuleName,
    resourceId?: string,
    details?: Record<string, unknown>
  ): void {
    const entry: UserAuditLog = {
      id: `AUDIT-${Date.now()}`,
      userId,
      action,
      moduleName,
      resourceId,
      timestamp: new Date(),
      details,
    };

    this.auditLog.push(entry);

    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }

    this.saveAuditLog().catch((error) => Logger.error('Failed to save audit log'));
  }

  /**
   * Get audit log entries
   */
  getAuditLog(userId?: string, limit: number = 100): UserAuditLog[] {
    let logs = this.auditLog;

    if (userId) {
      logs = logs.filter((log) => log.userId === userId);
    }

    return logs.slice(-limit).reverse();
  }

  /**
   * Get user metrics
   */
  getMetrics(): UserMetrics {
    const allUsers = this.getAllUsers();
    const activeUsers = allUsers.filter((u) => u.status === 'active');
    const inactiveUsers = allUsers.filter((u) => u.status === 'inactive');
    const suspendedUsers = allUsers.filter((u) => u.status === 'suspended');
    const adminUsers = allUsers.filter((u) => u.role === 'admin');

    const moduleAccessBreakdown: Record<string, Record<UserRole, number>> = {};
    const modules: ModuleName[] = [
      'test-registry',
      'test-executor',
      'code-tracer',
      'issue-manager',
      'defect-manager',
      'dashboard-reporter',
      'agile',
      'gitops',
      'user-admin',
    ];

    modules.forEach((mod) => {
      moduleAccessBreakdown[mod] = { read: 0, user: 0, admin: 0 };
      allUsers.forEach((user) => {
        const role = user.modulePermissions.get(mod);
        if (role) {
          moduleAccessBreakdown[mod][role]++;
        }
      });
    });

    const recentLogins = Array.from(this.sessions.values()).filter((s) => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      return s.loginTime > oneHourAgo;
    }).length;

    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      inactiveUsers: inactiveUsers.length,
      suspendedUsers: suspendedUsers.length,
      adminUsers: adminUsers.length,
      regularUsers: allUsers.length - adminUsers.length,
      recentLogins,
      moduleAccessBreakdown,
    };
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);

    // End all active sessions
    const sessions = this.getUserSessions(userId);
    for (const session of sessions) {
      await this.endSession(session.id);
    }

    this.users.delete(userId);
    await this.saveUsers();
    this.logAudit(userId, 'user.deleted', 'user-admin', userId);
  }

  /**
   * Set current user context
   */
  setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | undefined {
    return this.currentUser;
  }

  /**
   * Save users to file
   */
  private async saveUsers(): Promise<void> {
    try {
      const usersArray = Array.from(this.users.values()).map((user) => ({
        ...user,
        modulePermissions: Object.fromEntries(user.modulePermissions),
      }));

      await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      Logger.error('Failed to save users');
      throw error;
    }
  }

  /**
   * Save sessions to file
   */
  private async saveSessions(): Promise<void> {
    try {
      await fs.writeFile(this.sessionsFile, JSON.stringify(Array.from(this.sessions.values()), null, 2));
    } catch (error) {
      Logger.error('Failed to save sessions');
      throw error;
    }
  }

  /**
   * Save audit log to file
   */
  private async saveAuditLog(): Promise<void> {
    try {
      await fs.writeFile(this.auditFile, JSON.stringify(this.auditLog, null, 2));
    } catch (error) {
      Logger.error('Failed to save audit log');
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = this.users.get(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    // Check if account is locked
    if (AuthUtils.isAccountLocked(user.lockedUntil)) {
      throw new Error('Account is locked');
    }

    // Verify password
    const isValid = await AuthUtils.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      // Increment failed attempts
      user.failedLoginAttempts++;
      
      if (user.failedLoginAttempts >= 5) {
        const lockoutDuration = AuthUtils.calculateLockoutDuration(user.failedLoginAttempts);
        user.lockedUntil = new Date(Date.now() + lockoutDuration);
        await this.saveUsers();
        throw new Error('Account locked due to too many failed attempts');
      }

      await this.saveUsers();
      return null;
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLogin = new Date();
    await this.saveUsers();

    // Generate JWT token
    const token = AuthUtils.generateAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: Array.from(user.modulePermissions.entries()).map(
        ([mod, perm]) => `${mod}:${perm}`
      ),
    });

    await this.logAudit(user.id, 'login', 'success', { method: 'password' });

    return { user, token };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);

    if (!user || !user.passwordHash) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await AuthUtils.verifyPassword(currentPassword, user.passwordHash);

    if (!isValid) {
      await this.logAudit(userId, 'password_change', 'failed', { reason: 'invalid_current_password' });
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const validation = AuthUtils.validatePassword(newPassword, undefined, {
      email: user.email,
      name: user.name,
    });

    if (!validation.valid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    // Hash and save new password
    user.passwordHash = await AuthUtils.hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    user.lastModified = new Date();

    await this.saveUsers();
    await this.logAudit(userId, 'password_change', 'success', {});
  }

  /**
   * Reset user password (admin or password reset flow)
   */
  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = this.users.get(email);

    if (!user) {
      throw new Error('User not found');
    }

    // Validate new password
    const validation = AuthUtils.validatePassword(newPassword, undefined, {
      email: user.email,
      name: user.name,
    });

    if (!validation.valid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    // Hash and save new password
    user.passwordHash = await AuthUtils.hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastModified = new Date();

    await this.saveUsers();
    await this.logAudit(user.id, 'password_reset', 'success', {});
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    const mfaSecret = await MFA.generateMFASecret(user.email);

    user.mfaSecret = mfaSecret.secret;
    user.mfaEnabled = true;
    user.lastModified = new Date();

    await this.saveUsers();
    await this.logAudit(userId, 'mfa_enabled', 'success', {});

    return mfaSecret;
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(userId: string, code: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);

    if (!user || !user.mfaSecret) {
      return false;
    }

    const isValid = MFA.verifyTOTP(user.mfaSecret, code);

    await this.logAudit(userId, 'mfa_verify', isValid ? 'success' : 'failed', {});

    return isValid;
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.lastModified = new Date();

    await this.saveUsers();
    await this.logAudit(userId, 'mfa_disabled', 'success', {});
  }

  /**
   * Create user from OAuth profile
   */
  async createFromOAuth(profile: OAuthProfile): Promise<User> {
    if (this.users.has(profile.email)) {
      throw new Error(`User with email ${profile.email} already exists`);
    }

    const newUser: User = {
      id: `USER-${Date.now()}`,
      email: profile.email,
      name: profile.name,
      status: 'active',
      role: 'user',
      modulePermissions: new Map(),
      authProvider: 'oauth',
      emailVerified: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      createdDate: new Date(),
      lastModified: new Date(),
      modifiedBy: 'oauth',
    };

    this.users.set(newUser.email, newUser);
    await this.saveUsers();
    await this.logAudit(newUser.id, 'user_created', 'success', { method: 'oauth', provider: profile.provider });

    return newUser;
  }

  /**
   * Create user from SAML profile
   */
  async createFromSAML(profile: SAMLProfile): Promise<User> {
    if (this.users.has(profile.email)) {
      throw new Error(`User with email ${profile.email} already exists`);
    }

    const newUser: User = {
      id: `USER-${Date.now()}`,
      email: profile.email,
      name: profile.displayName || `${profile.firstName} ${profile.lastName}`,
      status: 'active',
      role: 'user',
      modulePermissions: new Map(),
      authProvider: 'saml',
      emailVerified: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      createdDate: new Date(),
      lastModified: new Date(),
      modifiedBy: 'saml',
    };

    this.users.set(newUser.email, newUser);
    await this.saveUsers();
    await this.logAudit(newUser.id, 'user_created', 'success', { method: 'saml' });

    return newUser;
  }

  /**
   * Find or create user from LDAP
   */
  async findOrCreateFromLDAP(ldapUser: LDAPUser): Promise<User> {
    let user = this.users.get(ldapUser.email);

    if (!user) {
      user = {
        id: `USER-${Date.now()}`,
        email: ldapUser.email,
        name: ldapUser.displayName || `${ldapUser.firstName} ${ldapUser.lastName}`,
        status: 'active',
        role: 'user',
        modulePermissions: new Map(),
        authProvider: 'ldap',
        emailVerified: true,
        mfaEnabled: false,
        failedLoginAttempts: 0,
        createdDate: new Date(),
        lastModified: new Date(),
        modifiedBy: 'ldap',
      };

      this.users.set(user.email, user);
      await this.saveUsers();
      await this.logAudit(user.id, 'user_created', 'success', { method: 'ldap' });
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.get(email);
  }

  /**
   * Lock user account
   */
  async lockAccount(userId: string, reason: string): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.status = 'suspended';
    user.lastModified = new Date();

    await this.saveUsers();
    await this.logAudit(userId, 'account_locked', 'success', { reason });
  }

  /**
   * Unlock user account
   */
  async unlockAccount(userId: string): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.status = 'active';
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastModified = new Date();

    await this.saveUsers();
    await this.logAudit(userId, 'account_unlocked', 'success', {});
  }
}
