# Issue & Defect Management System

Complete issue and defect tracking system integrated directly into the custom test management platform.

## Overview

The issue and defect management system provides:

- **Issue Tracking**: Track bugs, enhancements, tasks with full lifecycle management
- **Defect Management**: Automatically create defects from test failures with root cause tracking
- **Health Scoring**: System health score (0-100) based on open critical and major defects
- **Comment Threads**: Collaborate on issues with comments and discussion
- **Filtering & Search**: Advanced filtering by status, severity, assignee
- **PR Linking**: Link pull requests to defect resolutions
- **Persistence**: All issues and defects stored in JSON files

## Issue Management

### Create an Issue

```bash
testmgr issue create
```

Interactive prompt to create a new issue:
- **Title**: Issue title (required)
- **Description**: Detailed description
- **Type**: bug, defect, enhancement, task
- **Severity**: critical, major, minor, trivial
- **Priority**: P0, P1, P2, P3
- **Assignee**: Developer name (optional)

Example:
```bash
$ testmgr issue create
? Issue title: Login button not responding
? Issue description: Click on login button doesn't submit form on mobile
? Issue type: bug
? Severity level: critical
? Priority: P0
? Assignee (optional): john.doe
✓ Issue created: ISS-001 (Login button not responding)
```

### List Issues

```bash
testmgr issue list [options]
```

Options:
- `--status <status>`: Filter by status (open, in-progress, resolved, closed)
- `--severity <severity>`: Filter by severity (critical, major, minor, trivial)
- `--assigned-to <user>`: Filter by assignee

Examples:
```bash
# List all open issues
testmgr issue list --status open

# List critical issues
testmgr issue list --severity critical

# List issues assigned to john
testmgr issue list --assigned-to john.doe
```

Output:
```
Issues:
────────────────────────────────────────────────────────────────────────────────────────────────
ISS-001 | Login button not responding | open | critical
  Assigned to: john.doe
ISS-002 | Profile page slow on first load | open | major
────────────────────────────────────────────────────────────────────────────────────────────────
Total: 2 issues
```

### Assign an Issue

```bash
testmgr issue assign <issue-id> <assignee>
```

Example:
```bash
testmgr issue assign ISS-001 jane.smith
✓ Issue ISS-001 assigned to jane.smith
```

### Update Issue Status

```bash
testmgr issue status <issue-id> <new-status>
```

Supported statuses: `open`, `in-progress`, `resolved`, `closed`

Example:
```bash
testmgr issue status ISS-001 in-progress
✓ Issue ISS-001 status updated to in-progress
```

### Add Comment to Issue

```bash
testmgr issue comment <issue-id>
```

Interactive prompt for your comment:
```bash
$ testmgr issue comment ISS-001
? Your comment: Found the issue - form submit event not binding properly
✓ Comment added to issue ISS-001
```

## Defect Management

### Create a Defect

```bash
testmgr defect create
```

Interactive prompt:
- **Title**: Defect title (required)
- **Description**: What went wrong
- **Severity**: critical, major, minor, trivial
- **Root Cause**: What caused it (optional)
- **Link to test ID**: Associated test (optional)

Example:
```bash
$ testmgr defect create
? Defect title: Authentication timeout too short
? Defect description: Users getting logged out after 5 minutes of inactivity
? Severity: major
? Root cause (optional): Session timeout configured to 5 mins instead of 30 mins
? Link to test ID (optional): TEST-0042
✓ Defect created: DEF-001 (Authentication timeout too short)
```

### Automatic Defect Creation from Tests

When a test fails during execution, a defect is automatically created:

```typescript
// In your test runner
const testExecutor = new TestExecutor();
const result = await testExecutor.executeTest(testId);

if (!result.passed && result.error) {
  // Defect automatically created by DefectManager
  // Linked to the failed test
}
```

### List Defects

```bash
testmgr defect list [--status <status>]
```

Status filter: open, in-progress, resolved, verified

Example:
```bash
# List all open defects
testmgr defect list --status open

# List all defects
testmgr defect list
```

Output:
```
Defects:
────────────────────────────────────────────────────────────────────────────────────────────────
DEF-001 | Authentication timeout too short | open | major
DEF-002 | Validation error message displays twice | in-progress | minor
DEF-003 | Database connection pool exhausted | open | critical
────────────────────────────────────────────────────────────────────────────────────────────────
Total: 3 defects
```

### Update Defect Status

```bash
testmgr defect status <defect-id> <new-status>
```

Supported statuses: `open`, `in-progress`, `resolved`, `verified`

Example:
```bash
testmgr defect status DEF-001 in-progress
✓ Defect DEF-001 status updated to in-progress
```

### Resolve a Defect

```bash
testmgr defect resolve <defect-id>
```

