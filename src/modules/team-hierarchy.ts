/**
 * @file team-hierarchy.ts
 * @description Manages organizational hierarchy and team structure
 * 
 * Hierarchy Structure:
 * Organization (Company/Enterprise)
 *   └── Segments (Business Units)
 *       └── Departments (Functional Groups)
 *           └── Teams (Working Units)
 *               └── Team Members (Individual Contributors)
 * 
 * Permission Model:
 * - Permissions cascade down from Organization → Segment → Department → Team
 * - Individual resource permissions can override hierarchy permissions
 * - Access requests allow users to request elevated permissions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/logger';
import type {
  Organization,
  Segment,
  Department,
  Team,
  TeamMember,
  ResourcePermission,
  AccessRequest,
  PermissionScope,
  PermissionLevel,
  ResourceType,
  PermissionCheckResult,
  OrganizationalHierarchyView,
  TeamMetrics,
  DepartmentMetrics,
  SegmentMetrics,
  EnhancedUser,
} from '../types';

export class TeamHierarchyModule {
  private static dataPath = '.testmgr/team-hierarchy.json';
  private static data: {
    organizations: Organization[];
    segments: Segment[];
    departments: Department[];
    teams: Team[];
    teamMembers: TeamMember[];
    resourcePermissions: ResourcePermission[];
    accessRequests: AccessRequest[];
  } | null = null;

  /**
   * Initialize team hierarchy data structure
   */
  static async init(projectPath: string = process.cwd()): Promise<void> {
    const configDir = path.join(projectPath, '.testmgr');
    const dataFile = path.join(projectPath, this.dataPath);

    try {
      await fs.mkdir(configDir, { recursive: true });

      const defaultData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      await fs.writeFile(dataFile, JSON.stringify(defaultData, null, 2));
      this.data = defaultData;
      Logger.success('Team hierarchy initialized');
    } catch (error) {
      Logger.error(`Failed to initialize team hierarchy: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Load team hierarchy data
   */
  static async loadData(projectPath: string = process.cwd()): Promise<typeof this.data> {
    if (this.data) return this.data;

    const dataFile = path.join(projectPath, this.dataPath);

    try {
      const content = await fs.readFile(dataFile, 'utf-8');
      this.data = JSON.parse(content);
      return this.data;
    } catch (error) {
      Logger.warn('Team hierarchy data not found, initializing...');
      await this.init(projectPath);
      return this.data;
    }
  }

  /**
   * Save team hierarchy data
   */
  private static async saveData(projectPath: string = process.cwd()): Promise<void> {
    if (!this.data) {
      throw new Error('No data to save');
    }

    const dataFile = path.join(projectPath, this.dataPath);
    await fs.writeFile(dataFile, JSON.stringify(this.data, null, 2));
  }

  // ==================== Organization Management ====================

  /**
   * Create a new organization
   */
  static async createOrganization(
    org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Organization> {
    await this.loadData();

    const newOrg: Organization = {
      ...org,
      id: `ORG-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.organizations.push(newOrg);
    await this.saveData();

    Logger.success(`Organization created: ${newOrg.name}`);
    return newOrg;
  }

  /**
   * Get organization by ID
   */
  static async getOrganization(orgId: string): Promise<Organization | null> {
    await this.loadData();
    return this.data!.organizations.find((o) => o.id === orgId) || null;
  }

  /**
   * List all organizations
   */
  static async listOrganizations(filter?: { status?: string }): Promise<Organization[]> {
    await this.loadData();
    let orgs = this.data!.organizations;

    if (filter?.status) {
      orgs = orgs.filter((o) => o.status === filter.status);
    }

    return orgs;
  }

  /**
   * Update organization
   */
  static async updateOrganization(
    orgId: string,
    updates: Partial<Organization>
  ): Promise<Organization> {
    await this.loadData();

    const index = this.data!.organizations.findIndex((o) => o.id === orgId);
    if (index === -1) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    this.data!.organizations[index] = {
      ...this.data!.organizations[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveData();
    return this.data!.organizations[index];
  }

  // ==================== Segment Management ====================

  /**
   * Create a new segment
   */
  static async createSegment(
    segment: Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Segment> {
    await this.loadData();

    const newSegment: Segment = {
      ...segment,
      id: `SEGMENT-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.segments.push(newSegment);

    // Link to parent organization
    const org = await this.getOrganization(newSegment.organizationId);
    if (org) {
      org.segments.push(newSegment.id);
      await this.updateOrganization(org.id, org);
    }

    await this.saveData();
    Logger.success(`Segment created: ${newSegment.name}`);
    return newSegment;
  }

  /**
   * Get segment by ID
   */
  static async getSegment(segmentId: string): Promise<Segment | null> {
    await this.loadData();
    return this.data!.segments.find((s) => s.id === segmentId) || null;
  }

  /**
   * List segments by organization
   */
  static async listSegments(filter?: {
    organizationId?: string;
    status?: string;
  }): Promise<Segment[]> {
    await this.loadData();
    let segments = this.data!.segments;

    if (filter?.organizationId) {
      segments = segments.filter((s) => s.organizationId === filter.organizationId);
    }

    if (filter?.status) {
      segments = segments.filter((s) => s.status === filter.status);
    }

    return segments;
  }

  // ==================== Department Management ====================

  /**
   * Create a new department
   */
  static async createDepartment(
    dept: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Department> {
    await this.loadData();

    const newDept: Department = {
      ...dept,
      id: `DEPT-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.departments.push(newDept);

    // Link to parent segment
    const segment = await this.getSegment(newDept.segmentId);
    if (segment) {
      segment.departments.push(newDept.id);
      await this.updateSegment(segment.id, segment);
    }

    await this.saveData();
    Logger.success(`Department created: ${newDept.name}`);
    return newDept;
  }

  /**
   * Get department by ID
   */
  static async getDepartment(deptId: string): Promise<Department | null> {
    await this.loadData();
    return this.data!.departments.find((d) => d.id === deptId) || null;
  }

  /**
   * List departments by segment
   */
  static async listDepartments(filter?: {
    segmentId?: string;
    status?: string;
  }): Promise<Department[]> {
    await this.loadData();
    let departments = this.data!.departments;

    if (filter?.segmentId) {
      departments = departments.filter((d) => d.segmentId === filter.segmentId);
    }

    if (filter?.status) {
      departments = departments.filter((d) => d.status === filter.status);
    }

    return departments;
  }

  // ==================== Team Management ====================

  /**
   * Create a new team
   */
  static async createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    await this.loadData();

    const newTeam: Team = {
      ...team,
      id: `TEAM-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.data!.teams.push(newTeam);

    // Link to parent department
    const dept = await this.getDepartment(newTeam.departmentId);
    if (dept) {
      dept.teams.push(newTeam.id);
      await this.updateDepartment(dept.id, dept);
    }

    await this.saveData();
    Logger.success(`Team created: ${newTeam.name}`);
    return newTeam;
  }

  /**
   * Get team by ID
   */
  static async getTeam(teamId: string): Promise<Team | null> {
    await this.loadData();
    return this.data!.teams.find((t) => t.id === teamId) || null;
  }

  /**
   * List teams by department
   */
  static async listTeams(filter?: { departmentId?: string; status?: string }): Promise<Team[]> {
    await this.loadData();
    let teams = this.data!.teams;

    if (filter?.departmentId) {
      teams = teams.filter((t) => t.departmentId === filter.departmentId);
    }

    if (filter?.status) {
      teams = teams.filter((t) => t.status === filter.status);
    }

    return teams;
  }

  /**
   * Add member to team
   */
  static async addTeamMember(
    teamId: string,
    userId: string,
    role: 'member' | 'lead' | 'admin' = 'member'
  ): Promise<TeamMember> {
    await this.loadData();

    const team = await this.getTeam(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    // Check if member already exists
    const existing = this.data!.teamMembers.find(
      (m) => m.teamId === teamId && m.userId === userId
    );

    if (existing) {
      throw new Error(`User ${userId} is already a member of team ${teamId}`);
    }

    const newMember: TeamMember = {
      id: `MEMBER-${Date.now()}`,
      userId,
      teamId,
      role,
      permissions: this.getDefaultTeamPermissions(role),
      joinedAt: new Date(),
      status: 'active',
    };

    this.data!.teamMembers.push(newMember);
    team.members.push(userId);

    await this.updateTeam(teamId, team);
    await this.saveData();

    Logger.success(`User ${userId} added to team ${team.name}`);
    return newMember;
  }

  /**
   * Remove member from team
   */
  static async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await this.loadData();

    const team = await this.getTeam(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    // Remove from teamMembers
    this.data!.teamMembers = this.data!.teamMembers.filter(
      (m) => !(m.teamId === teamId && m.userId === userId)
    );

    // Remove from team members list
    team.members = team.members.filter((id) => id !== userId);
    await this.updateTeam(teamId, team);

    await this.saveData();
    Logger.success(`User ${userId} removed from team ${team.name}`);
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    await this.loadData();
    return this.data!.teamMembers.filter((m) => m.teamId === teamId);
  }

  /**
   * Get user's teams
   */
  static async getUserTeams(userId: string): Promise<Team[]> {
    await this.loadData();
    const memberships = this.data!.teamMembers.filter((m) => m.userId === userId);
    const teamIds = memberships.map((m) => m.teamId);
    return this.data!.teams.filter((t) => teamIds.includes(t.id));
  }

  // ==================== Permission Management ====================

  /**
   * Grant resource permission to user
   */
  static async grantResourcePermission(
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
    permissionLevel: PermissionLevel,
    grantedBy: string,
    reason?: string,
    expiresAt?: Date
  ): Promise<ResourcePermission> {
    await this.loadData();

    const permission: ResourcePermission = {
      id: `PERM-${Date.now()}`,
      resourceType,
      resourceId,
      userId,
      permissionLevel,
      grantedBy,
      grantedAt: new Date(),
      expiresAt,
      reason,
    };

    this.data!.resourcePermissions.push(permission);
    await this.saveData();

    Logger.success(`Permission granted: ${permissionLevel} on ${resourceType}:${resourceId} to user ${userId}`);
    return permission;
  }

  /**
   * Revoke resource permission
   */
  static async revokeResourcePermission(permissionId: string): Promise<void> {
    await this.loadData();

    this.data!.resourcePermissions = this.data!.resourcePermissions.filter(
      (p) => p.id !== permissionId
    );

    await this.saveData();
    Logger.success(`Permission revoked: ${permissionId}`);
  }

  /**
   * Check user permission for a resource
   */
  static async checkPermission(
    userId: string,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<PermissionCheckResult> {
    await this.loadData();

    // 1. Check direct resource permission (highest priority)
    const resourcePerm = this.data!.resourcePermissions.find(
      (p) =>
        p.userId === userId &&
        p.resourceType === resourceType &&
        p.resourceId === resourceId &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date())
    );

    if (resourcePerm) {
      return {
        hasAccess: resourcePerm.permissionLevel !== 'none',
        permissionLevel: resourcePerm.permissionLevel,
        source: 'resource',
      };
    }

    // 2. Check team-level permission
    const userTeams = await this.getUserTeams(userId);
    for (const team of userTeams) {
      const teamMember = this.data!.teamMembers.find(
        (m) => m.teamId === team.id && m.userId === userId
      );

      if (teamMember && teamMember.status === 'active') {
        // Check if resource belongs to this team (simplified check)
        const hasTeamAccess = this.resourceBelongsToTeam(resourceType, resourceId, team);

        if (hasTeamAccess) {
          const level = this.getTeamPermissionLevel(teamMember, resourceType);
          return {
            hasAccess: level !== 'none',
            permissionLevel: level,
            source: 'team',
          };
        }
      }
    }

    // 3. Check department-level permission
    for (const team of userTeams) {
      const dept = await this.getDepartment(team.departmentId);
      if (dept && dept.settings.allowCrossTeamVisibility) {
        return {
          hasAccess: true,
          permissionLevel: dept.settings.defaultPermissionLevel,
          source: 'department',
        };
      }
    }

    // 4. No access
    return {
      hasAccess: false,
      permissionLevel: 'none',
      source: 'none',
      reason: 'User does not have permission to access this resource',
    };
  }

  /**
   * Get user's complete permission scope
   */
  static async getUserPermissionScope(userId: string): Promise<PermissionScope> {
    await this.loadData();

    const teams = await this.getUserTeams(userId);
    const departments = new Set<string>();
    const segments = new Set<string>();
    const organizations = new Set<string>();

    for (const team of teams) {
      const dept = await this.getDepartment(team.departmentId);
      if (dept) {
        departments.add(dept.id);
        const segment = await this.getSegment(dept.segmentId);
        if (segment) {
          segments.add(segment.id);
          organizations.add(segment.organizationId);
        }
      }
    }

    const teamMemberships = this.data!.teamMembers.filter((m) => m.userId === userId);

    const scope: PermissionScope = {
      userId,
      organizationAccess: Array.from(organizations).map((orgId) => ({
        organizationId: orgId,
        level: 'read' as PermissionLevel,
      })),
      segmentAccess: Array.from(segments).map((segId) => ({
        segmentId: segId,
        level: 'read' as PermissionLevel,
      })),
      departmentAccess: Array.from(departments).map((deptId) => ({
        departmentId: deptId,
        level: 'read' as PermissionLevel,
      })),
      teamAccess: teamMemberships.map((m) => ({
        teamId: m.teamId,
        level: m.permissions.canEditAllTeamWork ? 'write' : 'read',
        role: m.role,
      })),
      resourcePermissions: this.data!.resourcePermissions.filter((p) => p.userId === userId),
    };

    return scope;
  }

  // ==================== Access Request Management ====================

  /**
   * Create access request
   */
  static async createAccessRequest(
    request: Omit<AccessRequest, 'id' | 'createdAt'>
  ): Promise<AccessRequest> {
    await this.loadData();

    const newRequest: AccessRequest = {
      ...request,
      id: `REQ-${Date.now()}`,
      createdAt: new Date(),
    };

    this.data!.accessRequests.push(newRequest);
    await this.saveData();

    Logger.success(`Access request created: ${newRequest.id}`);
    return newRequest;
  }

  /**
   * Approve access request
   */
  static async approveAccessRequest(
    requestId: string,
    approverId: string
  ): Promise<AccessRequest> {
    await this.loadData();

    const request = this.data!.accessRequests.find((r) => r.id === requestId);
    if (!request) {
      throw new Error(`Access request not found: ${requestId}`);
    }

    request.status = 'approved';
    request.approver = approverId;
    request.approvedAt = new Date();

    // Grant the requested permission
    if (request.requestType === 'team') {
      await this.addTeamMember(request.targetId, request.requesterId);
    } else if (request.requestType === 'resource') {
      await this.grantResourcePermission(
        'story', // Default to story, should be specified in request
        request.targetId,
        request.requesterId,
        request.requestedPermission,
        approverId,
        `Approved from access request: ${requestId}`
      );
    }

    await this.saveData();
    Logger.success(`Access request approved: ${requestId}`);
    return request;
  }

  /**
   * Reject access request
   */
  static async rejectAccessRequest(
    requestId: string,
    approverId: string,
    reason: string
  ): Promise<AccessRequest> {
    await this.loadData();

    const request = this.data!.accessRequests.find((r) => r.id === requestId);
    if (!request) {
      throw new Error(`Access request not found: ${requestId}`);
    }

    request.status = 'rejected';
    request.approver = approverId;
    request.rejectionReason = reason;

    await this.saveData();
    Logger.success(`Access request rejected: ${requestId}`);
    return request;
  }

  /**
   * List access requests
   */
  static async listAccessRequests(filter?: {
    requesterId?: string;
    status?: string;
    targetId?: string;
  }): Promise<AccessRequest[]> {
    await this.loadData();
    let requests = this.data!.accessRequests;

    if (filter?.requesterId) {
      requests = requests.filter((r) => r.requesterId === filter.requesterId);
    }

    if (filter?.status) {
      requests = requests.filter((r) => r.status === filter.status);
    }

    if (filter?.targetId) {
      requests = requests.filter((r) => r.targetId === filter.targetId);
    }

    return requests;
  }

  // ==================== Hierarchy View ====================

  /**
   * Get organizational hierarchy view for a user
   */
  static async getOrganizationalView(userId: string): Promise<OrganizationalHierarchyView> {
    await this.loadData();

    const teams = await this.getUserTeams(userId);
    const departments: Department[] = [];
    const segments: Segment[] = [];
    const organizations: Organization[] = [];
    const userTeamRoles = new Map<string, 'member' | 'lead' | 'admin'>();

    for (const team of teams) {
      const teamMember = this.data!.teamMembers.find(
        (m) => m.teamId === team.id && m.userId === userId
      );
      if (teamMember) {
        userTeamRoles.set(team.id, teamMember.role);
      }

      const dept = await this.getDepartment(team.departmentId);
      if (dept && !departments.find((d) => d.id === dept.id)) {
        departments.push(dept);

        const segment = await this.getSegment(dept.segmentId);
        if (segment && !segments.find((s) => s.id === segment.id)) {
          segments.push(segment);

          const org = await this.getOrganization(segment.organizationId);
          if (org && !organizations.find((o) => o.id === org.id)) {
            organizations.push(org);
          }
        }
      }
    }

    return {
      organization: organizations[0], // Assume single org for now
      segments,
      departments,
      teams,
      userTeamRoles,
    };
  }

  // ==================== Helper Methods ====================

  private static async updateSegment(segmentId: string, updates: Partial<Segment>): Promise<Segment> {
    const index = this.data!.segments.findIndex((s) => s.id === segmentId);
    if (index === -1) {
      throw new Error(`Segment not found: ${segmentId}`);
    }

    this.data!.segments[index] = {
      ...this.data!.segments[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveData();
    return this.data!.segments[index];
  }

  private static async updateDepartment(deptId: string, updates: Partial<Department>): Promise<Department> {
    const index = this.data!.departments.findIndex((d) => d.id === deptId);
    if (index === -1) {
      throw new Error(`Department not found: ${deptId}`);
    }

    this.data!.departments[index] = {
      ...this.data!.departments[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveData();
    return this.data!.departments[index];
  }

  private static async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const index = this.data!.teams.findIndex((t) => t.id === teamId);
    if (index === -1) {
      throw new Error(`Team not found: ${teamId}`);
    }

    this.data!.teams[index] = {
      ...this.data!.teams[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveData();
    return this.data!.teams[index];
  }

  private static getDefaultTeamPermissions(role: 'member' | 'lead' | 'admin') {
    const basePermissions = {
      canCreateStories: true,
      canCreateEpics: false,
      canCreateFeatures: false,
      canAssignWork: false,
      canManageBoard: false,
      canManageRepositories: false,
      canInviteMembers: false,
      canViewAllTeamWork: true,
      canEditAllTeamWork: false,
    };

    if (role === 'lead') {
      return {
        ...basePermissions,
        canCreateEpics: true,
        canAssignWork: true,
        canManageBoard: true,
        canEditAllTeamWork: true,
      };
    }

    if (role === 'admin') {
      return {
        ...basePermissions,
        canCreateEpics: true,
        canCreateFeatures: true,
        canAssignWork: true,
        canManageBoard: true,
        canManageRepositories: true,
        canInviteMembers: true,
        canEditAllTeamWork: true,
      };
    }

    return basePermissions;
  }

  private static resourceBelongsToTeam(
    resourceType: ResourceType,
    resourceId: string,
    team: Team
  ): boolean {
    // Simplified check - in real implementation, would query the resource
    // to check if it belongs to any of the team's boards
    return team.boards.length > 0;
  }

  private static getTeamPermissionLevel(
    member: TeamMember,
    resourceType: ResourceType
  ): PermissionLevel {
    if (member.role === 'admin') return 'admin';
    if (member.permissions.canEditAllTeamWork) return 'write';
    if (member.permissions.canViewAllTeamWork) return 'read';
    return 'none';
  }
}
