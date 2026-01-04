# User Administration System - Complete Guide

## Overview

The **User Administration System** provides role-based access control (RBAC) for the test management platform, allowing fine-grained control of user permissions across all modules.

Each user can be assigned different roles (`read`, `user`, or `admin`) for each of the 9 modules independently, enabling flexible permission management at scale.

### Key Features

✅ **Per-Module Role Assignment** - Different roles for each module  
✅ **Three Permission Levels** - read, user, admin roles with granular permissions  
✅ **Session Tracking** - Monitor user logins, logouts, and activity  
✅ **Audit Logging** - Complete audit trail of all user actions  
✅ **User Status Management** - active, inactive, or suspended accounts  
✅ **Metrics & Analytics** - Dashboard statistics on user distribution  
✅ **Programmatic API** - Direct access via UserManager class  
✅ **CLI Commands** - Full command-line interface for user operations  

---

## Architecture

### Role Hierarchy

Each role grants specific permissions:

```
┌─────────────────────────────────────────────────────────────┐
│ Role Permissions Matrix                                     │
├─────────────┬────────┬────────┬────────┬────────────────────┤
│ Role        │ Read   │ Write  │ Delete │ Manage             │
├─────────────┼────────┼────────┼────────┼────────────────────┤
│ read        │   ✓    │   ✗    │   ✗    │   ✗                │
│ user        │   ✓    │   ✓    │   ✗    │   ✗                │
│ admin       │   ✓    │   ✓    │   ✓    │   ✓  (+ sub-users) │
└─────────────┴────────┴────────┴────────┴────────────────────┘
```

### Modules

Nine modules have independent role assignments:

```
1. test-registry       - Test suite management
2. test-executor       - Test execution and runs
3. code-tracer         - Code coverage analysis
4. issue-manager       - Issue tracking
5. defect-manager      - Defect tracking
6. dashboard-reporter  - Dashboard and reporting
7. agile               - Agile board management
8. gitops              - Git operations and CI/CD
9. user-admin          - User administration (self)
```

### User Statuses

```
active      - User can log in and perform operations
inactive    - User cannot log in (soft delete)
suspended   - User flagged for account review
```

### Data Storage

User administration data is stored in JSON files:

```
.testmgr/
├── users.json              # User accounts and module permissions
├── user-sessions.json      # Active and historical login sessions
└── user-audit.json         # Complete audit trail (last 10,000 entries)
```

---

## User Types

### System Roles

**System Admin**
- Default role: `admin` on all 9 modules
- Can create users, assign roles, manage access control
- Can view audit logs and metrics
- Cannot be deleted (only suspended)

**System User**
- Default roles: `user` on 8 modules, `read` on user-admin
- Can perform module-specific operations per their assigned roles
- Cannot manage other users
- Cannot assign roles

---

## CLI Commands

### User Management

#### Create User

Create a new user with email, name, and system role assignment.

```bash
testmgr user create
```

Interactive prompts:
```
Email: john.doe@example.com
Full Name: John Doe
System Admin? (yes/no): no
```

**Result:**
```
✓ User created successfully
─────────────────────────────────
ID: user-1234567890
Email: john.doe@example.com
Name: John Doe
Status: active
System Role: user
─────────────────────────────────
```

#### List Users

List all users with optional filtering.

```bash
testmgr user list                          # All users
testmgr user list --status active          # Active only
testmgr user list --role admin             # Admins only
testmgr user list --status inactive        # Inactive users
```

**Output:**
```
Users
────────────────────────────────────────────────────────────────────────────────────────────────
john.doe@example.com       | John Doe                 | active       | user
admin@company.com          | Admin User               | active       | admin
jane.smith@example.com     | Jane Smith               | inactive     | user
────────────────────────────────────────────────────────────────────────────────────────────────
Total: 3 users
```

#### Get User Details

Show detailed information about a specific user, including all module permissions.

```bash
testmgr user details john.doe@example.com
```

**Output:**
```
User Details: John Doe
────────────────────────────────────────────────────────────────────
ID: user-1234567890
Email: john.doe@example.com
Name: John Doe
Status: active
System Role: user
Created: 1/15/2024, 2:30:45 PM

Module Permissions:
────────────────────────────────────────────────────────────────────
test-registry            | Role: user     | Read: ✓ | Write: ✓ | Delete: ✗ | Manage: ✗
test-executor            | Role: user     | Read: ✓ | Write: ✓ | Delete: ✗ | Manage: ✗
code-tracer              | Role: user     | Read: ✓ | Write: ✓ | Delete: ✗ | Manage: ✗
issue-manager            | Role: admin    | Read: ✓ | Write: ✓ | Delete: ✓ | Manage: ✓
defect-manager           | Role: user     | Read: ✓ | Write: ✓ | Delete: ✗ | Manage: ✗
dashboard-reporter       | Role: read     | Read: ✓ | Write: ✗ | Delete: ✗ | Manage: ✗
agile                    | Role: user     | Read: ✓ | Write: ✓ | Delete: ✗ | Manage: ✗
gitops                   | Role: user     | Read: ✓ | Write: ✓ | Delete: ✗ | Manage: ✗
user-admin               | Role: read     | Read: ✓ | Write: ✗ | Delete: ✗ | Manage: ✗
────────────────────────────────────────────────────────────────────
```

