# StarMark

Feedback collection integration for Astro documentation sites.

## Development

### Running CI Checks Locally

**Important**: Always run CI checks locally before pushing to avoid pipeline failures!

```bash
# Quick check (recommended during development)
# Runs: type-check, lint, format-check, build
pnpm ci-check-quick

# Full CI check (run before pushing)
# Runs everything CI runs: type-check, lint, format-check, build, test, audit, e2e
pnpm ci-check
```

### Individual Commands

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Format checking
pnpm format:check

# Fix formatting
pnpm format

# Build all packages
pnpm build

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Security audit
pnpm audit
```

## Project Structure 