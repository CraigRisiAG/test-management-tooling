# 📊 Agile Board Guide

Comprehensive guide for using Zebrunner's integrated agile board functionality with test-to-code linkage.

## 📑 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Board Management](#board-management)
- [Sprint Planning](#sprint-planning)
- [Story Management](#story-management)
- [Test Linkage](#test-linkage)
- [Repository Integration](#repository-integration)
- [Metrics & Analytics](#metrics--analytics)
- [Workflows](#workflows)
- [Configuration](#configuration)
- [API Usage](#api-usage)
- [Best Practices](#best-practices)

## Overview

Zebrunner's agile board provides complete sprint planning and tracking capabilities with deep integration into your test infrastructure and GitOps workflows.

### Key Features

✅ **Sprint Planning** - Create and manage sprints with customizable duration  
✅ **Story Tracking** - Track user stories from backlog to completion  
✅ **Test Linkage** - Link tests directly to user stories with coverage tracking  
✅ **GitOps Integration** - Auto-link commits to stories via GitOps  
✅ **Burndown Charts** - Track sprint progress with velocity metrics  
✅ **Kanban Boards** - Visualize workflow with customizable columns  
✅ **Team Metrics** - Average velocity, cycle time, test coverage  

## Quick Start

### Initialize Agile Board

```bash
# Initialize agile configuration in your project
zebrunner agile init

# This creates: .zebrunner/agile.json
```

### Create Your First Board

```bash
# Create a board
zebrunner agile board create "My Project Board" \
  --description "Main development board" \
  --sprint-duration 2

# Expected output:
# ✅ Board "My Project Board" created with ID: 1735948800000
```

### Create a Sprint

```bash
# Create a sprint
zebrunner agile sprint create <boardId> "Sprint 1" \
  --goal "Complete authentication feature" \
  --start 2026-01-06 \
  --end 2026-01-20

# Start the sprint
zebrunner agile sprint start <sprintId>
```

### Create and Track Stories

```bash
# Create a story in the sprint
zebrunner agile story create <boardId> "Implement login form" \
  --description "Add login form with validation" \
  --type feature \
  --priority high \
  --estimate 8 \
  --sprint <sprintId>

# Update story status
zebrunner agile story status <storyId> in-progress

# Link a test
zebrunner agile story link-test <storyId> ./tests/login.test.ts \
  --type e2e

# Link repository
zebrunner agile story link-repo <storyId> https://github.com/user/repo.git \
  --auto-detect
```

## Board Management

### Create a Board

```bash
zebrunner agile board create <name> [options]

Options:
  -d, --description <desc>        Board description
  -s, --sprint-duration <weeks>   Sprint duration (default: 2)
  -p, --path <path>               Project path
```

**Example:**
```bash
zebrunner agile board create "Product Development" \
  --description "Main product board" \
  --sprint-duration 3
```

### List All Boards

```bash
zebrunner agile board list

# Output:
# 📊 Agile Boards:
#
#   Product Development (ID: 1735948800000)
#     Status: active
#     Sprints: 5
#     Backlog: 23 stories
```

### Show Board Details

```bash
zebrunner agile board show <boardId>

# Displays:
# - Board information
# - Active sprints
# - Backlog size
# - Key metrics
```

### Board Configuration

Boards are configured with:

- **Sprint Duration**: Default sprint length (1-4 weeks)
- **Story Point Scale**: Fibonacci (1, 2, 3, 5, 8, 13, 21)
- **Columns**: Backlog, To Do, In Progress, Review, Testing, Done
- **WIP Limits**: Optional work-in-progress limits per column
- **Auto-Archive**: Automatically archive completed sprints

## Sprint Planning

### Create a Sprint

```bash
zebrunner agile sprint create <boardId> <name> [options]

Options:
  -g, --goal <goal>      Sprint goal
  -s, --start <date>     Start date (YYYY-MM-DD)
  -e, --end <date>       End date (YYYY-MM-DD)
  -p, --path <path>      Project path
```

**Example:**
```bash
zebrunner agile sprint create $BOARD_ID "Sprint 5" \
  --goal "Complete user authentication and profile pages" \
  --start 2026-01-06 \
  --end 2026-01-20
```

### Sprint Lifecycle

#### 1. **Planning** → 2. **Active** → 3. **Completed**

```bash
# 1. Create sprint (starts in 'planning' status)
SPRINT_ID=$(zebrunner agile sprint create $BOARD_ID "Sprint 1")

# 2. Add stories to sprint
zebrunner agile story create $BOARD_ID "Story 1" --sprint $SPRINT_ID
zebrunner agile story create $BOARD_ID "Story 2" --sprint $SPRINT_ID

# 3. Start sprint (changes status to 'active')
zebrunner agile sprint start $SPRINT_ID

# 4. Work on stories...
zebrunner agile story status $STORY_ID in-progress
zebrunner agile story status $STORY_ID done

# 5. Complete sprint
zebrunner agile sprint complete $SPRINT_ID

# Output:
# 📈 Sprint Metrics:
#   Completed Stories: 8/10
#   Completed Points: 42/50
#   Velocity: 42 points
#   Test Coverage: 87.5%
```

### Sprint Rules

- ✅ Only one active sprint per board at a time
- ✅ Stories can be added during sprint (if needed)
- ✅ Incomplete stories return to backlog on completion
- ✅ Velocity calculated from completed stories only

### View Sprint Details

```bash
zebrunner agile sprint show <sprintId>

# Output:
# 🎯 Sprint: Sprint 1 (active)
#    Goal: Complete authentication feature
#    Duration: 1/6/2026 - 1/20/2026
#
#    Progress:
#    • Stories: 5/8 completed
#    • Points: 21/34 completed
#    • Velocity: 21 points
#    • Test Coverage: 90.0%
#
#    Stories:
#    ✅ Implement login form (done) - 8 pts
#    🔄 Add OAuth integration (in-progress) - 5 pts
#    📋 Create profile page (todo) - 8 pts
```

## Story Management

### Create a Story

```bash
zebrunner agile story create <boardId> <title> [options]

Options:
  -d, --description <desc>       Story description
  -t, --type <type>             feature|bug|chore|spike
  --priority <priority>         low|medium|high|critical
  -e, --estimate <points>       Story points
  -a, --assignee <name>         Assignee name
  -s, --sprint <sprintId>       Sprint ID (adds to sprint, not backlog)
  --tags <tags>                 Comma-separated tags
  -p, --path <path>             Project path
```

**Examples:**

```bash
# Feature story in backlog
zebrunner agile story create $BOARD_ID "User authentication" \
  --description "Implement JWT-based authentication" \
  --type feature \
  --priority high \
  --estimate 13 \
  --assignee "Alice" \
  --tags "auth,security"

# Bug story in active sprint
zebrunner agile story create $BOARD_ID "Fix login redirect" \
  --type bug \
  --priority critical \
  --estimate 3 \
  --sprint $SPRINT_ID \
  --assignee "Bob"

# Technical spike
zebrunner agile story create $BOARD_ID "Research GraphQL migration" \
  --type spike \
  --estimate 5
```

### Update Story Status

```bash
zebrunner agile story status <storyId> <status>

Statuses:
  - backlog      Initial state
  - todo         Ready to start
  - in-progress  Currently being worked on
  - review       Code review pending
  - testing      QA testing
  - done         Completed
```

**Example Workflow:**

```bash
# Start working on story
zebrunner agile story status $STORY_ID todo
zebrunner agile story status $STORY_ID in-progress

# Code review
zebrunner agile story status $STORY_ID review

# QA testing
zebrunner agile story status $STORY_ID testing

# Complete
zebrunner agile story status $STORY_ID done
```

### Move Story to Sprint

```bash
# Move from backlog to sprint
zebrunner agile story move <storyId> <sprintId>

# Story automatically changes from 'backlog' to 'todo'
```

## Test Linkage

### Link Test to Story

```bash
zebrunner agile story link-test <storyId> <testPath> [options]

Options:
  -n, --name <name>    Test name (default: filename)
  -t, --type <type>    unit|integration|e2e|performance
  -p, --path <path>    Project path
```

**Examples:**

```bash
# Link unit test
zebrunner agile story link-test $STORY_ID ./tests/unit/auth.test.ts \
  --name "Authentication Unit Tests" \
  --type unit

# Link E2E test
zebrunner agile story link-test $STORY_ID ./e2e/login.spec.ts \
  --type e2e

# Link performance test
zebrunner agile story link-test $STORY_ID ./perf/load-test.js \
  --type performance
```

### Test Coverage Tracking

Test linkage automatically tracks:

- ✅ Test status (passing/failing/skipped)
- ✅ Test type (unit/integration/e2e/performance)
- ✅ Coverage percentage per story
- ✅ Overall sprint test coverage

**View Coverage:**

```bash
# Sprint metrics include test coverage
zebrunner agile sprint show $SPRINT_ID

# Board metrics show overall coverage
zebrunner agile metrics $BOARD_ID
```

## Repository Integration

### Link Repository to Story

```bash
zebrunner agile story link-repo <storyId> <repoUrl> [options]

Options:
  -b, --branch <branch>       Branch name
  -c, --commits <commits>     Comma-separated commit hashes
  --auto-detect              Auto-detect commits mentioning story
  -p, --path <path>           Project path
```

### Manual Linking

```bash
# Link specific commits
zebrunner agile story link-repo $STORY_ID https://github.com/user/repo.git \
  --branch feature/auth \
  --commits abc123,def456,ghi789
```

### Auto-Detection (Recommended)

```bash
# Auto-detect commits mentioning story ID or title
zebrunner agile story link-repo $STORY_ID https://github.com/user/repo.git \
  --auto-detect

# Searches commit messages for:
# - Story ID: "1735948800000"
# - Story reference: "#1735948800000"
# - Story title keywords
```

**Commit Message Format (Best Practice):**

```bash
git commit -m "feat: implement login form (#1735948800000)"
git commit -m "fix: auth bug [Story: User authentication]"
git commit -m "test: add e2e tests for login (Story #1735948800000)"
```

### Repository Linkage Benefits

- ✅ Track all code changes per story
- ✅ View file changes in repository browser
- ✅ Link commit history to requirements
- ✅ Enable code review directly from board
- ✅ Generate release notes from stories

## Metrics & Analytics

### Board Metrics

```bash
zebrunner agile metrics <boardId>

# Output:
# 📊 Board Metrics:
#
#   Total Stories: 45
#
#   Stories by Status:
#     backlog: 15
#     todo: 5
#     in-progress: 8
#     review: 4
#     testing: 3
#     done: 10
#
#   Stories by Priority:
#     critical: 2
#     high: 12
#     medium: 20
#     low: 11
#
#   Average Velocity: 38.5 points/sprint
#   Average Cycle Time: 4.2 days
#   Test Coverage: 85.7%
#   Completed Sprints: 8
```

### Sprint Metrics

Sprint completion automatically calculates:

- **Velocity**: Completed story points
- **Completion Rate**: Completed vs total stories
- **Burndown Data**: Points remaining per day
- **Test Coverage**: Percentage of passing tests

```bash
zebrunner agile sprint complete $SPRINT_ID

# Returns:
# {
#   "sprintId": "...",
#   "totalStories": 10,
#   "completedStories": 8,
#   "totalPoints": 50,
#   "completedPoints": 42,
#   "velocity": 42,
#   "burndownData": [...],
#   "testCoverage": 87.5
# }
```

### Key Metrics Explained

| Metric | Description | Good Target |
|--------|-------------|-------------|
| **Velocity** | Story points completed per sprint | Consistent across sprints |
| **Cycle Time** | Average days from todo → done | < 5 days |
| **Test Coverage** | % of stories with passing tests | > 80% |
| **Sprint Completion** | % of planned stories completed | > 85% |

## Workflows

### Complete Sprint Planning Workflow

```bash
# 1. Create board (once)
BOARD_ID=$(zebrunner agile board create "Project Board")

# 2. Add stories to backlog
zebrunner agile story create $BOARD_ID "Feature 1" --estimate 8
zebrunner agile story create $BOARD_ID "Feature 2" --estimate 5
zebrunner agile story create $BOARD_ID "Bug fix" --estimate 3

# 3. Create sprint
SPRINT_ID=$(zebrunner agile sprint create $BOARD_ID "Sprint 1" \
  --goal "Complete core features")

# 4. Plan sprint (move stories from backlog)
zebrunner agile story move $STORY_ID_1 $SPRINT_ID
zebrunner agile story move $STORY_ID_2 $SPRINT_ID

# 5. Start sprint
zebrunner agile sprint start $SPRINT_ID

# 6. Development workflow
zebrunner agile story status $STORY_ID_1 in-progress
zebrunner agile story link-test $STORY_ID_1 ./tests/feature1.test.ts
zebrunner agile story link-repo $STORY_ID_1 $REPO_URL --auto-detect
zebrunner agile story status $STORY_ID_1 review
zebrunner agile story status $STORY_ID_1 testing
zebrunner agile story status $STORY_ID_1 done

# 7. Complete sprint
zebrunner agile sprint complete $SPRINT_ID

# 8. Review metrics
zebrunner agile metrics $BOARD_ID
```

### Test-Driven Story Development

```bash
# 1. Create story
STORY_ID=$(zebrunner agile story create $BOARD_ID "Add user profile")

# 2. Move to sprint
zebrunner agile story move $STORY_ID $SPRINT_ID

# 3. Start story
zebrunner agile story status $STORY_ID in-progress

# 4. Link tests FIRST (TDD approach)
zebrunner agile story link-test $STORY_ID ./tests/unit/profile.test.ts --type unit
zebrunner agile story link-test $STORY_ID ./tests/integration/profile-api.test.ts --type integration
zebrunner agile story link-test $STORY_ID ./e2e/profile.spec.ts --type e2e

# 5. Develop with tests
# ... write tests first ...
# ... implement feature ...
# ... all tests pass ...

# 6. Link commits
zebrunner agile story link-repo $STORY_ID $REPO_URL --auto-detect

# 7. Complete story
zebrunner agile story status $STORY_ID done

# Tests automatically tracked with story!
```

## Configuration

### Agile Configuration File

`.zebrunner/agile.json`:

```json
{
  "enabled": true,
  "defaultBoard": "1735948800000",
  "boards": [
    {
      "id": "1735948800000",
      "name": "My Board",
      "status": "active",
      "settings": {
        "sprintDurationWeeks": 2,
        "storyPointScale": [1, 2, 3, 5, 8, 13, 21],
        "columns": [
          {
            "id": "1",
            "name": "Backlog",
            "status": "backlog",
            "position": 0
          },
          {
            "id": "2",
            "name": "To Do",
            "status": "todo",
            "position": 1
          },
          {
            "id": "3",
            "name": "In Progress",
            "status": "in-progress",
            "wipLimit": 5,
            "position": 2
          }
        ],
        "autoArchiveSprints": true,
        "requireEstimates": false
      },
      "sprints": [],
      "backlog": []
    }
  ],
  "gitOpsIntegration": true,
  "autoLinkTests": true,
  "autoLinkCommits": true,
  "notificationSettings": {
    "sprintStartReminder": true,
    "sprintEndReminder": true,
    "storyAssigned": true,
    "testFailures": true
  }
}
```

### Customization Options

| Setting | Description | Default |
|---------|-------------|---------|
| `sprintDurationWeeks` | Sprint length | 2 weeks |
| `storyPointScale` | Estimation scale | Fibonacci |
| `autoArchiveSprints` | Auto-archive completed | true |
| `requireEstimates` | Require story points | false |
| `gitOpsIntegration` | Enable GitOps linking | true |
| `autoLinkTests` | Auto-detect test files | true |
| `autoLinkCommits` | Auto-link commits | true |

## API Usage

### Programmatic Access

```typescript
import { AgileModule } from 'zebrunner-platform';

// Initialize
await AgileModule.init('/path/to/project');

// Create board
const board = await AgileModule.createBoard('My Board', {
  description: 'Development board',
  sprintDurationWeeks: 2,
});

// Create sprint
const sprint = await AgileModule.createSprint(board.id, 'Sprint 1', {
  goal: 'Complete features A and B',
  startDate: new Date('2026-01-06'),
  endDate: new Date('2026-01-20'),
});

// Create story
const story = await AgileModule.createStory(board.id, 'Implement feature', {
  type: 'feature',
  priority: 'high',
  estimate: 8,
  sprintId: sprint.id,
});

// Update status
await AgileModule.updateStoryStatus(story.id, 'in-progress');

// Link test
await AgileModule.linkTest(story.id, './tests/feature.test.ts', {
  testType: 'unit',
});

// Link repository (auto-detect)
await AgileModule.linkRepository(story.id, 'https://github.com/user/repo.git', {
  autoDetect: true,
});

// Get metrics
const sprintMetrics = await AgileModule.getSprintMetrics(sprint.id);
const boardMetrics = await AgileModule.getBoardMetrics(board.id);

// Complete sprint
const finalMetrics = await AgileModule.completeSprint(sprint.id);
console.log(`Velocity: ${finalMetrics.velocity} points`);
```

## Best Practices

### 1. **Story Estimation**

```bash
# Use consistent story point scale
Fibonacci: 1, 2, 3, 5, 8, 13, 21

Guidelines:
- 1-2 points: < 4 hours
- 3-5 points: 1-2 days
- 8 points: 3-4 days
- 13+ points: Consider splitting
```

### 2. **Test Coverage**

```bash
# Link tests early and often
Recommended:
- Unit tests: Link during development
- Integration tests: Link before review
- E2E tests: Link before testing phase

Target: 80%+ test coverage per story
```

### 3. **Commit Messages**

```bash
# Include story reference in commits
Good:
  git commit -m "feat: add login form (#1735948800000)"
  git commit -m "test: e2e login tests [Story: Authentication]"

Bad:
  git commit -m "updates"
  git commit -m "fix stuff"
```

### 4. **Sprint Planning**

```bash
# Don't overcommit
Rule of thumb:
- New team: Plan 60-70% of capacity
- Established: Plan 80-90% of capacity
- Leave buffer for bugs/support

# Review velocity trends
zebrunner agile metrics $BOARD_ID
```

### 5. **Backlog Grooming**

```bash
# Keep backlog organized
- Prioritize top 20 stories
- Add estimates during grooming
- Break large stories (>13 points)
- Add tags for filtering
- Link related tests proactively
```

### 6. **GitOps Integration**

```bash
# Enable auto-detection
zebrunner gitops enable

# Configure in .zebrunner/agile.json
{
  "gitOpsIntegration": true,
  "autoLinkCommits": true
}

# Use consistent branch names
feature/story-<id>-<slug>
bugfix/story-<id>-<slug>
```

### 7. **Metrics Tracking**

```bash
# Review metrics regularly
- Sprint review: Sprint metrics
- Board sync: Board metrics
- Retrospective: Velocity trends

# Key indicators
- Velocity stabilizing? ✅
- Cycle time decreasing? ✅
- Test coverage increasing? ✅
```

## Troubleshooting

### Issue: Can't start sprint

**Error:** "Cannot start sprint. Sprint X is already active"

**Solution:**
```bash
# Complete the active sprint first
zebrunner agile sprint complete <activeSprint>

# Then start new sprint
zebrunner agile sprint start <newSprint>
```

### Issue: Story not found

**Error:** "Story X not found"

**Cause:** Story ID incorrect or in different board

**Solution:**
```bash
# List all boards to find story
zebrunner agile board list

# Show board details
zebrunner agile board show <boardId>
```

### Issue: Auto-detect not finding commits

**Cause:** Commits don't reference story

**Solution:**
```bash
# Use manual linking
zebrunner agile story link-repo $STORY_ID $REPO_URL \
  --commits abc123,def456

# Or update commit messages:
git commit --amend -m "feat: add feature (#$STORY_ID)"
```

### Issue: Test coverage shows 0%

**Cause:** Tests not linked to stories

**Solution:**
```bash
# Link tests to stories
zebrunner agile story link-test $STORY_ID ./tests/test1.ts
zebrunner agile story link-test $STORY_ID ./tests/test2.ts

# Enable auto-linking in config
{
  "autoLinkTests": true
}
```

---

## Summary

Zebrunner's agile board provides enterprise-grade sprint planning with deep test and repository integration:

✅ **Complete sprint planning** - Create, start, complete sprints  
✅ **Story tracking** - Backlog to done with status updates  
✅ **Test linkage** - Link unit/integration/e2e tests to stories  
✅ **GitOps integration** - Auto-link commits via story references  
✅ **Metrics & analytics** - Velocity, cycle time, test coverage  
✅ **CLI & API** - Full programmatic access  

**Quick Start Command:**
```bash
zebrunner agile init
zebrunner agile board create "My Board"
zebrunner agile sprint create <boardId> "Sprint 1"
```

---

**Created**: January 4, 2026  
**Status**: ✅ Production Ready  
**Version**: 2.6.0
