# .cursor Folder - AI Development Context

This folder contains context files that help Cursor and AI assistants understand the StarMark project better. These files provide comprehensive information about the project's goals, architecture, and development practices.

## Files Overview

### 📋 `checklist` 
**TDD Implementation Checklist** - Detailed, test-first implementation plan with 6 milestones covering project setup through Auth0 integration. Each milestone includes specific test code examples and implementation steps following strict TDD methodology.

### 🔧 `context`
**Current Development Context** - Quick reference for development commands, project status, testing patterns, and templates. Contains practical examples for modern testing with Vitest, Playwright, MSW v2, and Astro components.

### 📚 `docs`
**Technical Specifications** - Complete technical documentation covering features, architecture, data flow, storage connectors, testing strategy, performance requirements, and deployment details.

### 📖 `rules`
**Development Rules** - Comprehensive development guidelines including TDD rules, testing philosophy, code quality standards, architecture principles, security considerations, and CI/CD pipeline configuration.

## Purpose

These files serve multiple purposes:

1. **AI Context**: Provide comprehensive project understanding for AI assistants
2. **Development Reference**: Quick access to commands, patterns, and best practices
3. **Onboarding**: Complete project overview for new team members
4. **Standards**: Enforce consistent development practices and quality standards

## Project Architecture Summary

- **Monorepo**: PNPM workspaces + Turborepo for build orchestration
- **Core Package**: `starmark-integration/` - The main Astro StarMark plugin
- **Marketing & Docs Site**: `starmark.dev/` - starmark.dev marketing and documentation site that also uses StarMark for feedback (dogfooding)
- **Testing Stack**: Vitest + Playwright + MSW v2 + Testing Library (2025 modern stack)
- **TDD Approach**: Strict test-first development with 90%+ coverage requirements

## Development Workflow

1. Start with failing test (TDD)
2. Implement minimal code to pass test
3. Refactor while keeping tests green
4. All features require AI agent code review approval
5. CI/CD pipeline enforces quality gates

## Quick Start Commands

```bash
# Development
pnpm install              # Install all dependencies
pnpm --filter starmark.dev dev    # Start starmark.dev site (marketing + docs + dogfooding)

# Testing
pnpm test                 # Run all tests
pnpm test:e2e            # Run E2E tests
pnpm test:unit           # Run unit tests

# Build
pnpm build               # Build all packages
```

## Notes

- All milestones use test-first development
- Each feature branch requires AI agent approval before merge
- The starmark.dev site serves triple purpose: marketing + documentation + dogfooding environment
- Modern 2025 testing stack with streamlined tooling
- Comprehensive accessibility and performance requirements

---

*This folder structure is designed to provide maximum context to AI assistants while maintaining clear separation of concerns and comprehensive project documentation for Astro StarMark.* 