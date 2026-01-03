# Zebrunner Testing & CI/CD Documentation

## Overview

Comprehensive testing framework and CI/CD pipeline for Zebrunner's modular architecture.

## Directory Structure

```
test-management-tooling/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Main CI pipeline
│       ├── release.yml         # Release automation
│       └── code-quality.yml    # Quality & coverage
├── tests/
│   ├── test_runner.sh          # Test orchestrator
│   ├── test_helpers.sh         # Assertion utilities
│   ├── test_ui.sh              # UI module tests
│   ├── test_config.sh          # Config module tests
│   ├── test_setup.sh           # Setup module tests
│   ├── test_lifecycle.sh       # Lifecycle module tests
│   ├── test_backup.sh          # Backup module tests
│   ├── test_upgrade.sh         # Upgrade module tests
│   └── test_integration.sh     # Integration tests
└── lib/
    └── *.sh                    # Modules under test
```

## Running Tests Locally

### Quick Start

```bash
# Navigate to tests directory
cd tests

# Run all tests
bash test_runner.sh

# Run specific test file
bash test_ui.sh
bash test_config.sh
bash test_lifecycle.sh
```

### Individual Module Testing

```bash
# Test UI module
cd tests
bash test_ui.sh

# Test configuration
bash test_config.sh

# Test setup logic
bash test_setup.sh

# Test lifecycle management
bash test_lifecycle.sh

# Test backup/restore
bash test_backup.sh

# Test upgrade functionality
bash test_upgrade.sh

# Integration tests
bash test_integration.sh
```

### Make Tests Executable

```bash
# Make all test scripts executable
chmod +x tests/*.sh

# Make main script executable
chmod +x zebrunner.sh

# Make lib modules executable
chmod +x lib/*.sh
```

## Test Framework

### Test Helpers

The `test_helpers.sh` provides assertion utilities:

**Assertions:**
- `assert_equals expected actual [message]`
- `assert_not_equals not_expected actual [message]`
- `assert_contains haystack needle [message]`
- `assert_file_exists file [message]`
- `assert_function_exists function_name [message]`
- `assert_exit_code expected_code actual_code [message]`

**Utilities:**
- `mock_function function_name [return_value]`
- `capture_output command`

### Writing Tests

Example test file structure:

```bash
#!/bin/bash

# Test file header
TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TESTS_DIR")"

# Load helpers
source "$TESTS_DIR/test_helpers.sh"

# Mock dependencies
dependency_function() { :; }

# Source module under test
source "$PROJECT_ROOT/lib/module.sh"

# Write test functions
test_function_exists() {
    assert_function_exists "my_function" "Function should exist"
}

test_function_behavior() {
    local result=$(my_function "input")
    assert_equals "expected" "$result" "Should return expected value"
}

# Run all tests
test_function_exists
test_function_behavior

echo "All module tests passed!"
```

## GitHub Actions CI/CD

### Workflows

#### 1. **Main CI Pipeline** (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`, `master`, `develop` branches
- Pull requests to `main`, `master`, `develop`
- Manual workflow dispatch

**Jobs:**
1. **Lint** - ShellCheck analysis
2. **Unit Tests** - Run all unit tests
3. **Integration Tests** - Validate integrations
4. **Security Scan** - Check for vulnerabilities
5. **Docker Validation** - Validate docker-compose
6. **Documentation** - Check docs completeness
7. **Build Summary** - Generate pipeline report

**Usage:**
```bash
# Automatically runs on push/PR
git push origin main

# Or trigger manually via GitHub Actions UI
```

#### 2. **Release Pipeline** (`.github/workflows/release.yml`)

**Triggers:**
- Push tags matching `v*.*.*` (e.g., `v2.6.0`)
- Manual workflow dispatch with version input

**Jobs:**
1. **Create Release** - Build release artifacts
2. **Generate Changelog** - Auto-generate from commits
3. **Run Tests** - Validate before release
4. **Create Archive** - Package release files
5. **GitHub Release** - Publish to GitHub

**Usage:**
```bash
# Create and push tag
git tag v2.6.0
git push origin v2.6.0

# Or use GitHub UI to trigger manual release
```

#### 3. **Code Quality** (`.github/workflows/code-quality.yml`)

**Triggers:**
- Push to main branches
- Pull requests
- Weekly schedule (Sundays)

**Jobs:**
1. **ShellCheck Analysis** - Comprehensive linting
2. **Code Complexity** - Analyze complexity metrics
3. **Test Coverage** - Calculate coverage percentage
4. **Dependency Check** - Security vulnerability scan
5. **Quality Gate** - Overall quality validation

**Artifacts:**
- `shellcheck-results` - Linting report
- `complexity-report.md` - Complexity metrics
- `coverage-report.md` - Test coverage analysis

## Test Coverage

### Current Coverage

| Module | Functions | Tests | Coverage |
|--------|-----------|-------|----------|
| ui.sh | 2 | 7 | ~100% |
| config.sh | 3 | 6 | ~100% |
| setup.sh | 9 | 10 | ~100% |
| lifecycle.sh | 6 | 8 | ~100% |
| backup.sh | 2 | 4 | ~100% |
| upgrade.sh | 2 | 3 | ~100% |

### Coverage Reports

Generated automatically by CI pipeline:

```bash
# View coverage locally
cd tests
bash test_runner.sh

# View in GitHub Actions
# Navigate to Actions → Code Quality → Artifacts → coverage-report.md
```

