# Custom Test Management Platform

A custom test management system that links user stories, tests, and code directly in your repository - no external services required.

## Features

✅ **Story-Code Traceability** - Direct links between user stories and source code  
✅ **Unified Test Execution** - Run both manual and automated tests  
✅ **Change Detection** - Track code changes via hashing  
✅ **Visual Dashboard** - HTML dashboard with traceability matrix  
✅ **No Vendor Lock-in** - All data stored in JSON files  
✅ **GitOps Integration** - Built-in Git operations  
✅ **Agile Boards** - Sprint and story management  

## Installation

```bash
npm install
npm run build
npm link  # Makes 'testmgr' command available globally
```

## Quick Start

```bash
# Initialize test management in your project
testmgr init

# Create a user story
testmgr story create

# Link a test to the story
testmgr test link

# Link code to the story
testmgr link-code

# Generate dashboard
testmgr dashboard

# View traceability matrix
testmgr matrix
```

## Commands

### Story Management

```bash
# Create a new user story
testmgr story create

# List all stories
testmgr story list
```

### Test Management

```bash
# Link a test to a story
testmgr test link

# Run a test
testmgr test run TEST-001
```

### Code Linking

```bash
# Link code to a story
testmgr link-code
```

### Reporting

```bash
# Generate HTML dashboard
testmgr dashboard

# Generate JSON report
testmgr dashboard --json

# Show traceability matrix in terminal
testmgr matrix
```

### Git Operations

```bash
# Sync repository
testmgr gitops sync ./path/to/repo
```

## Architecture

````
Custom Test Management System
├─ Test Registry (links tests to stories/code)
├─ Test Executor (manual + automated tests)
├─ Code Tracer (tracks code references)
├─ Dashboard Reporter (traceability visualization)
├─ GitOps Module (version control)
└─ Agile Module (sprint management)
````

## Data Storage

All data is stored in JSON files in the `test-data` directory (configurable):

- `stories.json` - User stories with acceptance criteria
- `tests.json` - Test cases (manual and automated)

Configuration is stored in `.testmgr/config.json`.

## Example Workflow

### 1. Create a User Story

```bash
testmgr story create
# Story ID: US-001
# Title: User Login
# Description: As a user, I want to log in
# Acceptance Criteria: Valid credentials, Error handling
```

### 2. Link Code to Story

```bash
testmgr link-code
# Story ID: US-001
# File path: src/auth/login.ts
# Start line: 10
# End line: 25
```

### 3. Create and Link Test

```bash
testmgr test link
# Test ID: TEST-001
# Story ID: US-001
# Name: Login Success Test
# Type: automated
# Script: npm test -- login.test.ts
```

### 4. Run Test

```bash
testmgr test run TEST-001
```

### 5. Generate Dashboard

```bash
testmgr dashboard
# Opens dashboard.html in browser
```

## Dashboard Features

The HTML dashboard shows:

- **Summary Cards** - Total stories, tests, pass/fail counts
- **Traceability Matrix** - Stories linked to tests and code
- **Test Results** - Latest execution results
- **Coverage** - Test coverage per story (0%, 50%, 100%)

## Configuration

Create `.testmgr/config.json`:

```json
{
  "dataDir": "./test-data",
  "workspaceRoot": "/path/to/workspace",
  "defaultExecutor": "system"
}
```

## API Usage

You can also use the system programmatically:

```typescript
import {
  TestRegistry,
  TestExecutor,
  CodeTracer,
  DashboardReporter
} from 'test-management-tooling';

// Initialize registry
const registry = new TestRegistry('./test-data');
await registry.initialize();

// Create story
const story = {
  id: 'US-001',
  title: 'User Login',
  description: 'Login functionality',
  acceptanceCriteria: ['Valid auth', 'Error handling'],
  status: 'in-progress',
  linkedTests: [],
  linkedCode: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

await registry.registerStory(story);

// Link code
const tracer = new CodeTracer(process.cwd());
const codeRef = await tracer.createReference('src/auth/login.ts', 10, 25);
await registry.linkCodeToStory('US-001', codeRef);

// Generate dashboard
const reporter = new DashboardReporter(registry);
await reporter.generateDashboard('./dashboard.html');
```

## TypeScript Types

```typescript
interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'draft' | 'ready' | 'in-progress' | 'testing' | 'done';
  linkedTests: string[];
  linkedCode: CodeReference[];
  createdAt: Date;
  updatedAt: Date;
}

interface TestCase {
  id: string;
  storyId: string;
  name: string;
  description: string;
  type: 'manual' | 'automated';
  status: 'pending' | 'passed' | 'failed' | 'blocked';
  automatedScript?: string;
  codeReferences: CodeReference[];
  results: TestResult[];
}

interface CodeReference {
  filePath: string;
  lineStart: number;
  lineEnd: number;
  functionName?: string;
  className?: string;
  hash: string; // For change detection
}
```

## Benefits Over External Tools

✅ **No Vendor Lock-in** - Own your data  
✅ **Direct Code Links** - Line-level traceability  
✅ **Git Integration** - Works with your workflow  
✅ **Offline First** - No internet required  
✅ **Customizable** - Extend as needed  
✅ **Free** - No subscription costs  

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run build:watch

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
