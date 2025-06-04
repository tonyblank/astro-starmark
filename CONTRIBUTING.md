# Contributing to StarMark

Thank you for your interest in contributing to StarMark! This guide will help you get set up for development.

## Development Setup

### Prerequisites

- **Node.js** 18+ (we test on 18, 20, 22)
- **pnpm** 8+ for package management
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/astro-starmark.git
   cd astro-starmark
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build all packages**
   ```bash
   pnpm build
   ```

4. **Run tests**
   ```bash
   pnpm test
   ```

5. **Start development server**
   ```bash
   pnpm --filter starmark.dev dev
   ```

## Project Structure

```
astro-starmark/
├── starmark-integration/     # Main StarMark Astro integration package
│   ├── src/                 # Integration source code
│   ├── tests/               # Unit and integration tests
│   └── dist/                # Built package output
├── starmark.dev/            # Documentation site (Starlight + dogfooding)
│   ├── src/content/docs/    # Documentation content
│   ├── e2e/                 # End-to-end tests
│   └── dist/                # Built site output
└── .github/workflows/       # CI/CD pipelines
```

## Development Commands

### Root Workspace Commands
```bash
pnpm install                 # Install all dependencies
pnpm build                   # Build all packages (via Turborepo)
pnpm test                    # Run all tests
pnpm lint                    # Lint all packages
pnpm format                  # Format all code
pnpm type-check              # TypeScript checking
```

### Package-Specific Commands
```bash
# StarMark Integration Package
pnpm --filter starmark-integration test
pnpm --filter starmark-integration test:watch
pnpm --filter starmark-integration build

# Documentation Site
pnpm --filter starmark.dev dev
pnpm --filter starmark.dev build
pnpm --filter starmark.dev preview
pnpm --filter starmark.dev test:e2e
```

## Testing

We use a modern testing stack:

- **Vitest** for unit and integration tests
- **Playwright** for E2E testing
- **TypeScript** strict mode for type safety

### Running Tests
```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests only  
pnpm test:integration

# E2E tests only
pnpm test:e2e

# Watch mode
pnpm test:unit --watch

# With coverage
pnpm test:unit --coverage
```

### Writing Tests

#### Unit Tests (Vitest)
```typescript
import { describe, test, expect } from 'vitest';

describe('ComponentName', () => {
  test('should behave correctly', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

#### E2E Tests (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('user can complete feedback flow', async ({ page }) => {
  await page.goto('http://localhost:4321/docs/getting-started');
  
  // Test interactions
  await page.getByTestId('feedback-widget').click();
  await expect(page.getByTestId('feedback-modal')).toBeVisible();
});
```

## Code Style

We use automated formatting and linting:

- **Prettier** for code formatting
- **ESLint** for code quality
- **TypeScript** for type safety

### Before Committing
```bash
pnpm lint      # Check for linting errors
pnpm format    # Auto-format code
pnpm build     # Ensure everything builds
pnpm test      # Run all tests
```

## Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/milestone-X` - Feature branches for each milestone

### Workflow
1. Create feature branch from `develop`
2. Implement following TDD (tests first)
3. Ensure all tests pass
4. Create Pull Request to `develop`
5. Code review and CI checks
6. Merge after approval

## CI/CD

Our GitHub Actions workflow runs:

- **Multi-platform testing** (Ubuntu, Windows, macOS)
- **Multi-version testing** (Node.js 18, 20, 22)
- **Type checking** with TypeScript
- **Linting** with ESLint
- **Formatting** checks with Prettier
- **Security audits** for vulnerabilities
- **E2E testing** with Playwright
- **Coverage reporting** with Codecov

All checks must pass before merging.

## Environment Variables

For local development, copy `env.example` to `.env`:

```bash
cp env.example .env
```

Required for full testing:
- `LINEAR_API_KEY` - Linear integration testing
- `LINEAR_TEAM_ID` - Linear team for test issues
- `AUTH0_*` - Auth0 integration (future milestone)

## Debugging

### Enable Debug Logging
```bash
DEBUG=starmark:* pnpm test
DEBUG=starmark:* pnpm --filter starmark.dev dev
```

### Playwright Debug Mode
```bash
pnpm test:e2e --debug
pnpm test:e2e --headed
```

### VSCode Configuration

Recommended extensions:
- Astro (astro-build.astro-vscode)
- TypeScript Importer (pmneo.tsimporter)
- Prettier (esbenp.prettier-vscode)
- ESLint (dbaeumer.vscode-eslint)
- Vitest (vitest.explorer)

## Release Process

We use Changesets for version management (configured but not active yet):

```bash
pnpm changeset         # Create a changeset
pnpm changeset version # Update versions  
pnpm changeset publish # Publish to npm
```

## Getting Help

- **Issues**: Check existing [GitHub Issues](https://github.com/your-org/astro-starmark/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/your-org/astro-starmark/discussions)
- **Documentation**: Visit [starmark.dev](https://starmark.dev)

## Code of Conduct

Please be respectful and constructive in all interactions. We're building this project together!

---

Ready to contribute? Start by checking out our [issue tracker](https://github.com/your-org/astro-starmark/issues) for `good-first-issue` labels. 