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
    this.logger = new Logger('info');
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
      this.logger.info('User manager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize user manager', error as Error);
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
          user.modulePermissions = new Map(Object.entries(user.modulePermissions as any));
          this.users.set(user.id, user);
        });
      }
    } catch (error) {
      this.logger.warn('Failed to load users, starting fresh', error as Error);
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
      this.logger.warn('Failed to load sessions, starting fresh', error as Error);
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
      this.logger.warn('Failed to load audit log, starting fresh', error as Error);
    }
  }

  /**
   * Create a new user
   */
  async createUser(
    email: string,
    name: string,
    role: 'admin' | 'user' = 'user'
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
      createdDate: new Date(),
      lastModified: new Date(),
      modifiedBy: this.currentUser?.email || 'system',
    };

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

    this.saveAuditLog().catch((error) => this.logger.error('Failed to save audit log', error));
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
      this.logger.error('Failed to save users', error as Error);
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
      this.logger.error('Failed to save sessions', error as Error);
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
      this.logger.error('Failed to save audit log', error as Error);
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
}
