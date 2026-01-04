# Issue & Defect Management - Quick Reference

## Commands Overview

```
testmgr issue <command>     - Issue tracking
testmgr defect <command>    - Defect tracking
```

## Issue Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| Create | `testmgr issue create` | Create new issue (interactive) |
| List | `testmgr issue list [options]` | List all issues with filters |
| Assign | `testmgr issue assign <id> <user>` | Assign issue to developer |
| Status | `testmgr issue status <id> <status>` | Update issue status |
| Comment | `testmgr issue comment <id>` | Add comment to issue |

### Issue Status Values
- `open` - Initial state
- `in-progress` - Being worked on
- `resolved` - Work completed
- `closed` - Final state

### Severity Levels
- `critical` - Blocking issue, immediate fix needed
- `major` - Significant issue, high priority
- `minor` - Small issue, can be deferred
- `trivial` - Very minor, low priority

### Priority Levels
- `P0` - Blocker
- `P1` - High
- `P2` - Medium
- `P3` - Low

## Defect Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| Create | `testmgr defect create` | Create new defect (interactive) |
| List | `testmgr defect list [--status <s>]` | List all defects |
| Status | `testmgr defect status <id> <status>` | Update defect status |
| Resolve | `testmgr defect resolve <id>` | Mark defect as resolved |
| Health | `testmgr defect health` | Show system health score |

### Defect Status Values
- `open` - Newly reported
- `in-progress` - Being fixed
- `resolved` - Fix implemented
- `verified` - Fix verified through testing

## Usage Examples

### Create Issue
```bash
testmgr issue create
# Interactive prompts for:
# - Title
# - Description
# - Type (bug, defect, enhancement, task)
# - Severity (critical, major, minor, trivial)
# - Priority (P0, P1, P2, P3)
# - Assignee (optional)
```

### List Issues
```bash
# All issues
testmgr issue list

# Open issues only
testmgr issue list --status open

# Critical severity
testmgr issue list --severity critical

# Assigned to someone
testmgr issue list --assigned-to john.doe
```

### Manage Issue
```bash
# Update status
testmgr issue status ISS-001 in-progress

# Assign to developer
testmgr issue assign ISS-001 jane.smith

# Add comment
testmgr issue comment ISS-001
# Prompts for comment text
```

### Create Defect
```bash
testmgr defect create
# Interactive prompts for:
# - Title
# - Description
# - Severity
# - Root cause (optional)
# - Test ID (optional)
```

### Resolve Defect
```bash
testmgr defect resolve DEF-001
# Interactive prompts for:
# - Root cause
# - Resolution
# - Pull request URL (optional)
```

### Check Health
```bash
testmgr defect health
# Shows:
# - Health Score (0-100)
# - Number of critical defects
# - Number of unverified fixes
# - List of critical defects
```

## File Locations

- Issues: `.testmgr/issues.json`
- Defects: `.testmgr/defects.json`
- Config: `.testmgr/config.json`

## Quick Workflows

### Bug Report to Resolution
```bash
# 1. Create issue when bug reported
testmgr issue create

# 2. Create test case
testmgr test link

# 3. Test fails, defect auto-created
# (No command needed)

# 4. Check defect
testmgr defect list --status open

# 5. Assign and work on it
testmgr issue assign ISS-001 dev-name

# 6. Resolve when done
testmgr defect resolve DEF-001

# 7. Verify health
testmgr defect health
```

### Monitor Quality
```bash
# Check current health
testmgr defect health

# List critical issues
testmgr issue list --severity critical

# List open defects
testmgr defect list --status open

# Check unresolved issues
testmgr issue list --status open
```

## Tips

1. **Always set severity** - Helps prioritize work
2. **Link tests to issues** - Creates traceability
3. **Comment on updates** - Keeps team informed
4. **Monitor health score** - Track quality trends
5. **Resolve with PR** - Link code changes to fixes
6. **Regular cleanup** - Close resolved issues
7. **Backup data** - Keep `.testmgr/` directory safe

## Common Issues

**Issue not created?**
- All required fields needed (title, type, severity)
- Check `.testmgr/` directory exists and is writable

**Defect not appearing?**
- Check status with `testmgr defect list`
- Verify defect creation succeeded

**Health score unexpected?**
- Run `testmgr defect health` to see breakdown
- Each critical defect: -15 points
- Each major defect: -8 points

**Can't link issue to test?**
- Verify test ID exists
- Use exact test ID value

## Integration Points

- **Test Failures**: Defects auto-created when tests fail
- **Dashboard**: Issues/defects shown in HTML dashboard
- **Reports**: Issue/defect metrics in JSON reports
- **Stories**: Issues can link to user stories
- **Code**: Defects track affected code locations

---

For detailed documentation, see:
- [README_ISSUE_DEFECT_MANAGEMENT.md](README_ISSUE_DEFECT_MANAGEMENT.md) - Full guide
- [README_CUSTOM_TEST_MGMT.md](README_CUSTOM_TEST_MGMT.md) - Test management