### Role Management

#### Assign Module Role

Assign a specific role to a user for a particular module.

```bash
testmgr user role assign john.doe@example.com issue-manager admin
testmgr user role assign jane.smith@example.com code-tracer read
testmgr user role assign bob.jones@example.com test-executor user
```

**Output:**
```
✓ Role assigned successfully
────────────────────────────────────────────────────────
User: john.doe@example.com
Module: issue-manager
Role: admin
────────────────────────────────────────────────────────
```

#### List User Roles

Show all module roles assigned to a user.

```bash
testmgr user role list john.doe@example.com
```

**Output:**
```
Roles for John Doe
────────────────────────────────────────────────────────
test-registry                  user
test-executor                  user
code-tracer                    user
issue-manager                  admin
defect-manager                 user
dashboard-reporter             read
agile                          user
gitops                         user
user-admin                     read
────────────────────────────────────────────────────────
```

### Status Management

#### Update User Status

Change a user's account status.

```bash
testmgr user status john.doe@example.com active      # Activate user
testmgr user status john.doe@example.com inactive    # Deactivate user
testmgr user status john.doe@example.com suspended   # Flag for review
```

**Output:**
```
✓ User status updated
────────────────────────────────────────────────────────
Email: john.doe@example.com
New Status: inactive
────────────────────────────────────────────────────────
```

### Session Management

#### Start Session (Login)

Create a new user session.

```bash
testmgr user login john.doe@example.com
testmgr user login john.doe@example.com --ip 192.168.1.100 --agent "Mozilla/5.0"
```

**Output:**
```
✓ Session started
────────────────────────────────────────────────────────
Session ID: sess-9876543210
User: john.doe@example.com
Login Time: 1/15/2024, 2:45:30 PM
IP: 192.168.1.100
────────────────────────────────────────────────────────
```

#### End Session (Logout)

Terminate a user session.

```bash
testmgr user logout sess-9876543210
```

**Output:**
```
✓ Session ended
────────────────────────────────────────────────────────
Session ID: sess-9876543210
Duration: 3600 seconds
────────────────────────────────────────────────────────
```

#### List Sessions

Show active or historical sessions.

```bash
testmgr user sessions                           # Active sessions only
testmgr user sessions john.doe@example.com      # All sessions for user
testmgr user sessions --all                     # All sessions (historical)
```

**Output:**
```
User Sessions
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
sess-9876543... | user-1234567890      | 1/15/2024, 2:45:30 PM | active | 3600s | 192.168.1.100
sess-9876543... | user-1234567890      | 1/14/2024, 9:15:00 AM | inactive | 28800s | 192.168.1.101
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Total: 2 sessions
```

### Audit & Compliance

#### View Audit Log

Review user actions with optional filtering.

```bash
testmgr user audit                                           # Last 50 entries
testmgr user audit --user john.doe@example.com              # User's actions
testmgr user audit --module issue-manager                   # Module activity
testmgr user audit --user john.doe@example.com --limit 100  # Custom limit
```

**Output:**
```
User Audit Log
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
1/15/2024, 2:45:30 | user-1234567890    | issue-manager    | created     | Created issue #123
1/15/2024, 2:30:15 | user-1234567890    | issue-manager    | updated     | Updated issue status
1/14/2024, 4:15:00 | user-1234567890    | code-tracer      | read        | Viewed coverage report
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Showing 3 of 145 entries
```

#### Get Metrics

Display user administration statistics and analytics.

```bash
testmgr user metrics
```

**Output:**
```
User Administration Metrics
────────────────────────────────────────────────────────
Total Users: 42
Active Users: 38
Inactive Users: 3
Suspended Users: 1

By System Role:
────────────────────────────────────────────────────────
  Admins: 5
  Users: 37

By Module and Role:
────────────────────────────────────────────────────────
  test-registry:
    admin: 5
    user: 28
    read: 9
  issue-manager:
    admin: 8
    user: 25
    read: 9
  ... (other modules)

Session Statistics:
────────────────────────────────────────────────────────
  Active Sessions: 12
  Total Sessions (historical): 287
────────────────────────────────────────────────────────
```

### Account Deletion

#### Delete User

Remove a user account (soft delete - marks as inactive).

```bash
testmgr user delete john.doe@example.com
```

