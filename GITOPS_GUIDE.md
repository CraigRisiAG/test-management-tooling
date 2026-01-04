# GitOps Repository Interface - User Guide

## Overview

The Zebrunner platform now includes a comprehensive **GitOps-based repository interface** that allows you to view, manage, and interact with Git repositories directly within your projects. This enables infrastructure-as-code workflows and seamless CI/CD integration.

## Features

✅ **Repository Management** - Clone, initialize, sync repositories  
✅ **File Browser** - Navigate repository structure with tree view  
✅ **Commit History** - View commit logs with statistics  
✅ **Branch Management** - List, switch, and track branches  
✅ **Diff Viewer** - Compare commits and view changes  
✅ **Search** - Find files and content across repository  
✅ **GitOps Configuration** - Enable infrastructure-as-code workflows  
✅ **Sync Operations** - Automated pull/push with tracking  

## Quick Start

### 1. Initialize Repository

```bash
# Initialize in current directory
zebrunner repo init

# Initialize with remote URL
zebrunner repo init --url https://github.com/user/repo.git

# Initialize specific path
zebrunner repo init /path/to/project --url https://github.com/user/repo.git
```

### 2. Clone Repository

```bash
# Clone repository
zebrunner repo clone https://github.com/user/repo.git

# Clone specific branch
zebrunner repo clone https://github.com/user/repo.git -b develop

# Clone to specific path
zebrunner repo clone https://github.com/user/repo.git ./my-project
```

### 3. Browse Repository

```bash
# Show file tree
zebrunner repo browse

# Show deeper tree
zebrunner repo browse --depth 5

# Browse specific path
zebrunner repo browse /path/to/repo
```

**Example Output:**
```
📁 my-project
├── 📄 package.json (2.5 KB)
├── 📄 tsconfig.json (645 B)
├── 📁 src
│   ├── 📄 cli.ts (5.2 KB)
│   ├── 📁 modules
│   │   ├── 📄 ui.ts (3.1 KB)
│   │   ├── 📄 config.ts (4.8 KB)
│   │   └── 📄 gitops.ts (12.4 KB)
│   └── 📁 utils
│       ├── 📄 logger.ts (2.1 KB)
│       └── 📄 shell.ts (3.9 KB)
└── 📁 tests
    └── 📄 gitops.test.ts (2.7 KB)
```

## Repository Commands

### Status

```bash
# Show repository status
zebrunner repo status

# Output:
# Branch: main
# Ahead: 2 | Behind: 0
# Modified: 3 | Added: 1 | Deleted: 0
# Untracked: 2
# Clean: No
```

### Commit History

```bash
# Show last 20 commits
zebrunner repo log

# Show last 50 commits
zebrunner repo log --limit 50

# Show commits for specific path
zebrunner repo log /path/to/repo
```

**Example Output:**
```
a3d2f1c8 Add GitOps module
  AI Assistant <assistant@example.com> - 1/3/2026, 10:15:30 AM
  Files: 2

b7e4c3a9 Update CLI commands
  AI Assistant <assistant@example.com> - 1/3/2026, 9:45:12 AM
  Files: 1
```

### Branches

```bash
# List all branches
zebrunner repo branches

# Output:
# * main
#   develop (remote)
#   feature/gitops
```

### Sync Repository

```bash
# Pull + push changes
zebrunner repo sync

# Sync specific path
zebrunner repo sync /path/to/repo
```

### View Differences

```bash
# Show changes since last commit
zebrunner repo diff

# Compare with specific commit
zebrunner repo diff --commit HEAD~5

# Compare specific path
zebrunner repo diff /path/to/repo
```

**Example Output:**
```
File: src/modules/gitops.ts
+15 -3

@@ -120,7 +120,15 @@
   static getStatus(repoPath: string): RepositoryStatus {
-    const branch = 'main';
+    const branch = this.getCurrentBranch(repoPath);
+    
+    // Get ahead/behind counts
+    const trackingResult = ShellExecutor.exec(
+      'git rev-list --left-right --count HEAD...@{upstream}',
+      { cwd: repoPath }
+    );
```

### Search

```bash
# Search file names
zebrunner repo search "config" --files

# Search content
zebrunner repo search "GitOps"

# Search in specific path
zebrunner repo search "module" /path/to/repo
```

**Example Output:**
```
Content matching "GitOps"

src/modules/gitops.ts:15
  export class GitOpsModule {

src/cli.ts:234
  import { GitOpsModule } from './modules/gitops';
```

### Repository Summary

```bash
# Show repository statistics
zebrunner repo summary

# Output:
# Total files: 45
# Total commits: 128
# Total authors: 3
#
# Languages:
#   ts: 23 files
#   json: 5 files
#   md: 8 files
#   js: 3 files
```

## GitOps Configuration

### Enable GitOps

```bash
# Enable GitOps for current project
zebrunner gitops enable

# Enable with remote URL
zebrunner gitops enable --url https://github.com/user/infrastructure.git

# Enable with specific branch
zebrunner gitops enable --url https://github.com/user/infra.git --branch production

# Enable for specific path
zebrunner gitops enable /path/to/project --url https://github.com/user/repo.git
```

### View Configuration

