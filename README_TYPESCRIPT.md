# Zebrunner Platform - TypeScript Migration

## Overview

The Zebrunner platform has been migrated from Bash scripts to TypeScript/Node.js for improved:
- **Type safety** - Catch errors at compile time
- **Cross-platform support** - Works on Windows, macOS, Linux
- **Better testing** - Jest test framework with mocking
- **Modern tooling** - ESLint, Prettier, better IDE support
- **Maintainability** - Modular architecture with clear interfaces

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (for running services)

## Installation

### From Source

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Link CLI globally (optional)
npm link

# Or run directly without building
npm run dev -- [command]
```

### From NPM Package

```bash
npm install -g zebrunner-platform
```

## Usage

### Basic Commands

```bash
# Show help
zebrunner help

# Setup platform
zebrunner setup

# Start services
zebrunner start

# Stop services
zebrunner stop

# Restart services
zebrunner restart

# Complete shutdown with volume removal
zebrunner shutdown

# Show versions
zebrunner version

# Enable/disable services
zebrunner enable reporting
zebrunner disable mcloud
```

### Git/GitOps Commands

```bash
# Initialize repository
zebrunner repo init

# Clone repository
zebrunner repo clone <url>

# Show status
zebrunner repo status

# Browse files
zebrunner repo browse

# View commit history
zebrunner repo log

# Show diff
zebrunner repo diff

# Sync repository
zebrunner repo sync

# Enable GitOps
zebrunner gitops enable --url <repository-url>
```

### Agile Board Commands

```bash
# Initialize agile board
zebrunner agile init

# Create board
zebrunner agile board create <name>

# Create sprint
zebrunner agile sprint create <boardId> <name>

# Start sprint
zebrunner agile sprint start <sprintId>

# Create story
zebrunner agile story create <boardId> <title> --estimate 8

# Update story status
zebrunner agile story status <storyId> in-progress

# Link test to story
zebrunner agile story link-test <storyId> ./tests/test.ts

# Link repository
zebrunner agile story link-repo <storyId> <repoUrl> --auto-detect

# View metrics
zebrunner agile metrics <boardId>

# Complete sprint
zebrunner agile sprint complete <sprintId>
```

See [AGILE_BOARD_GUIDE.md](./AGILE_BOARD_GUIDE.md) for comprehensive agile board documentation.

See [GITOPS_GUIDE.md](./GITOPS_GUIDE.md) for comprehensive GitOps documentation.

### Development Mode

```bash
# Run without building (uses ts-node)
npm run dev -- start
npm run dev -- --help

# Watch mode (auto-rebuild)
npm run build:watch
```

### Debug Mode

```bash
# Enable debug logging
zebrunner --debug start
```

## Project Structure

```
src/
├── cli.ts                    # Main CLI entry point
├── types/
│   └── index.ts              # TypeScript type definitions
├── modules/
│   ├── ui.ts                 # UI/Display module
│   ├── config.ts             # Configuration management
│   ├── lifecycle.ts          # Service lifecycle
│   ├── gitops.ts             # Git/GitOps operations
│   ├── repository-viewer.ts  # Repository browser
│   ├── setup.ts              # Setup orchestration
│   ├── backup.ts             # Backup/restore
│   ├── upgrade.ts            # Version upgrades
│   └── __tests__/            # Module tests
├── utils/
│   ├── logger.ts             # Logging utilities
│   ├── shell.ts              # Shell command execution
│   └── __tests__/            # Utility tests
└── index.ts                  # Package entry point
```

## Development

### Build

```bash
# Compile TypeScript
npm run build

# Clean build artifacts
npm run clean

# Clean and rebuild
npm run clean && npm run build
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Run all checks
npm run lint && npm run format && npm test
```

### Type Checking

```bash
# TypeScript type checking
npx tsc --noEmit
```

## Testing

The project uses Jest for testing with TypeScript support.

### Writing Tests

```typescript
import { Logger } from '../utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log info message', () => {
    Logger.info('Test');
    expect(console.log).toHaveBeenCalled();
  });
});
```

### Running Specific Tests

```bash
# Run specific test file
npm test -- logger.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Logger"