Interactive prompt:
- **Root Cause**: What was the root cause
- **Resolution**: How was it fixed
- **Pull Request URL**: Link to PR with the fix (optional)

Example:
```bash
$ testmgr defect resolve DEF-001
? Root cause: Session configuration set to 5 minutes instead of 30 minutes
? Resolution: Updated SessionConfig.SESSION_TIMEOUT from 300 to 1800 seconds in application.properties
? Pull request URL (optional): https://github.com/org/repo/pull/1234
✓ Defect DEF-001 resolved
```

### System Health Score

```bash
testmgr defect health
```

Displays overall defect health:

```
Defect Health Report
────────────────────────────────────────────────────────────────────
Health Score: 65/100
Critical Defects: 2
Unverified Fixes: 1

Critical Defects:
  • Database connection pool exhausted (DEF-003)
  • Payment processing fails with SSL error (DEF-005)
────────────────────────────────────────────────────────────────────
```

**Health Score Calculation:**
- Starts at 100
- Each critical defect: -15 points
- Each major defect: -8 points
- Each minor defect: -2 points
- Each unverified fix: -5 points
- Minimum score: 0

## Data Storage

### Issue Storage
- **File**: `.testmgr/issues.json`
- **Format**: JSON array of Issue objects

Example:
```json
[
  {
    "id": "ISS-001",
    "title": "Login button not responding",
    "description": "Click on login button doesn't submit form on mobile",
    "type": "bug",
    "severity": "critical",
    "priority": "P0",
    "status": "open",
    "assignee": "john.doe",
    "createdDate": "2024-01-15T10:30:00Z",
    "linkedTests": ["TEST-001", "TEST-002"],
    "linkedStories": ["STORY-001"],
    "comments": [
      {
        "text": "Found the issue - form submit event not binding properly",
        "author": "jane.smith",
        "date": "2024-01-15T11:45:00Z"
      }
    ]
  }
]
```

### Defect Storage
- **File**: `.testmgr/defects.json`
- **Format**: JSON array of Defect objects

Example:
```json
[
  {
    "id": "DEF-001",
    "title": "Authentication timeout too short",
    "description": "Users getting logged out after 5 minutes of inactivity",
    "severity": "major",
    "status": "resolved",
    "rootCause": "Session timeout configured to 5 mins instead of 30 mins",
    "resolution": "Updated SessionConfig.SESSION_TIMEOUT to 1800 seconds",
    "linkedTest": "TEST-0042",
    "affectedCode": [
      "src/config/SessionConfig.java:25"
    ],
    "pullRequest": "https://github.com/org/repo/pull/1234",
    "createdDate": "2024-01-15T09:00:00Z",
    "resolvedDate": "2024-01-15T14:30:00Z"
  }
]
```

## Integration with Test Management

### Automatic Defect Creation on Test Failure

```typescript
import { TestExecutor } from './modules/test-executor';
import { DefectManager } from './modules/defect-manager';

const executor = new TestExecutor();
const defectMgr = new DefectManager();

// Execute a test
const result = await executor.executeTest(testId);

// If test fails, automatically create defect
if (!result.passed) {
  const defect = await defectMgr.createDefectFromTest(
    testId,
    `Test failure: ${result.error}`,
    result.stackTrace,
    'major'
  );
  console.log(`Defect created: ${defect.id}`);
}
```

### Link Issues to Tests

```typescript
import { IssueManager } from './modules/issue-manager';
import { TestRegistry } from './modules/test-registry';

const issueMgr = new IssueManager();
const testReg = new TestRegistry();

// Create or get an issue
const issue = await issueMgr.createIssue({...});

// Link to a test
await issueMgr.linkToTest(issue.id, testId);

// Link to a story
await issueMgr.linkToStory(issue.id, storyId);
```

### Dashboard Integration

Issues and defects are displayed in the dashboard:

```bash
testmgr dashboard
```

The HTML dashboard includes:
- Issue summary (open, critical, by priority)
- Defect health score prominently displayed
- Critical defects list
- Defect status breakdown
- Defects linked to failed tests

## API Reference

### IssueManager

```typescript
interface IssueManager {
  // Create
  createIssue(issue: Omit<Issue, 'id' | 'comments'>): Promise<Issue>

  // Read
  getIssue(issueId: string): Issue
  getAllIssues(): Issue[]

  // Update
  updateStatus(issueId: string, status: Issue['status']): Promise<void>
  assign(issueId: string, assignee: string): Promise<void>

  // Linking
  linkToTest(issueId: string, testId: string): Promise<void>
  linkToStory(issueId: string, storyId: string): Promise<void>

  // Comments
  addComment(issueId: string, comment: IssueComment): Promise<void>

  // Query
  filterIssues(filter: IssueFilter): Issue[]
  getMetrics(): IssueMetrics
}
```

