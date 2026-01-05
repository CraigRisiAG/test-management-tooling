# Team & Organizational Hierarchy

This document describes the team and organizational hierarchy structure with granular permission controls.

## Hierarchy Overview

```
Organization (Enterprise/Company)
  ↓ segments
Segments (Business Units: Engineering, Product, Marketing)
  ↓ departments
Departments (Functional Groups: Backend, Frontend, QA, DevOps)
  ↓ teams
Teams (Working Units: Payments Team, Auth Team, Mobile Team)
  ↓ members
Team Members (Individual Contributors with roles and permissions)
```

## Permission Model

### Permission Cascade

Permissions flow down the hierarchy with the ability to override at lower levels:

```
Organization Level
  ↓ Default: Read access to all
Segment Level
  ↓ Override: Write access to segment resources
Department Level
  ↓ Override: Admin access to department resources
Team Level
  ↓ Override: Full control within team
Resource Level
  ↓ Override: Specific permissions for individual resources
```

### Permission Levels

- **none**: No access to resource
- **read**: Can view resource but not modify
- **write**: Can view and modify resource
- **admin**: Full control including permission management

## Entity Definitions

### 1. Organization

**Purpose**: Highest level - represents entire company/enterprise  
**Owner**: Executive leadership  
**Scope**: All users, all resources

