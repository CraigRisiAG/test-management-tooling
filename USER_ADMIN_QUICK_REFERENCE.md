# User Administration - Quick Reference

## Quick Start (5 minutes)

### Create First Admin

```bash
testmgr user create
# Email: admin@company.com
# Full Name: Admin User
# System Admin? (yes/no): yes
```

### Create Team Member

```bash
testmgr user create
# Email: john@company.com
# Full Name: John Doe
# System Admin? (yes/no): no
```

### Assign Module Roles

```bash
# John gets admin on issue tracking
testmgr user role assign john@company.com issue-manager admin

# John gets read-only on code coverage
testmgr user role assign john@company.com code-tracer read
```

### View User Permissions

```bash
testmgr user details john@company.com
testmgr user role list john@company.com
```

---

## Command Reference

### User CRUD

| Command | Purpose | Example |
|---------|---------|---------|
| `user create` | Create new user | `testmgr user create` |
| `user list` | List all users | `testmgr user list` |
| `user details <email>` | Show user info | `testmgr user details john@company.com` |
| `user delete <email>` | Delete user | `testmgr user delete john@company.com` |

### Role Management

| Command | Purpose | Example |
|---------|---------|---------|
| `user role assign <email> <module> <role>` | Set role | `testmgr user role assign john@company.com issue-manager admin` |
| `user role list <email>` | Show all roles | `testmgr user role list john@company.com` |

### Status

| Command | Purpose | Example |
|---------|---------|---------|
| `user status <email> <status>` | Change status | `testmgr user status john@company.com inactive` |

### Sessions

| Command | Purpose | Example |
|---------|---------|---------|
| `user login <email>` | Start session | `testmgr user login john@company.com` |
| `user logout <sessionId>` | End session | `testmgr user logout sess-xyz` |
| `user sessions [email]` | List sessions | `testmgr user sessions` |

### Audit & Metrics

| Command | Purpose | Example |
|---------|---------|---------|
| `user audit` | View audit log | `testmgr user audit --limit 50` |
| `user metrics` | Show statistics | `testmgr user metrics` |

---

## Role Matrix

### What Each Role Can Do

```
┌──────────┬──────┬───────┬────────┬────────┐
│ Role     │ Read │ Write │ Delete │ Manage │
├──────────┼──────┼───────┼────────┼────────┤
│ read     │  ✓   │   ✗   │   ✗    │   ✗    │
│ user     │  ✓   │   ✓   │   ✗    │   ✗    │
│ admin    │  ✓   │   ✓   │   ✓    │   ✓    │
└──────────┴──────┴───────┴────────┴────────┘
```

---

## Modules

```
9 modules with independent role assignment:

1. test-registry       - Test suite management
2. test-executor       - Test execution
3. code-tracer         - Coverage analysis
4. issue-manager       - Issue tracking
5. defect-manager      - Defect tracking
6. dashboard-reporter  - Dashboards
7. agile               - Agile boards
8. gitops              - Git operations
9. user-admin          - User administration
```

---

## Common Scenarios

### Create Team Admin for Issue Manager

```bash
# 1. Create user
testmgr user create
# Email: alice@company.com
# Full Name: Alice Smith
# System Admin? (yes/no): no

# 2. Make admin of issue-manager
testmgr user role assign alice@company.com issue-manager admin

# 3. Verify
testmgr user details alice@company.com
```

### Set Up Read-Only Viewer

```bash
# 1. Create user
testmgr user create
# Email: viewer@company.com
# Full Name: Viewer User
# System Admin? (yes/no): no

# 2. Set read-only on all modules
testmgr user role assign viewer@company.com test-registry read
testmgr user role assign viewer@company.com test-executor read
testmgr user role assign viewer@company.com code-tracer read
testmgr user role assign viewer@company.com issue-manager read
testmgr user role assign viewer@company.com defect-manager read
testmgr user role assign viewer@company.com dashboard-reporter read
testmgr user role assign viewer@company.com agile read
testmgr user role assign viewer@company.com gitops read

# 3. Verify all set to read
testmgr user role list viewer@company.com
```