### DefectManager

```typescript
interface DefectManager {
  // Create
  createDefectFromTest(
    testId: string,
    title: string,
    description: string,
    severity: string,
    rootCause?: string
  ): Promise<Defect>

  // Read
  getDefect(defectId: string): Defect
  getAllDefects(): Defect[]

  // Update
  updateStatus(defectId: string, status: Defect['status'], updatedBy?: string): Promise<void>
  addAffectedCode(defectId: string, codePath: string): Promise<void>

  // Resolution
  setResolution(
    defectId: string,
    rootCause: string,
    resolution: string,
    prUrl?: string
  ): Promise<void>
  linkPullRequest(defectId: string, prUrl: string): Promise<void>

  // Query
  getDefectsByStatus(status: string): Defect[]
  getDefectsForTest(testId: string): Defect[]
  getCriticalDefects(): Defect[]
  getUnverifiedDefects(): Defect[]

  // Analytics
  getMetrics(): DefectMetrics
  getHealthScore(): number  // 0-100
}
```

## Best Practices

### Issue Management
1. **Be Specific**: Clear titles and descriptions help with resolution
2. **Set Severity**: Use correct severity levels (critical for blocking issues)
3. **Assign Promptly**: Assign issues to developers immediately
4. **Update Status**: Keep status updated as work progresses
5. **Comment Regularly**: Add comments for important updates

### Defect Management
1. **Link to Tests**: Always link defects to failing tests when possible
2. **Document Root Cause**: Add root cause as soon as identified
3. **Track Resolution**: Document how the defect was fixed
4. **Link PRs**: Link to pull request that fixed the issue
5. **Verify Fixes**: Change status to "verified" after testing

### Health Monitoring
1. **Check Health Score Daily**: Track `testmgr defect health`
2. **Resolve Critical Issues First**: Prioritize critical severity
3. **Monitor Unverified Fixes**: Don't let them pile up
4. **Trend Analysis**: Track health score trends over weeks

## Troubleshooting

### Issue Not Being Created
- Verify all required fields are provided
- Check `.testmgr/` directory exists
- Ensure write permissions to `.testmgr/issues.json`

### Defect Not Linked to Test
- Use `testmgr defect list` to see all defects
- Check that test ID is correct when linking
- Verify test exists in test registry

### Health Score Unexpected
- Check `testmgr defect list` for critical/major defects
- Review unverified defects with `getUnverifiedDefects()`
- Ensure defect statuses are correctly set

### Data Loss
- Backup `.testmgr/issues.json` and `.testmgr/defects.json` regularly
- Use version control for data files
- Check file permissions and disk space

## Configuration

The issue/defect system uses the main test management configuration:

```json
{
  "system": "test-management-tooling",
  "version": "1.0.0",
  "dataDir": ".testmgr",
  "features": {
    "issueTracking": true,
    "defectTracking": true,
    "autoCreateDefects": true,
    "healthScoring": true
  }
}
```

## Examples

### Workflow Example: Bug Tracking

```bash
# 1. Create an issue when bug is reported
testmgr issue create
# → ISS-001: Login form validation error

# 2. Write test to reproduce
testmgr test link
# → Link test TEST-045 to ISS-001

# 3. Test fails, defect auto-created
testmgr defect list --status open
# → DEF-001 automatically created from TEST-045

# 4. Developer picks up the defect
testmgr issue assign ISS-001 alice.dev
testmgr issue status ISS-001 in-progress

# 5. Developer creates PR with fix
testmgr defect resolve DEF-001
# → Root cause: Form validation regex incorrect
# → Resolution: Updated regex pattern
# → PR: https://github.com/org/repo/pull/5432

# 6. Test now passes, defect resolved
testmgr defect status DEF-001 verified

# 7. Monitor health
testmgr defect health
# → Health Score: 95/100 ✓
```

### Workflow Example: Feature Request

```bash
# 1. Create enhancement issue
testmgr issue create
# → Type: enhancement
# → Priority: P1
# → ISS-002: Add dark mode support

# 2. Link to related user story
testmgr issue list
# → Link ISS-002 to STORY-015

# 3. Assign to team
testmgr issue assign ISS-002 design-team

# 4. Track progress
testmgr issue comment ISS-002
# → Added design mockups and spec

# 5. Close when complete
testmgr issue status ISS-002 resolved
```

## Summary

The issue and defect management system provides a complete tracking solution integrated directly into your test management platform, enabling:

✅ Complete issue lifecycle (create → assign → resolve → close)
✅ Automatic defect creation from test failures
✅ Root cause and resolution tracking
✅ Team collaboration via comments
✅ System health scoring
✅ PR linking for traceability

All data is persisted locally in JSON files, giving you full control and visibility into your issue and defect landscape.