```bash
# Show GitOps configuration
zebrunner gitops config

# Output:
# Enabled: true
# Auto-sync: false
# Sync interval: 15 minutes
#
# Repositories:
#   my-project: https://github.com/user/repo.git (main)
```

### Disable GitOps

```bash
# Disable GitOps for project
zebrunner gitops disable

# Disable for specific path
zebrunner gitops disable /path/to/project
```

## Configuration File

GitOps configuration is stored in `.zebrunner/gitops.json`:

```json
{
  "enabled": true,
  "repositories": [
    {
      "name": "my-project",
      "url": "https://github.com/user/repo.git",
      "branch": "main",
      "path": "/path/to/project",
      "remote": "origin"
    }
  ],
  "autoSync": false,
  "syncInterval": 15,
  "notifications": {
    "onSync": true,
    "onError": true,
    "channels": ["slack", "email"]
  }
}
```

## Use Cases

### 1. Infrastructure as Code

```bash
# Clone infrastructure repository
zebrunner repo clone https://github.com/company/infrastructure.git

# Enable GitOps
cd infrastructure
zebrunner gitops enable --url https://github.com/company/infrastructure.git

# Make changes and sync
# ... edit files ...
zebrunner repo sync

# View what changed
zebrunner repo diff
```

### 2. Multi-Environment Management

```json
{
  "enabled": true,
  "repositories": [
    {
      "name": "dev-config",
      "url": "https://github.com/company/config.git",
      "branch": "development",
      "path": "./environments/dev"
    },
    {
      "name": "prod-config",
      "url": "https://github.com/company/config.git",
      "branch": "production",
      "path": "./environments/prod"
    }
  ],
  "autoSync": true,
  "syncInterval": 15
}
```

### 3. Code Review Workflow

```bash
# View recent changes
zebrunner repo log --limit 10

# Check specific commit
zebrunner repo diff --commit a3d2f1c8

# Search for specific changes
zebrunner repo search "authentication"

# View current status before review
zebrunner repo status
```

### 4. Project Documentation

```bash
# Browse project structure
zebrunner repo browse

# Search documentation
zebrunner repo search "README" --files

# View file content
zebrunner repo browse | grep -A 10 "docs"
```

## Integration with CI/CD

### Automated Sync

Enable auto-sync in configuration:

```json
{
  "enabled": true,
  "autoSync": true,
  "syncInterval": 15,
  "webhookUrl": "https://api.zebrunner.com/webhooks/sync"
}
```

### Webhook Triggers

Configure webhooks to trigger on Git events:

```json
{
  "notifications": {
    "onSync": true,
    "onError": true,
    "channels": ["slack"]
  }
}
```

### Environment Variables

GitOps respects standard Git environment variables:

```bash
GIT_AUTHOR_NAME="CI Bot"
GIT_AUTHOR_EMAIL="ci@company.com"
GIT_SSH_COMMAND="ssh -i ~/.ssh/deploy_key"
```

## API Integration

All GitOps functionality is available via TypeScript API:

```typescript
import { GitOpsModule, RepositoryViewerModule } from 'zebrunner-platform';

// Initialize repository
const repo = await GitOpsModule.initRepository('/path/to/repo');

// Get status
const status = GitOpsModule.getStatus('/path/to/repo');

// Get commit history
const commits = GitOpsModule.getCommitHistory('/path/to/repo', 20);

// Build file tree
const tree = RepositoryViewerModule.buildFileTree('/path/to/repo');

// Get diff
const diffs = RepositoryViewerModule.getDiff('/path/to/repo');

// Search content
const results = RepositoryViewerModule.searchContent('/path/to/repo', 'search term');
```

## Performance Tips

1. **Limit tree depth** for large repositories:
   ```bash
   zebrunner repo browse --depth 2
   ```

2. **Use specific paths** for faster operations:
   ```bash
   zebrunner repo log /path/to/specific/repo
   ```

3. **Filter search results** for large codebases:
   ```bash
   zebrunner repo search "pattern" --files | head -20
   ```

4. **Cache repository info** in scripts:
   ```bash
   status=$(zebrunner repo status | grep "Branch")
   ```

## Troubleshooting

### Repository not found

```bash
# Ensure you're in a git repository
cd /path/to/repo
zebrunner repo status
```

### Permission denied

```bash
# Check SSH keys
ssh -T git@github.com

# Or use HTTPS with credentials
zebrunner repo clone https://username:token@github.com/user/repo.git
```

### Sync conflicts

```bash
# Check status first
zebrunner repo status

# View changes
zebrunner repo diff

# Manual resolution
cd /path/to/repo
git pull --rebase
zebrunner repo sync
```

## Best Practices

1. **Enable GitOps early** in project lifecycle
2. **Use branches** for different environments
3. **Automate syncs** for production deployments
4. **Enable notifications** for critical repositories
5. **Regular status checks** before deployments
6. **Document repository structure** in README
7. **Use search** to find configuration quickly

## Next Steps

- **Web UI**: Coming soon - visual repository browser
- **Merge Request Integration**: Review PRs directly in Zebrunner
- **Advanced Diff**: Side-by-side comparison
- **Blame View**: See who changed what
- **File History**: Track file changes over time

---

**Documentation Version**: 1.0  
**Last Updated**: January 3, 2026  
**Status**: ✅ Production Ready