## Continuous Integration Best Practices

### Pre-commit Checklist

```bash
# 1. Run local tests
cd tests && bash test_runner.sh

# 2. Lint with ShellCheck
shellcheck zebrunner.sh lib/*.sh

# 3. Check file permissions
chmod +x zebrunner.sh lib/*.sh

# 4. Validate docker-compose (if modified)
docker compose config

# 5. Stage and commit
git add .
git commit -m "Your message"
git push
```

### Pull Request Workflow

1. **Create branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and test locally
   ```bash
   cd tests && bash test_runner.sh
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```

4. **CI automatically runs:**
   - Linting
   - Unit tests
   - Integration tests
   - Security scan
   - Code quality checks

5. **Review pipeline results** in GitHub Actions tab

6. **Merge when all checks pass** ✅

### Release Workflow

1. **Prepare release**
   ```bash
   # Update version in relevant files
   # Update CHANGELOG.md
   git add .
   git commit -m "Prepare release v2.6.0"
   ```

2. **Create and push tag**
   ```bash
   git tag -a v2.6.0 -m "Release version 2.6.0"
   git push origin v2.6.0
   ```

3. **Release pipeline automatically:**
   - Runs all tests
   - Creates release archive
   - Generates changelog
   - Publishes GitHub release

4. **Download artifacts** from GitHub Releases page

## Monitoring & Debugging

### View Test Results

**Locally:**
```bash
cd tests
bash test_runner.sh
# Colored output shows pass/fail status
```

**GitHub Actions:**
1. Navigate to repository → Actions tab
2. Click on workflow run
3. View job logs and artifacts

### Debug Failed Tests

**Local debugging:**
```bash
# Run specific test with verbose output
bash -x tests/test_ui.sh

# Add debug statements
set -x  # Enable debug mode
```

**CI debugging:**
- View job logs in GitHub Actions
- Download artifacts for reports
- Check `$GITHUB_STEP_SUMMARY` for summaries

### Common Issues

#### Tests fail locally but pass in CI
- Check environment differences (paths, permissions)
- Ensure dependencies are installed
- Verify script execution permissions

#### CI pipeline fails
- Check workflow YAML syntax
- Verify branch protection rules
- Check GitHub Actions permissions

#### Coverage reports missing
- Ensure artifacts are uploaded
- Check job dependencies
- Verify workflow triggers

## Security Best Practices

### Automated Security Checks

1. **ShellCheck** - Static analysis for shell scripts
2. **Credential scanning** - Detects hardcoded passwords
3. **Command injection** - Checks for unsafe eval usage
4. **Dependency scanning** - Checks Docker image versions

### Manual Security Reviews

```bash
# Check for hardcoded credentials
grep -r "password=" . --include="*.sh"

# Check for unsafe eval
grep -r "eval" . --include="*.sh"

# Check file permissions
find . -name "*.sh" -type f ! -perm 644
```

## Extending the Test Suite

### Adding New Tests

1. **Create test file:**
   ```bash
   touch tests/test_new_module.sh
   chmod +x tests/test_new_module.sh
   ```

2. **Follow test template:**
   ```bash
   #!/bin/bash
   TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
   PROJECT_ROOT="$(dirname "$TESTS_DIR")"
   source "$TESTS_DIR/test_helpers.sh"
   
   # Source module
   source "$PROJECT_ROOT/lib/new_module.sh"
   
   # Write tests
   test_my_function() {
       assert_equals "expected" "$(my_function)"
   }
   
   # Run tests
   test_my_function
   echo "All tests passed!"
   ```

3. **Test runner automatically discovers new tests** (prefix with `test_*.sh`)

### Adding CI/CD Workflows

Create new workflow in `.github/workflows/`:

```yaml
name: My Custom Workflow

on:
  push:
    branches: [ main ]

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run custom task
        run: echo "Custom task"
```

## Performance Testing

### Benchmark Tests

Add performance tests for critical operations:

```bash
test_function_performance() {
    local start=$(date +%s%N)
    
    # Run function
    my_function
    
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))  # milliseconds
    
    # Assert performance threshold
    if [[ $duration -lt 1000 ]]; then
        echo "Performance test passed: ${duration}ms"
        return 0
    else
        echo "Performance test failed: ${duration}ms (threshold: 1000ms)"
        return 1
    fi
}
```

## Maintenance

### Regular Tasks

**Weekly:**
- Review code quality reports
- Check dependency updates
- Monitor test failures

**Monthly:**
- Update GitHub Actions versions
- Review and update test coverage
- Clean up old workflow runs

**Quarterly:**
- Major dependency updates
- Security audit
- Performance optimization review

## Troubleshooting

### Tests failing after refactoring
1. Check module dependencies
2. Verify function signatures
3. Update mocks in test files

### CI pipeline timeout
1. Optimize long-running tests
2. Parallelize test execution
3. Increase timeout in workflow

### Coverage reports inaccurate
1. Ensure all tests execute
2. Check test discovery logic
3. Verify coverage calculation

## Resources

- **GitHub Actions Docs:** https://docs.github.com/actions
- **ShellCheck:** https://www.shellcheck.net/
- **Bash Testing:** https://github.com/sstephenson/bats
- **Docker Compose:** https://docs.docker.com/compose/

---

**Last Updated:** January 3, 2026
**Test Framework Version:** 1.0
**CI/CD Pipeline Version:** 1.0