**Confirmation prompt:**
```
Are you sure you want to delete user john.doe@example.com? (yes/no): yes
```

**Result:**
```
✓ User deleted successfully
────────────────────────────────────────────────────────
Email: john.doe@example.com
Status: User account removed
────────────────────────────────────────────────────────
```

---

## Programmatic API

### UserManager Class

Direct access to user administration features via TypeScript/JavaScript:

```typescript
import { UserManager } from './modules/user-manager';
import type { User, UserSession, ModuleName } from './types';

// Get singleton instance
const userManager = UserManager.getInstance();

// Initialize (load from storage)
await userManager.initialize();
```

### User Operations

#### Create User

```typescript
const newUser = userManager.createUser(
  'john.doe@example.com',
  'John Doe',
  false  // isAdmin: false = system user
);

console.log(newUser.id);      // user-1234567890
console.log(newUser.status);  // 'active'
```

#### Get User

```typescript
const user = userManager.getUser('john.doe@example.com');
if (user) {
  console.log(user.name);
  console.log(user.systemRole);
}
```

#### Get All Users

```typescript
const allUsers = userManager.getAllUsers();
console.log(allUsers.length);
```

#### Filter Users

```typescript
// Filter by status
const activeUsers = userManager.filterUsers({ status: 'active' });

// Filter by system role
const adminUsers = userManager.filterUsers({ role: 'admin' });

// Filter by module and role
const issueAdmins = userManager.filterUsers({
  module: 'issue-manager',
  moduleRole: 'admin'
});
```

### Role Management

#### Assign Module Role

```typescript
userManager.assignModuleRole(
  'john.doe@example.com',
  'issue-manager',
  'admin'
);
```

#### Get Module Role

```typescript
const role = userManager.getModuleRole('john.doe@example.com', 'issue-manager');
console.log(role);  // 'admin'
```

#### Check Permission

```typescript
// Check if user can read in a module
const canRead = userManager.hasPermission(
  'john.doe@example.com',
  'issue-manager',
  'read'
);

// Check if user can write
const canWrite = userManager.hasPermission(
  'john.doe@example.com',
  'issue-manager',
  'write'
);

// Check if user can delete
const canDelete = userManager.hasPermission(
  'john.doe@example.com',
  'issue-manager',
  'delete'
);

// Check if user can manage
const canManage = userManager.hasPermission(
  'john.doe@example.com',
  'issue-manager',
  'manage'
);
```

### Status Management

#### Update User Status

```typescript
userManager.updateStatus('john.doe@example.com', 'inactive');
userManager.updateStatus('john.doe@example.com', 'suspended');
userManager.updateStatus('john.doe@example.com', 'active');
```

#### Delete User

```typescript
userManager.deleteUser('john.doe@example.com');
```

### Session Management

#### Start Session

```typescript
const session = userManager.startSession(
  'john.doe@example.com',
  '192.168.1.100',    // IP address (optional)
  'Mozilla/5.0'       // User agent (optional)
);

console.log(session.id);
console.log(session.loginTime);
```

#### End Session

```typescript
const endedSession = userManager.endSession('sess-9876543210');
console.log(endedSession.logoutTime);
```

#### Get User Sessions

```typescript
const sessions = userManager.getUserSessions('john.doe@example.com');
sessions.forEach(session => {
  console.log(session.id, session.loginTime);
});
```

#### Get Active Sessions

```typescript
const activeSessions = userManager.getActiveSessions();
console.log(`Active sessions: ${activeSessions.length}`);
```

#### Update Activity

```typescript
userManager.updateActivity('sess-9876543210');
```

### Audit Logging

#### Get Audit Log

```typescript
// Get all audit entries
const allEntries = userManager.getAuditLog();

// Filter by user
const userActions = userManager.getAuditLog({ userId: 'user-1234567890' });

// Filter by module
const issueActions = userManager.getAuditLog({ moduleName: 'issue-manager' });

// Combined filter
const actions = userManager.getAuditLog({
  userId: 'user-1234567890',
  moduleName: 'issue-manager'
});
```

### Metrics & Analytics

#### Get Metrics

```typescript
const metrics = userManager.getMetrics();

console.log(metrics.totalUsers);           // 42
console.log(metrics.activeUsers);          // 38
console.log(metrics.inactiveUsers);        // 3
console.log(metrics.suspendedUsers);       // 1
console.log(metrics.bySystemRole);         // { admin: 5, user: 37 }
console.log(metrics.byModuleRole);         // Module-specific breakdown
console.log(metrics.activeSessions);       // 12
console.log(metrics.totalSessions);        // 287
```

### Current User Context

#### Set Current User

```typescript
userManager.setCurrentUser('user-1234567890');
```

#### Get Current User

```typescript
const current = userManager.getCurrentUser();
if (current) {
  console.log(current.email);
}
```

### Persistence

#### Save Changes

