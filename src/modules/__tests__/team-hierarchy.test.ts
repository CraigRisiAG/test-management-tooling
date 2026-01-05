/**
 * Team Hierarchy Module Tests
 * 
 * Comprehensive tests for team/organizational hierarchy including:
 * - Organization, Segment, Department, Team CRUD operations
 * - Team member management
 * - Permission cascade algorithm
 * - Resource permission overrides
 * - Access request workflow
 * - Negative scenarios and edge cases
 */

import { TeamHierarchyModule } from '../team-hierarchy';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock filesystem
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('TeamHierarchyModule', () => {
  const testProjectPath = '/test/project';
  const dataPath = path.join(testProjectPath, '.testmgr/team-hierarchy.json');

  beforeEach(() => {
    jest.clearAllMocks();
    (TeamHierarchyModule as any).data = null;
  });

  describe('Initialization', () => {
    it('should initialize team hierarchy data structure', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await TeamHierarchyModule.init(testProjectPath);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join(testProjectPath, '.testmgr'),
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should create all required collections', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await TeamHierarchyModule.init(testProjectPath);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const data = JSON.parse(writeCall[1] as string);

      expect(data).toHaveProperty('organizations');
      expect(data).toHaveProperty('segments');
      expect(data).toHaveProperty('departments');
      expect(data).toHaveProperty('teams');
      expect(data).toHaveProperty('teamMembers');
      expect(data).toHaveProperty('resourcePermissions');
      expect(data).toHaveProperty('accessRequests');
    });
  });

  describe('Organization Management', () => {
    beforeEach(() => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    describe('Create Organization', () => {
      it('should create organization with admin permissions', async () => {
        const org = await TeamHierarchyModule.createOrganization({
          name: 'ACME Corp',
          description: 'Global tech company',
          defaultPermission: 'read',
          adminUserIds: ['user-1', 'user-2'],
          memberUserIds: ['user-3'],
          settings: {
            allowCrossTeamAccess: true,
            requireApprovalForResourceAccess: true,
          },
          metadata: { industry: 'Technology' },
        });

        expect(org.id).toMatch(/^ORG-/);
        expect(org.name).toBe('ACME Corp');
        expect(org.defaultPermission).toBe('read');
        expect(org.adminUserIds).toContain('user-1');
        expect(org.adminUserIds).toContain('user-2');
      });

      it('should create organization with default settings', async () => {
        const org = await TeamHierarchyModule.createOrganization({
          name: 'Default Org',
          description: '',
          defaultPermission: 'none',
          adminUserIds: [],
          memberUserIds: [],
          settings: {
            allowCrossTeamAccess: false,
            requireApprovalForResourceAccess: false,
          },
        });

        expect(org.settings.allowCrossTeamAccess).toBe(false);
        expect(org.defaultPermission).toBe('none');
      });
    });

    describe('Get Organization', () => {
      it('should retrieve organization by ID', async () => {
        const created = await TeamHierarchyModule.createOrganization({
          name: 'Test Org',
          description: '',
          defaultPermission: 'read',
          adminUserIds: [],
          memberUserIds: [],
          settings: {
            allowCrossTeamAccess: true,
            requireApprovalForResourceAccess: false,
          },
        });

        const retrieved = await TeamHierarchyModule.getOrganization(created.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe('Test Org');
      });

      it('should return null for non-existent organization', async () => {
        const result = await TeamHierarchyModule.getOrganization('ORG-FAKE');

        expect(result).toBeNull();
      });
    });

    describe('List Organizations', () => {
      it('should list all organizations', async () => {
        await TeamHierarchyModule.createOrganization({
          name: 'Org 1',
          description: '',
          defaultPermission: 'read',
          adminUserIds: [],
          memberUserIds: [],
          settings: {
            allowCrossTeamAccess: true,
            requireApprovalForResourceAccess: false,
          },
        });

        await TeamHierarchyModule.createOrganization({
          name: 'Org 2',
          description: '',
          defaultPermission: 'write',
          adminUserIds: [],
          memberUserIds: [],
          settings: {
            allowCrossTeamAccess: false,
            requireApprovalForResourceAccess: true,
          },
        });

        const orgs = await TeamHierarchyModule.listOrganizations();

        expect(orgs).toHaveLength(2);
      });
    });
  });

  describe('Segment Management', () => {
    let orgId: string;

    beforeEach(async () => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const org = await TeamHierarchyModule.createOrganization({
        name: 'Parent Org',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
        settings: {
          allowCrossTeamAccess: true,
          requireApprovalForResourceAccess: false,
        },
      });
      orgId = org.id;
    });

    it('should create segment under organization', async () => {
      const segment = await TeamHierarchyModule.createSegment({
        organizationId: orgId,
        name: 'Engineering',
        description: 'Engineering division',
        defaultPermission: 'write',
        adminUserIds: ['eng-lead'],
        memberUserIds: [],
        metadata: { budget: '10M' },
      });

      expect(segment.id).toMatch(/^SEG-/);
      expect(segment.organizationId).toBe(orgId);
      expect(segment.name).toBe('Engineering');
    });

    it('should list segments by organization', async () => {
      await TeamHierarchyModule.createSegment({
        organizationId: orgId,
        name: 'Engineering',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      await TeamHierarchyModule.createSegment({
        organizationId: orgId,
        name: 'Sales',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      const segments = await TeamHierarchyModule.listSegments({ organizationId: orgId });

      expect(segments).toHaveLength(2);
      expect(segments.every((s) => s.organizationId === orgId)).toBe(true);
    });
  });

  describe('Department Management', () => {
    let segmentId: string;

    beforeEach(async () => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const org = await TeamHierarchyModule.createOrganization({
        name: 'Org',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
        settings: {
          allowCrossTeamAccess: true,
          requireApprovalForResourceAccess: false,
        },
      });

      const segment = await TeamHierarchyModule.createSegment({
        organizationId: org.id,
        name: 'Segment',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });
      segmentId = segment.id;
    });

    it('should create department under segment', async () => {
      const dept = await TeamHierarchyModule.createDepartment({
        segmentId,
        name: 'Backend Engineering',
        description: 'API and services',
        defaultPermission: 'write',
        adminUserIds: ['backend-lead'],
        memberUserIds: [],
        metadata: { techStack: 'Node.js' },
      });

      expect(dept.id).toMatch(/^DEPT-/);
      expect(dept.segmentId).toBe(segmentId);
      expect(dept.name).toBe('Backend Engineering');
    });

    it('should list departments by segment', async () => {
      await TeamHierarchyModule.createDepartment({
        segmentId,
        name: 'Backend',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      await TeamHierarchyModule.createDepartment({
        segmentId,
        name: 'Frontend',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      const depts = await TeamHierarchyModule.listDepartments({ segmentId });

      expect(depts).toHaveLength(2);
      expect(depts.every((d) => d.segmentId === segmentId)).toBe(true);
    });
  });

  describe('Team Management', () => {
    let departmentId: string;

    beforeEach(async () => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const org = await TeamHierarchyModule.createOrganization({
        name: 'Org',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
        settings: {
          allowCrossTeamAccess: true,
          requireApprovalForResourceAccess: false,
        },
      });

      const segment = await TeamHierarchyModule.createSegment({
        organizationId: org.id,
        name: 'Segment',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      const dept = await TeamHierarchyModule.createDepartment({
        segmentId: segment.id,
        name: 'Dept',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });
      departmentId = dept.id;
    });

    it('should create team under department', async () => {
      const team = await TeamHierarchyModule.createTeam({
        departmentId,
        name: 'API Team',
        description: 'Core API development',
        defaultPermission: 'write',
        adminUserIds: ['team-lead'],
        memberUserIds: ['dev-1', 'dev-2'],
        metadata: { sprint: 'Sprint 42' },
      });

      expect(team.id).toMatch(/^TEAM-/);
      expect(team.departmentId).toBe(departmentId);
      expect(team.name).toBe('API Team');
      expect(team.memberUserIds).toContain('dev-1');
    });

    it('should list teams by department', async () => {
      await TeamHierarchyModule.createTeam({
        departmentId,
        name: 'Team A',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      await TeamHierarchyModule.createTeam({
        departmentId,
        name: 'Team B',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      const teams = await TeamHierarchyModule.listTeams({ departmentId });

      expect(teams).toHaveLength(2);
      expect(teams.every((t) => t.departmentId === departmentId)).toBe(true);
    });
  });

  describe('Team Member Management', () => {
    let teamId: string;

    beforeEach(async () => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const org = await TeamHierarchyModule.createOrganization({
        name: 'Org',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
        settings: {
          allowCrossTeamAccess: true,
          requireApprovalForResourceAccess: false,
        },
      });

      const segment = await TeamHierarchyModule.createSegment({
        organizationId: org.id,
        name: 'Segment',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      const dept = await TeamHierarchyModule.createDepartment({
        segmentId: segment.id,
        name: 'Dept',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      const team = await TeamHierarchyModule.createTeam({
        departmentId: dept.id,
        name: 'Team',
        description: '',
        defaultPermission: 'write',
        adminUserIds: [],
        memberUserIds: [],
      });
      teamId = team.id;
    });

    it('should add team member with role', async () => {
      const member = await TeamHierarchyModule.addTeamMember({
        teamId,
        userId: 'user-123',
        role: 'developer',
        permissions: ['read', 'write'],
        joinedAt: new Date(),
      });

      expect(member.id).toMatch(/^MEMBER-/);
      expect(member.teamId).toBe(teamId);
      expect(member.userId).toBe('user-123');
      expect(member.role).toBe('developer');
      expect(member.permissions).toContain('read');
      expect(member.permissions).toContain('write');
    });

    it('should update team member permissions', async () => {
      const member = await TeamHierarchyModule.addTeamMember({
        teamId,
        userId: 'user-123',
        role: 'developer',
        permissions: ['read'],
        joinedAt: new Date(),
      });

      const updated = await TeamHierarchyModule.updateTeamMember(member.id, {
        permissions: ['read', 'write', 'admin'],
        role: 'senior-developer',
      });

      expect(updated.permissions).toHaveLength(3);
      expect(updated.role).toBe('senior-developer');
    });

    it('should remove team member', async () => {
      const member = await TeamHierarchyModule.addTeamMember({
        teamId,
        userId: 'user-123',
        role: 'developer',
        permissions: ['read'],
        joinedAt: new Date(),
      });

      await TeamHierarchyModule.removeTeamMember(member.id);

      const members = await TeamHierarchyModule.listTeamMembers({ teamId });
      expect(members).toHaveLength(0);
    });

    it('should list team members by team', async () => {
      await TeamHierarchyModule.addTeamMember({
        teamId,
        userId: 'user-1',
        role: 'developer',
        permissions: ['read'],
        joinedAt: new Date(),
      });

      await TeamHierarchyModule.addTeamMember({
        teamId,
        userId: 'user-2',
        role: 'designer',
        permissions: ['read', 'write'],
        joinedAt: new Date(),
      });

      const members = await TeamHierarchyModule.listTeamMembers({ teamId });

      expect(members).toHaveLength(2);
    });
  });

  describe('Permission Checking', () => {
    let orgId: string;
    let segmentId: string;
    let departmentId: string;
    let teamId: string;

    beforeEach(async () => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const org = await TeamHierarchyModule.createOrganization({
        name: 'Org',
        description: '',
        defaultPermission: 'read',
        adminUserIds: ['org-admin'],
        memberUserIds: ['org-member'],
        settings: {
          allowCrossTeamAccess: true,
          requireApprovalForResourceAccess: false,
        },
      });
      orgId = org.id;

      const segment = await TeamHierarchyModule.createSegment({
        organizationId: org.id,
        name: 'Segment',
        description: '',
        defaultPermission: 'write',
        adminUserIds: ['seg-admin'],
        memberUserIds: [],
      });
      segmentId = segment.id;

      const dept = await TeamHierarchyModule.createDepartment({
        segmentId: segment.id,
        name: 'Dept',
        description: '',
        defaultPermission: 'admin',
        adminUserIds: ['dept-admin'],
        memberUserIds: [],
      });
      departmentId = dept.id;

      const team = await TeamHierarchyModule.createTeam({
        departmentId: dept.id,
        name: 'Team',
        description: '',
        defaultPermission: 'write',
        adminUserIds: ['team-admin'],
        memberUserIds: ['team-member'],
      });
      teamId = team.id;
    });

    describe('Cascading Permission Algorithm', () => {
      it('should grant team-level permission to team member', async () => {
        const hasPermission = await TeamHierarchyModule.checkPermission(
          'team-member',
          'BOARD-123',
          'write'
        );

        expect(hasPermission).toBe(true);
      });

      it('should grant department permission when not in team', async () => {
        const hasPermission = await TeamHierarchyModule.checkPermission(
          'dept-admin',
          'BOARD-123',
          'admin'
        );

        expect(hasPermission).toBe(true);
      });

      it('should grant segment permission when not in department', async () => {
        const hasPermission = await TeamHierarchyModule.checkPermission(
          'seg-admin',
          'BOARD-123',
          'write'
        );

        expect(hasPermission).toBe(true);
      });

      it('should grant organization permission when not in segment', async () => {
        const hasPermission = await TeamHierarchyModule.checkPermission(
          'org-member',
          'BOARD-123',
          'read'
        );

        expect(hasPermission).toBe(true);
      });

      it('should deny permission to user not in hierarchy', async () => {
        const hasPermission = await TeamHierarchyModule.checkPermission(
          'external-user',
          'BOARD-123',
          'read'
        );

        expect(hasPermission).toBe(false);
      });

      it('should deny higher permission than granted', async () => {
        const hasPermission = await TeamHierarchyModule.checkPermission(
          'org-member', // Has 'read' permission
          'BOARD-123',
          'admin' // Requesting 'admin'
        );

        expect(hasPermission).toBe(false);
      });
    });

    describe('Resource Permission Overrides', () => {
      it('should grant resource-specific permission override', async () => {
        await TeamHierarchyModule.grantResourcePermission({
          resourceId: 'BOARD-999',
          resourceType: 'board',
          userId: 'guest-user',
          permission: 'read',
          grantedBy: 'admin',
          grantedAt: new Date(),
        });

        const hasPermission = await TeamHierarchyModule.checkPermission(
          'guest-user',
          'BOARD-999',
          'read'
        );

        expect(hasPermission).toBe(true);
      });

      it('should prioritize resource permission over team permission', async () => {
        // Team member has 'write' by default
        await TeamHierarchyModule.grantResourcePermission({
          resourceId: 'BOARD-999',
          resourceType: 'board',
          userId: 'team-member',
          permission: 'admin',
          grantedBy: 'admin',
          grantedAt: new Date(),
        });

        const hasPermission = await TeamHierarchyModule.checkPermission(
          'team-member',
          'BOARD-999',
          'admin'
        );

        expect(hasPermission).toBe(true);
      });

      it('should respect expiration date on resource permissions', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await TeamHierarchyModule.grantResourcePermission({
          resourceId: 'BOARD-999',
          resourceType: 'board',
          userId: 'temp-user',
          permission: 'read',
          grantedBy: 'admin',
          grantedAt: new Date(),
          expiresAt: yesterday,
        });

        const hasPermission = await TeamHierarchyModule.checkPermission(
          'temp-user',
          'BOARD-999',
          'read'
        );

        expect(hasPermission).toBe(false);
      });

      it('should allow valid non-expired resource permissions', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await TeamHierarchyModule.grantResourcePermission({
          resourceId: 'BOARD-999',
          resourceType: 'board',
          userId: 'temp-user',
          permission: 'read',
          grantedBy: 'admin',
          grantedAt: new Date(),
          expiresAt: tomorrow,
        });

        const hasPermission = await TeamHierarchyModule.checkPermission(
          'temp-user',
          'BOARD-999',
          'read'
        );

        expect(hasPermission).toBe(true);
      });
    });
  });

  describe('Access Request Workflow', () => {
    let teamId: string;

    beforeEach(async () => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const org = await TeamHierarchyModule.createOrganization({
        name: 'Org',
        description: '',
        defaultPermission: 'none',
        adminUserIds: ['admin'],
        memberUserIds: [],
        settings: {
          allowCrossTeamAccess: false,
          requireApprovalForResourceAccess: true,
        },
      });

      const segment = await TeamHierarchyModule.createSegment({
        organizationId: org.id,
        name: 'Segment',
        description: '',
        defaultPermission: 'none',
        adminUserIds: [],
        memberUserIds: [],
      });

      const dept = await TeamHierarchyModule.createDepartment({
        segmentId: segment.id,
        name: 'Dept',
        description: '',
        defaultPermission: 'none',
        adminUserIds: [],
        memberUserIds: [],
      });

      const team = await TeamHierarchyModule.createTeam({
        departmentId: dept.id,
        name: 'Team',
        description: '',
        defaultPermission: 'none',
        adminUserIds: ['admin'],
        memberUserIds: [],
      });
      teamId = team.id;
    });

    it('should create access request', async () => {
      const request = await TeamHierarchyModule.createAccessRequest({
        userId: 'requester',
        resourceId: 'BOARD-123',
        resourceType: 'board',
        requestedPermission: 'read',
        reason: 'Need to review board',
        status: 'pending',
        requestedAt: new Date(),
      });

      expect(request.id).toMatch(/^ACCESS-/);
      expect(request.userId).toBe('requester');
      expect(request.status).toBe('pending');
    });

    it('should approve access request and grant permission', async () => {
      const request = await TeamHierarchyModule.createAccessRequest({
        userId: 'requester',
        resourceId: 'BOARD-123',
        resourceType: 'board',
        requestedPermission: 'read',
        reason: 'Need access',
        status: 'pending',
        requestedAt: new Date(),
      });

      const approved = await TeamHierarchyModule.approveAccessRequest(
        request.id,
        'admin',
        'Approved for project work'
      );

      expect(approved.status).toBe('approved');
      expect(approved.reviewedBy).toBe('admin');
      expect(approved.reviewedAt).toBeDefined();
      expect(approved.reviewNotes).toBe('Approved for project work');

      // Check that permission was actually granted
      const hasPermission = await TeamHierarchyModule.checkPermission(
        'requester',
        'BOARD-123',
        'read'
      );

      expect(hasPermission).toBe(true);
    });

    it('should reject access request without granting permission', async () => {
      const request = await TeamHierarchyModule.createAccessRequest({
        userId: 'requester',
        resourceId: 'BOARD-123',
        resourceType: 'board',
        requestedPermission: 'admin',
        reason: 'Want full access',
        status: 'pending',
        requestedAt: new Date(),
      });

      const rejected = await TeamHierarchyModule.rejectAccessRequest(
        request.id,
        'admin',
        'Insufficient justification'
      );

      expect(rejected.status).toBe('rejected');
      expect(rejected.reviewedBy).toBe('admin');
      expect(rejected.reviewNotes).toBe('Insufficient justification');

      // Check that permission was NOT granted
      const hasPermission = await TeamHierarchyModule.checkPermission(
        'requester',
        'BOARD-123',
        'admin'
      );

      expect(hasPermission).toBe(false);
    });

    it('should list pending access requests', async () => {
      await TeamHierarchyModule.createAccessRequest({
        userId: 'user-1',
        resourceId: 'BOARD-1',
        resourceType: 'board',
        requestedPermission: 'read',
        reason: 'Need access',
        status: 'pending',
        requestedAt: new Date(),
      });

      await TeamHierarchyModule.createAccessRequest({
        userId: 'user-2',
        resourceId: 'BOARD-2',
        resourceType: 'board',
        requestedPermission: 'write',
        reason: 'Need access',
        status: 'pending',
        requestedAt: new Date(),
      });

      const pending = await TeamHierarchyModule.listAccessRequests({ status: 'pending' });

      expect(pending).toHaveLength(2);
      expect(pending.every((r) => r.status === 'pending')).toBe(true);
    });

    it('should throw error when approving already reviewed request', async () => {
      const request = await TeamHierarchyModule.createAccessRequest({
        userId: 'requester',
        resourceId: 'BOARD-123',
        resourceType: 'board',
        requestedPermission: 'read',
        reason: 'Need access',
        status: 'pending',
        requestedAt: new Date(),
      });

      await TeamHierarchyModule.approveAccessRequest(request.id, 'admin', 'OK');

      await expect(
        TeamHierarchyModule.approveAccessRequest(request.id, 'admin', 'Duplicate')
      ).rejects.toThrow('Access request not found or already reviewed');
    });
  });

  describe('User Permission Scope', () => {
    let orgId: string;
    let segmentId: string;
    let departmentId: string;
    let teamId: string;

    beforeEach(async () => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const org = await TeamHierarchyModule.createOrganization({
        name: 'Org',
        description: '',
        defaultPermission: 'read',
        adminUserIds: ['org-admin'],
        memberUserIds: ['org-member'],
        settings: {
          allowCrossTeamAccess: true,
          requireApprovalForResourceAccess: false,
        },
      });
      orgId = org.id;

      const segment = await TeamHierarchyModule.createSegment({
        organizationId: org.id,
        name: 'Segment',
        description: '',
        defaultPermission: 'write',
        adminUserIds: ['seg-admin'],
        memberUserIds: ['seg-member'],
      });
      segmentId = segment.id;

      const dept = await TeamHierarchyModule.createDepartment({
        segmentId: segment.id,
        name: 'Dept',
        description: '',
        defaultPermission: 'write',
        adminUserIds: ['dept-admin'],
        memberUserIds: ['dept-member'],
      });
      departmentId = dept.id;

      const team = await TeamHierarchyModule.createTeam({
        departmentId: dept.id,
        name: 'Team',
        description: '',
        defaultPermission: 'admin',
        adminUserIds: ['team-admin'],
        memberUserIds: ['team-member'],
      });
      teamId = team.id;
    });

    it('should return complete permission scope for user', async () => {
      const scope = await TeamHierarchyModule.getUserPermissionScope('team-member');

      expect(scope.userId).toBe('team-member');
      expect(scope.organizations).toHaveLength(1);
      expect(scope.segments).toHaveLength(1);
      expect(scope.departments).toHaveLength(1);
      expect(scope.teams).toHaveLength(1);
    });

    it('should return empty scope for user not in hierarchy', async () => {
      const scope = await TeamHierarchyModule.getUserPermissionScope('external-user');

      expect(scope.organizations).toHaveLength(0);
      expect(scope.segments).toHaveLength(0);
      expect(scope.departments).toHaveLength(0);
      expect(scope.teams).toHaveLength(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      const mockData = {
        organizations: [],
        segments: [],
        departments: [],
        teams: [],
        teamMembers: [],
        resourcePermissions: [],
        accessRequests: [],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should handle empty hierarchy gracefully', async () => {
      const orgs = await TeamHierarchyModule.listOrganizations();

      expect(orgs).toHaveLength(0);
    });

    it('should handle permission check for non-existent resource', async () => {
      const result = await TeamHierarchyModule.checkPermission(
        'user-123',
        'story',
        'NONEXISTENT-RESOURCE'
      );

      expect(result.hasAccess).toBe(false);
    });

    it('should handle file system errors gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await TeamHierarchyModule.loadData(testProjectPath);

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should handle duplicate team member addition', async () => {
      const org = await TeamHierarchyModule.createOrganization({
        name: 'Org',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
        settings: {
          allowCrossTeamAccess: true,
          requireApprovalForResourceAccess: false,
        },
      });

      const segment = await TeamHierarchyModule.createSegment({
        organizationId: org.id,
        name: 'Segment',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      const dept = await TeamHierarchyModule.createDepartment({
        segmentId: segment.id,
        name: 'Dept',
        description: '',
        defaultPermission: 'read',
        adminUserIds: [],
        memberUserIds: [],
      });

      const team = await TeamHierarchyModule.createTeam({
        departmentId: dept.id,
        name: 'Team',
        description: '',
        defaultPermission: 'write',
        adminUserIds: [],
        memberUserIds: [],
      });

      await TeamHierarchyModule.addTeamMember(team.id, 'user-123', 'member');

      // Adding same user again should throw error
      await expect(
        TeamHierarchyModule.addTeamMember(team.id, 'user-123', 'member')
      ).rejects.toThrow('already a member');
    });

    it('should handle permission level comparison edge cases', async () => {
      // Test permission hierarchy: none < read < write < admin
      const org = await TeamHierarchyModule.createOrganization({
        name: 'Org',
        description: '',
        defaultPermission: 'write',
        adminUserIds: [],
        memberUserIds: ['user-123'],
        settings: {
          allowCrossTeamAccess: true,
          requireApprovalForResourceAccess: false,
        },
      });

      // User doesn't have permission on BOARD-1 without explicit assignment
      const canRead = await TeamHierarchyModule.checkPermission('user-123', 'story', 'BOARD-1');
      const canWrite = await TeamHierarchyModule.checkPermission(
        'user-123',
        'story',
        'BOARD-1'
      );
      const canAdmin = await TeamHierarchyModule.checkPermission(
        'user-123',
        'story',
        'BOARD-1'
      );

      // All should be false because user doesn't have explicit access
      expect(canRead.hasAccess).toBe(false);
      expect(canWrite.hasAccess).toBe(false);
      expect(canAdmin.hasAccess).toBe(false);
    });

    it('should handle corrupted data file', async () => {
      // Reset the data cache to force reload
      await TeamHierarchyModule.init(testProjectPath);
      mockFs.readFile.mockResolvedValue('{ invalid json }');

      // loadData should recover from corrupted JSON by initializing fresh data
      const result = await TeamHierarchyModule.loadData(testProjectPath);
      expect(result).toBeDefined();
      expect(result.organizations).toBeDefined();
      expect(Array.isArray(result.organizations)).toBe(true);
    });
  });
});