### Deactivate User (Soft Delete)

```bash
# Mark as inactive (user cannot login)
testmgr user status john@company.com inactive

# Re-activate if needed
testmgr user status john@company.com active
```

### Review User Activity

```bash
# View all actions by specific user
testmgr user audit --user john@company.com

# View activity in specific module
testmgr user audit --module issue-manager

# View last 100 actions
testmgr user audit --limit 100
```

### Check System Usage

```bash
# Get user and session metrics
testmgr user metrics

# Shows:
# - Total users, active, inactive, suspended
# - Distribution by role
# - Per-module role breakdown
# - Active and total sessions
```

---

## Filtering Options

### List Users Filter

```bash
testmgr user list --status active          # Active users only
testmgr user list --status inactive        # Inactive users
testmgr user list --status suspended       # Suspended users
testmgr user list --role admin             # Admins only
testmgr user list --role user              # Regular users
```

### Audit Log Filter

```bash
testmgr user audit                         # Last 50 entries
testmgr user audit --limit 100             # Last 100 entries
testmgr user audit --user john@company.com # User's actions
testmgr user audit --module issue-manager  # Module activity
```

---

## Status Values

| Status | Meaning | Can Login |
|--------|---------|-----------|
| `active` | Normal user | ✓ Yes |
| `inactive` | Soft delete | ✗ No |
| `suspended` | Under review | ✗ No |

---

## Default Roles by User Type

### System Admin (isAdmin: true)

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

### System User (isAdmin: false)

```
test-registry:      user
test-executor:      user
code-tracer:        user
issue-manager:      user
defect-manager:     user
dashboard-reporter: user
agile:              user
gitops:             user
user-admin:         read    (cannot manage other users)
```

---

## Programmatic Access

### Quick Example

```typescript
import { UserManager } from './modules/user-manager';

const um = UserManager.getInstance();

// Create user
const user = um.createUser('john@company.com', 'John Doe', false);

// Assign role
um.assignModuleRole('john@company.com', 'issue-manager', 'admin');

// Check permission
if (um.hasPermission('john@company.com', 'issue-manager', 'write')) {
  // User can write to issue-manager
}

// Get metrics
const metrics = um.getMetrics();
console.log(`Total users: ${metrics.totalUsers}`);
```

---

## Session IDs

Sessions are auto-generated:

```bash
# Create session
testmgr user login john@company.com
# Returns: Session ID: sess-9876543210

# End session
testmgr user logout sess-9876543210

# List active sessions
testmgr user sessions
```

---

## Files & Storage

```
.testmgr/
├── users.json              # All user accounts
├── user-sessions.json      # Login sessions (current + historical)
└── user-audit.json         # Audit trail (last 10,000 entries)
```

---

## Troubleshooting

### User Can't Log In
- **Check:** `testmgr user details <email>`
- **Status must be:** `active`
- **Fix:** `testmgr user status <email> active`

### Permission Denied
- **Check:** `testmgr user role list <email>`
- **Fix:** `testmgr user role assign <email> <module> <role>`

### Session Not Found
- **Check:** `testmgr user sessions`
- **Fix:** `testmgr user login <email>` (create new)

---

## Tips & Best Practices

✅ **Do:**
- Create admin accounts first
- Assign granular roles per module
- Review audit log regularly
- Check metrics for usage patterns
- Use status to deactivate users (not delete)

❌ **Don't:**
- Share admin accounts
- Assign all users as admins
- Ignore audit logs
- Create users without purpose
- Delete users without audit trail (use inactive instead)

---

## See Also

- **Full Guide:** [README_USER_ADMINISTRATION.md](./README_USER_ADMINISTRATION.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Documentation Index:** [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

**Version:** 1.0.0 | **Last Updated:** January 15, 2024 | **Status:** ✅ Complete