**Properties**:
```typescript
{
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  segments: string[]; // Segment IDs
  settings: {
    allowCrossSegmentVisibility: boolean;
    defaultPermissionLevel: PermissionLevel;
    enableTeamIsolation: boolean;
    requireApprovalForCrossTeamAccess: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**Example**:
```json
{
  "id": "ORG-001",
  "name": "Acme Corporation",
  "description": "Global technology company",
  "status": "active",
  "segments": ["SEGMENT-001", "SEGMENT-002"],
  "settings": {
    "allowCrossSegmentVisibility": false,
    "defaultPermissionLevel": "read",
    "enableTeamIsolation": true,
    "requireApprovalForCrossTeamAccess": true
  }
}
```

### 2. Segment

**Purpose**: Business unit or division (Engineering, Product, Sales, etc.)  
**Owner**: VP/Director level  
**Scope**: Multiple departments

**Properties**:
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  departments: string[]; // Department IDs
  segmentLead: string; // User ID
  settings: {
    allowCrossDepartmentVisibility: boolean;
    defaultPermissionLevel: PermissionLevel;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:
```json
{
  "id": "SEGMENT-001",
  "organizationId": "ORG-001",
  "name": "Engineering",
  "description": "Software Engineering Division",
  "status": "active",
  "departments": ["DEPT-001", "DEPT-002", "DEPT-003"],
  "segmentLead": "USER-VP-ENG",
  "settings": {
    "allowCrossDepartmentVisibility": true,
    "defaultPermissionLevel": "read"
  }
}
```

### 3. Department

**Purpose**: Functional group (Backend, Frontend, QA, DevOps, Mobile, etc.)  
**Owner**: Engineering Manager / Department Head  
**Scope**: Multiple teams with related functions

**Properties**:
```typescript
{
  id: string;
  segmentId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  teams: string[]; // Team IDs
  departmentHead: string; // User ID
  settings: {
    allowCrossTeamVisibility: boolean;
    defaultPermissionLevel: PermissionLevel;
    requireCodeReview: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:
```json
{
  "id": "DEPT-001",
  "segmentId": "SEGMENT-001",
  "name": "Backend Engineering",
  "description": "Server-side development teams",
  "status": "active",
  "teams": ["TEAM-001", "TEAM-002"],
  "departmentHead": "USER-EM-001",
  "settings": {
    "allowCrossTeamVisibility": true,
    "defaultPermissionLevel": "read",
    "requireCodeReview": true
  }
}
```

### 4. Team

**Purpose**: Smallest working unit focused on specific product/feature area  
**Owner**: Tech Lead / Team Lead  
**Scope**: Group of engineers working together

**Properties**:
```typescript
{
  id: string;
  departmentId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  teamLead: string; // User ID
  members: string[]; // User IDs
  boards: string[]; // Board IDs owned by team
  repositories: string[]; // Repository IDs owned by team
  settings: {
    defaultPermissionLevel: PermissionLevel;
    allowExternalContributors: boolean;
    requireApprovalForNewMembers: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:
```json
{
  "id": "TEAM-001",
  "departmentId": "DEPT-001",
  "name": "Payments Team",
  "description": "Payment processing and billing systems",
  "status": "active",
  "teamLead": "USER-TL-001",
  "members": ["USER-001", "USER-002", "USER-003"],
  "boards": ["BOARD-001"],
  "repositories": ["REPO-PAYMENTS-API", "REPO-BILLING-SERVICE"],
  "settings": {
    "defaultPermissionLevel": "write",
    "allowExternalContributors": false,
    "requireApprovalForNewMembers": true
  }
}
```

### 5. Team Member

**Purpose**: Individual contributor with specific role and permissions  
**Roles**: member, lead, admin

**Properties**:
```typescript
{
  id: string;
  userId: string;
  teamId: string;
  role: 'member' | 'lead' | 'admin';
  permissions: {
    canCreateStories: boolean;
    canCreateEpics: boolean;
    canCreateFeatures: boolean;
    canAssignWork: boolean;
    canManageBoard: boolean;
    canManageRepositories: boolean;
    canInviteMembers: boolean;
    canViewAllTeamWork: boolean;
    canEditAllTeamWork: boolean;
  };
  joinedAt: Date;
  status: 'active' | 'inactive' | 'pending';
}
```

**Permission by Role**:

| Permission | Member | Lead | Admin |
|------------|--------|------|-------|
| Create Stories | ✅ | ✅ | ✅ |
| Create Epics | ❌ | ✅ | ✅ |
| Create Features | ❌ | ❌ | ✅ |
| Assign Work | ❌ | ✅ | ✅ |
| Manage Board | ❌ | ✅ | ✅ |
| Manage Repositories | ❌ | ❌ | ✅ |
| Invite Members | ❌ | ❌ | ✅ |
| View All Team Work | ✅ | ✅ | ✅ |
| Edit All Team Work | ❌ | ✅ | ✅ |

### 6. Resource Permission

**Purpose**: Granular permission for specific resources (stories, epics, etc.)  
**Override**: Can override team/department/segment permissions

**Properties**:
```typescript
{
  id: string;
  resourceType: ResourceType; // 'story', 'epic', 'feature', etc.
  resourceId: string;
  userId: string;
  permissionLevel: PermissionLevel;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  reason?: string;
}
```

**Example**:
```json
{
  "id": "PERM-001",
  "resourceType": "epic",
  "resourceId": "EPIC-001",
  "userId": "USER-EXTERNAL-001",
  "permissionLevel": "write",
  "grantedBy": "USER-TL-001",
  "grantedAt": "2026-01-05T10:00:00Z",
  "expiresAt": "2026-02-05T10:00:00Z",
  "reason": "External consultant needs access for Q1 project"
}
```

### 7. Access Request

**Purpose**: Allow users to request access to teams or resources  
**Workflow**: Request → Review → Approve/Reject

**Properties**:
```typescript
{
  id: string;
  requesterId: string;
  requesterName: string;
  requestType: 'team' | 'department' | 'segment' | 'resource';
  targetId: string;
  targetName: string;
  requestedPermission: PermissionLevel;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approver?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  expiresAt?: Date;
}
```

## Permission Check Algorithm

When checking if a user has access to a resource:

```
1. Check Resource Permission (Highest Priority)
   └─ If found and valid → Return permission level
   
2. Check Team Membership
   └─ If user is team member → Return team permission level
   
3. Check Department Settings
   └─ If allowCrossTeamVisibility → Return department default
   
4. Check Segment Settings
   └─ If allowCrossDepartmentVisibility → Return segment default
   
5. Check Organization Settings
   └─ If allowCrossSegmentVisibility → Return org default
   
6. No Access
   └─ Return 'none'
```

## Use Cases

### Use Case 1: User Views Only Their Team Work

**Setup**:
- Organization: `enableTeamIsolation: true`
- Team: `defaultPermissionLevel: 'write'`

**Result**:
- User can only see and edit work from their team
- Cannot see other teams in department

### Use Case 2: Department Visibility

**Setup**:
- Department: `allowCrossTeamVisibility: true`
- Department: `defaultPermissionLevel: 'read'`

**Result**:
- User can see all teams in their department
- Can only edit work from their own team

### Use Case 3: Cross-Department Collaboration

**Setup**:
- User A: Team Payments (Backend Department)
- User B: Team Mobile (Mobile Department)
- Grant resource permission: User B → Epic-Payments-001 (write)

**Result**:
- User B can collaborate on specific payment epic
- Does not have access to other payment team work

### Use Case 4: External Consultant

**Setup**:
- Consultant: Not a team member
- Grant resource permission with expiry date
- Permission level: 'write'

**Result**:
- Consultant has temporary write access to specific resources
- Access automatically expires after date
- Does not see other team resources

### Use Case 5: Access Request Workflow

**Scenario**: Developer needs access to another team's epic

**Steps**:
1. Developer creates access request
2. Target team lead receives notification
3. Team lead approves request
4. System automatically grants resource permission
5. Developer can now collaborate

## API Methods

### TeamHierarchyModule

#### Organization Operations
```typescript
createOrganization(data) → Organization
getOrganization(id) → Organization | null
listOrganizations(filter?) → Organization[]
updateOrganization(id, updates) → Organization
```

#### Segment Operations
```typescript
createSegment(data) → Segment
getSegment(id) → Segment | null
listSegments(filter?) → Segment[]
```

#### Department Operations
```typescript
createDepartment(data) → Department
getDepartment(id) → Department | null
listDepartments(filter?) → Department[]
```

#### Team Operations
```typescript
createTeam(data) → Team
getTeam(id) → Team | null
listTeams(filter?) → Team[]
addTeamMember(teamId, userId, role?) → TeamMember
removeTeamMember(teamId, userId) → void
getTeamMembers(teamId) → TeamMember[]
getUserTeams(userId) → Team[]
```

#### Permission Operations
```typescript
grantResourcePermission(resourceType, resourceId, userId, level, grantedBy, reason?, expiresAt?) → ResourcePermission
revokeResourcePermission(permissionId) → void
checkPermission(userId, resourceType, resourceId) → PermissionCheckResult
getUserPermissionScope(userId) → PermissionScope
```

#### Access Request Operations
```typescript
createAccessRequest(data) → AccessRequest
approveAccessRequest(requestId, approverId) → AccessRequest
rejectAccessRequest(requestId, approverId, reason) → AccessRequest
listAccessRequests(filter?) → AccessRequest[]
```

#### Hierarchy View
```typescript
getOrganizationalView(userId) → OrganizationalHierarchyView
```

## Usage Examples

### Creating Complete Hierarchy

```typescript
// 1. Create Organization
const org = await TeamHierarchyModule.createOrganization({
  name: 'Acme Corporation',
  description: 'Global technology company',
  status: 'active',
  segments: [],
  settings: {
    allowCrossSegmentVisibility: false,
    defaultPermissionLevel: 'read',
    enableTeamIsolation: true,
    requireApprovalForCrossTeamAccess: true,
  },
  createdBy: 'SYSTEM',
});

// 2. Create Segment
const engineeringSegment = await TeamHierarchyModule.createSegment({
  organizationId: org.id,
  name: 'Engineering',
  description: 'Software Engineering Division',
  status: 'active',
  departments: [],
  segmentLead: 'USER-VP-001',
  settings: {
    allowCrossDepartmentVisibility: true,
    defaultPermissionLevel: 'read',
  },
});

// 3. Create Department
const backendDept = await TeamHierarchyModule.createDepartment({
  segmentId: engineeringSegment.id,
  name: 'Backend Engineering',
  description: 'Server-side development',
  status: 'active',
  teams: [],
  departmentHead: 'USER-EM-001',
  settings: {
    allowCrossTeamVisibility: true,
    defaultPermissionLevel: 'read',
    requireCodeReview: true,
  },
});

// 4. Create Team
const paymentsTeam = await TeamHierarchyModule.createTeam({
  departmentId: backendDept.id,
  name: 'Payments Team',
  description: 'Payment processing systems',
  status: 'active',
  teamLead: 'USER-TL-001',
  members: [],
  boards: [],
  repositories: [],
  settings: {
    defaultPermissionLevel: 'write',
    allowExternalContributors: false,
    requireApprovalForNewMembers: true,
  },
});

// 5. Add Team Members
await TeamHierarchyModule.addTeamMember(paymentsTeam.id, 'USER-001', 'member');
await TeamHierarchyModule.addTeamMember(paymentsTeam.id, 'USER-002', 'member');
await TeamHierarchyModule.addTeamMember(paymentsTeam.id, 'USER-TL-001', 'lead');
```

### Checking Permissions

```typescript
// Check if user has access to a story
const result = await TeamHierarchyModule.checkPermission(
  'USER-001',
  'story',
  'STORY-123'
);

if (result.hasAccess) {
  console.log(`User has ${result.permissionLevel} access via ${result.source}`);
} else {
  console.log(`Access denied: ${result.reason}`);
}
```

### Granting Resource Permission

```typescript
// Grant external consultant access to specific epic
await TeamHierarchyModule.grantResourcePermission(
  'epic',
  'EPIC-PAYMENTS-001',
  'USER-CONSULTANT-001',
  'write',
  'USER-TL-001',
  'External consultant for payment modernization project',
  new Date('2026-03-01') // Expires in 2 months
);
```

### Access Request Workflow

```typescript
// 1. User requests access
const request = await TeamHierarchyModule.createAccessRequest({
  requesterId: 'USER-002',
  requesterName: 'Jane Developer',
  requestType: 'team',
  targetId: 'TEAM-MOBILE-001',
  targetName: 'Mobile Team',
  requestedPermission: 'read',
  reason: 'Need to coordinate on mobile payment integration',
  status: 'pending',
});

// 2. Team lead approves
await TeamHierarchyModule.approveAccessRequest(
  request.id,
  'USER-TL-MOBILE-001'
);

// 3. User now has access
const access = await TeamHierarchyModule.checkPermission(
  'USER-002',
  'story',
  'STORY-MOBILE-123'
);
console.log(access.hasAccess); // true
```

### Getting User's Organizational View

```typescript
const view = await TeamHierarchyModule.getOrganizationalView('USER-001');

console.log('Organization:', view.organization?.name);
console.log('Segments:', view.segments.map(s => s.name));
console.log('Departments:', view.departments.map(d => d.name));
console.log('Teams:', view.teams.map(t => t.name));

// Check user's role in each team
view.teams.forEach(team => {
  const role = view.userTeamRoles.get(team.id);
  console.log(`${team.name}: ${role}`);
});
```

### Getting User's Complete Permission Scope

```typescript
const scope = await TeamHierarchyModule.getUserPermissionScope('USER-001');

console.log('Organization Access:', scope.organizationAccess);
console.log('Segment Access:', scope.segmentAccess);
console.log('Department Access:', scope.departmentAccess);
console.log('Team Access:', scope.teamAccess);
console.log('Resource Permissions:', scope.resourcePermissions);
```

## DynamoDB Storage

All entities stored in single table with patterns:

### Primary Key Patterns:
- Organization: `PK=ORGANIZATION#{id}`, `SK=METADATA`
- Segment: `PK=SEGMENT#{id}`, `SK=METADATA`
- Department: `PK=DEPARTMENT#{id}`, `SK=METADATA`
- Team: `PK=TEAM#{id}`, `SK=METADATA`
- TeamMember: `PK=TEAM_MEMBER#{id}`, `SK=METADATA`
- ResourcePermission: `PK=RESOURCE_PERMISSION#{id}`, `SK=METADATA`
- AccessRequest: `PK=ACCESS_REQUEST#{id}`, `SK=METADATA`

### Query Patterns:
- List all teams: Query on TypeIndex with `GSI1PK=TEAM`
- List team members: Query with filter `teamId = :teamId`
- List user teams: Query with filter `userId = :userId`
- List user permissions: Query with filter `userId = :userId`

## Security Best Practices

1. **Principle of Least Privilege**: Start with minimal permissions
2. **Regular Audits**: Review and expire old permissions
3. **Access Request Workflow**: Require approval for cross-team access
4. **Time-Limited Access**: Set expiry dates for external access
5. **Team Isolation**: Enable for sensitive projects
6. **Audit Logging**: Track all permission changes

## Integration with Agile Hierarchy

Team hierarchy integrates with agile hierarchy:

```
Team → owns → Boards → contain → Epics/Stories
Story.assignee → must be → Team Member
Epic.owner → typically → Team Lead
Feature.owner → typically → Department Head
Goal.owner → typically → Segment Lead
```

### Example Integration:

```typescript
// Create story and assign to team member
const story = await AgileModule.createStory({
  // ... story data
  assignee: 'USER-001', // Must be team member
  boardId: 'BOARD-001' // Must be owned by user's team
});

// Check if user can edit this story
const canEdit = await TeamHierarchyModule.checkPermission(
  'USER-002',
  'story',
  story.id
);

if (!canEdit.hasAccess) {
  throw new Error('User does not have permission to edit this story');
}
```

## Benefits

✅ **Granular Control**: Individual-level permissions  
✅ **Team Isolation**: Teams work independently  
✅ **Cross-Team Collaboration**: Controlled via access requests  
✅ **Scalable**: Supports organizations of any size  
✅ **Flexible**: Override permissions at any level  
✅ **Secure**: Approval workflows for sensitive access  
✅ **Auditable**: Track all permission changes  
✅ **Time-Limited**: Expire external access automatically  

## Next Steps

1. Implement UI for team/org management
2. Add notification system for access requests
3. Build permission audit dashboard
4. Integrate with agile board visibility
5. Add bulk permission management
6. Implement permission inheritance visualization