# Run with verbose output
npm test -- --verbose
```

### Coverage Thresholds

Minimum coverage requirements (configured in jest.config.js):
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Configuration

### TypeScript Configuration (tsconfig.json)

Key compiler options:
- **Target**: ES2022
- **Module**: CommonJS
- **Strict mode**: Enabled
- **Source maps**: Enabled for debugging

### ESLint Configuration (.eslintrc.json)

- TypeScript-specific rules
- Recommended best practices
- Type-aware linting

### Jest Configuration (jest.config.js)

- ts-jest preset for TypeScript
- Coverage reporting (text, lcov, html)
- Test matching patterns

## Dependencies

### Production Dependencies

- **commander** - CLI framework
- **inquirer** - Interactive prompts
- **chalk** - Terminal colors
- **ora** - Loading spinners
- **figlet** - ASCII art banner
- **boxen** - Terminal boxes
- **shelljs** - Shell command execution
- **yaml** - YAML parsing
- **dotenv** - Environment variable loading

### Development Dependencies

- **typescript** - TypeScript compiler
- **ts-node** - TypeScript execution
- **jest** - Testing framework
- **ts-jest** - Jest TypeScript integration
- **eslint** - Code linting
- **prettier** - Code formatting

## CI/CD Integration

### GitHub Actions Workflows

The CI/CD pipelines have been updated for Node.js/TypeScript:

#### CI Pipeline (.github/workflows/ci-node.yml)

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
    
- run: npm ci
- run: npm run lint
- run: npm test
- run: npm run build
```

#### Release Pipeline

```yaml
- run: npm run build
- run: npm pack
- uses: actions/upload-artifact@v3
  with:
    name: npm-package
    path: '*.tgz'
```

## Migration from Bash

### Key Changes

| Bash | TypeScript | Benefit |
|------|-----------|---------|
| `echo` | `Logger.info()` | Consistent, colored output |
| `function name()` | `class Module { method() }` | OOP, better organization |
| `$()` command substitution | `ShellExecutor.exec()` | Error handling, type safety |
| `if [ -f file ]` | `fs.existsSync()` | Cross-platform |
| `test_function()` | `describe('name', () => { it('should...') })` | Better test structure |

### Bash to TypeScript Examples

**Before (Bash):**
```bash
function print_banner() {
    echo "ZEBRUNNER"
}
```

**After (TypeScript):**
```typescript
static printBanner(): void {
  const banner = figlet.textSync('ZEBRUNNER');
  console.log(chalk.cyan(banner));
}
```

**Before (Bash):**
```bash
if ! command -v docker &> /dev/null; then
    echo "Docker not found"
    exit 1
fi
```

**After (TypeScript):**
```typescript
if (!ShellExecutor.isDockerAvailable()) {
  throw new Error('Docker is not installed');
}
```

## Troubleshooting

### Build Issues

**Error: `Cannot find module 'typescript'`**
```bash
npm install
```

**Error: `tsc: command not found`**
```bash
npm install -g typescript
# Or use npx
npx tsc
```

### Runtime Issues

**Error: `docker: command not found`**
- Ensure Docker is installed and in PATH
- Check: `docker --version`

**Error: Module not found**
```bash
# Rebuild project
npm run clean && npm run build
```

### Test Issues

**Tests failing with import errors**
```bash
# Clear Jest cache
npm test -- --clearCache
```

## Performance

TypeScript/Node.js offers similar performance to Bash for I/O-bound operations:

- **Startup time**: ~100ms (vs 10ms for Bash)
- **Command execution**: Identical (both spawn processes)
- **File operations**: Comparable
- **Benefit**: Cross-platform, better error handling, type safety

## Future Enhancements

- [ ] Add setup module with interactive prompts
- [ ] Implement backup/restore modules
- [ ] Add upgrade module with patch management
- [ ] Create REST API for programmatic access
- [ ] Add web UI for visual management
- [ ] Docker image for containerized CLI
- [ ] Kubernetes deployment support

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Lint and format: `npm run lint:fix && npm run format`
6. Commit changes: `git commit -m "Add feature"`
7. Push: `git push origin feature/my-feature`
8. Create Pull Request

### Code Style

- Use TypeScript strict mode
- Write tests for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Document public APIs with JSDoc

## License

Apache-2.0

## Support

- Documentation: https://zebrunner.com/documentation
- Issues: https://github.com/zebrunner/zebrunner/issues
- Slack: https://zebrunner.slack.com

---

**Migrated from Bash to TypeScript**: January 2026
**Node.js Version**: >=18.0.0
**TypeScript Version**: ^5.3.3
