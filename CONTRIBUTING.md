# Contributing to Test Management Tooling

We welcome contributions from the community! This document provides guidelines and instructions for contributing to the Test Management Tooling project.

## Code of Conduct

Please be respectful and inclusive in all interactions with other contributors and maintainers. We are committed to providing a welcoming and harassment-free environment.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Git
- TypeScript knowledge (helpful but not required)

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/test-management-tooling.git
   cd test-management-tooling
   ```

3. **Add upstream remote** to stay synchronized:
   ```bash
   git remote add upstream https://github.com/original/test-management-tooling.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Running Tests in Watch Mode

```bash
npm run test:watch
```

### Linting and Formatting

```bash
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
npm run lint:fix    # Fix linting issues automatically
```

## Making Changes

### Code Style

- Follow the existing code style in the project
- Use TypeScript for all new features
- Write meaningful variable and function names
- Add JSDoc comments for public APIs
- Ensure all tests pass before submitting

### Commit Messages

Use clear, descriptive commit messages following this format:

```
[Type] Brief description

Detailed explanation if needed. Keep it concise but informative.

Type can be:
- feat: New feature
- fix: Bug fix
- docs: Documentation updates
- style: Code style changes (no logic changes)
- refactor: Code refactoring
- test: Test additions or updates
- chore: Build, dependencies, or tooling changes
```

Example:
```
[feat] Add MFA backup codes validation

- Implement backup code verification logic
- Add comprehensive test coverage
- Update API documentation
```

## Testing Requirements

- **All new features must include unit tests**
- **Maintain or improve code coverage**
- **Run the full test suite before submitting a PR**

```bash
npm test
npm run test:coverage
```

## Submitting a Pull Request

1. **Ensure your branch is up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub with:
   - Clear title describing the changes
   - Detailed description of what was changed and why
   - Reference to any related issues (e.g., "Closes #123")
   - Screenshots or examples if applicable

4. **PR Template**:
   ```markdown
   ## Description
   Brief explanation of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Breaking change

   ## How Has This Been Tested?
   Description of test coverage

   ## Checklist
   - [ ] Tests pass locally
   - [ ] Code follows project style
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

## Code Review Process

- At least one maintainer review required before merge
- Address feedback promptly
- Be open to suggestions and improvements
- Discussions should remain respectful and constructive

## Common Issues and Solutions

### TypeScript Compilation Errors

If you encounter type errors:
```bash
npm run build
```

### Test Failures

Run tests in verbose mode to identify issues:
```bash
npm test -- --verbose
```

### Dependency Issues

Clear cache and reinstall:
```bash
npm ci
```

## Project Structure

```
src/
├── modules/           # Feature modules
├── middleware/        # Express middleware
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Utility functions
└── types/            # TypeScript type definitions

tests/               # Test files
docs/                # Documentation
```

## Areas for Contribution

### High Priority
- [ ] Database integration (currently using mocks)
- [ ] Session management implementation
- [ ] Enhanced error handling and logging
- [ ] Performance optimizations
- [ ] Integration test suite

### Medium Priority
- [ ] Additional OAuth providers
- [ ] Advanced audit logging
- [ ] Rate limiting enhancements
- [ ] Documentation improvements
- [ ] Example applications

### Low Priority
- [ ] Code style refinements
- [ ] Additional test coverage
- [ ] Performance monitoring
- [ ] Developer experience improvements

## Documentation

When contributing, please update relevant documentation:

- **Code comments**: Document complex logic
- **README.md**: Update if adding new features
- **API docs**: Document new endpoints
- **ARCHITECTURE.md**: Update if changing structure
- **Type definitions**: Keep TypeScript types current

## Questions or Need Help?

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for general questions
- **Documentation**: Check existing docs first

## License

By contributing to Test Management Tooling, you agree that your contributions will be licensed under the MIT License.

## Recognition

We recognize and appreciate all contributions! Contributors will be:
- Listed in the project's contributor list
- Mentioned in release notes for significant contributions
- Invited to the contributor community channel

Thank you for contributing to Test Management Tooling! 🎉