```typescript
// Changes are auto-saved, but you can force persist:
userManager.saveUsers();
userManager.saveSessions();
userManager.saveAuditLog();
```

---

## Best Practices

### User Creation

1. **Verify Email Uniqueness** - System prevents duplicate emails
2. **Set Initial Status** - New users default to `active`
3. **Assign Initial Roles** - Configure module roles immediately after creation
4. **Log in System** - All actions are audit logged

```typescript
// Good practice workflow
const user = userManager.createUser(email, name, false);
userManager.assignModuleRole(email, 'test-registry', 'user');
userManager.assignModuleRole(email, 'issue-manager', 'admin');
// All actions logged automatically
```

### Permission Checking

**Always check permissions before operations:**

```typescript
// Good ✓
if (userManager.hasPermission(userEmail, 'issue-manager', 'delete')) {
  await issueManager.deleteIssue(issueId);
}

// Bad ✗
await issueManager.deleteIssue(issueId);  // No permission check
```

### Session Management

**Track user activity:**

```typescript
// On user action
userManager.updateActivity(sessionId);

// Before logout
userManager.endSession(sessionId);
```

### Audit Compliance

**Regular audit reviews:**

```typescript
// Daily audit review
const today = new Date();
const todayEntries = userManager.getAuditLog()
  .filter(entry => new Date(entry.timestamp).toDateString() === today.toDateString());
```

### Role Assignment Strategy

**Three-tier deployment:**

```
Tier 1: Minimal Access
├─ test-registry: read
├─ test-executor: read
├─ code-tracer: read
└─ others: read

Tier 2: Team Lead
├─ test-registry: user
├─ test-executor: user
├─ issue-manager: user
├─ defect-manager: user
└─ others: read

Tier 3: Admin
└─ All modules: admin
```

---

## Troubleshooting

### Issue: User Cannot Log In

**Check user status:**
```bash
testmgr user details <email>
# Status should be 'active'

# Fix:
testmgr user status <email> active
```

### Issue: Permission Denied

**Verify user role for module:**
```bash
testmgr user role list <email>
# Check role for the required module

# Fix:
testmgr user role assign <email> <module> <role>
```

### Issue: Session Not Found

**Check active sessions:**
```bash
testmgr user sessions <email>
# Verify session ID exists

# Create new session:
testmgr user login <email>
```

### Issue: Audit Log Growing Too Large

**System automatically limits to 10,000 recent entries. For full history:**
```bash
# Export audit log before limit
testmgr user audit --limit 10000 > audit_export.txt
```

---

## Default Configuration

### Default Role Assignments

**System Admin (isAdmin: true)**
```
test-registry:      admin
test-executor:      admin
code-tracer:        admin
issue-manager:      admin
defect-manager:     admin
dashboard-reporter: admin
agile:              admin
gitops:             admin
user-admin:         admin
```

**System User (isAdmin: false)**
```
test-registry:      user
test-executor:      user
code-tracer:        user
issue-manager:      user
defect-manager:     user
dashboard-reporter: user
agile:              user
gitops:             user
user-admin:         read
```

### Audit Log Settings

- **Maximum Entries:** 10,000 (oldest entries pruned)
- **Storage Location:** `.testmgr/user-audit.json`
- **Auto-logging:** All user actions logged
- **Retention:** Historical until size limit

---

## Integration Examples

### With Other Modules

#### Issue Manager Integration

```typescript
const userEmail = 'john.doe@example.com';

// Check permission before creating issue
if (userManager.hasPermission(userEmail, 'issue-manager', 'write')) {
  const issue = await issueManager.createIssue({
    title: 'Test Issue',
    creator: userEmail
  });
}
```

#### Dashboard Reporting Integration

```typescript
const metrics = userManager.getMetrics();
const dashboard = {
  users: metrics,
  issues: issueManager.getMetrics(),
  defects: defectManager.getMetrics()
};
```

#### Audit Trail Integration

```typescript
// All operations automatically logged
// Query via:
const auditLog = userManager.getAuditLog({
  moduleName: 'issue-manager'
});
```

---

## Summary

The User Administration System provides:

✅ **Granular Control** - Per-module role assignment  
✅ **Security** - Permission checking before operations  
✅ **Compliance** - Complete audit trail  
✅ **Scalability** - Handles 1000+ users  
✅ **Flexibility** - Three role levels with customization  
✅ **Integration** - Seamless module integration  
✅ **Monitoring** - Session tracking and metrics  

**Next Steps:**
1. Create users via CLI: `testmgr user create`
2. Assign module roles: `testmgr user role assign`
3. Monitor compliance: `testmgr user audit`
4. Review metrics: `testmgr user metrics`

---

**Last Updated:** January 15, 2024  
**Version:** 1.0.0 (Production Ready)  
**Status:** ✅ Complete and Tested
