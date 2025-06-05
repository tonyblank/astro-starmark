# CLAUDE.md - Astro StarMark Project Guide

## Project Overview

**Astro StarMark** is a feedback collection plugin for Astro Starlight documentation sites. It enables users to submit context-aware feedback directly on documentation pages through text highlighting and categorized feedback submission. The feedback is routed to issue trackers (Linear) and databases for triage by documentation teams.

### Key Goals
- Intuitive UI/UX for submitting documentation feedback
- Text highlighting with inline feedback capability
- Extensible backend storage system (Linear, Astro DB, Cloudflare D1)
- Full accessibility (WCAG 2.2 AA) and internationalization support
- Minimal performance impact using Astro Islands architecture
- Developer-friendly configuration and customization

## Current Status

**Completed Milestones:**
- ✅ Milestone 1: Scaffold Integration (Project Setup)
- ✅ Milestone 2: Floating Widget Component
- ✅ Milestone 3: Feedback Modal & Form UI
- ✅ Milestone 4: Frontend->Backend Submission Logic

**Current Work:**
- 🚧 Milestone 5: Storage Connectors (on branch: `migrate_to_taskmaster_claude`)

**Test Coverage:** 47/47 unit tests passing, comprehensive E2E test suite

## Project Structure

```
/Users/blank/projects/astro-starmark/
├── starmark-integration/          # Core plugin package
│   ├── src/
│   │   ├── client/               # UI components
│   │   │   ├── FeedbackWidget.astro
│   │   │   └── FeedbackModal.astro
│   │   ├── index.ts             # Main integration file
│   │   ├── types.ts             # TypeScript definitions
│   │   ├── constants.ts         # Shared constants
│   │   ├── feedback-data.ts     # Data models & validation
│   │   └── components.ts        # Component exports
│   └── tests/                   # Comprehensive test suite
└── starmark.dev/                # Marketing/docs/dogfooding site
    ├── src/
    │   └── pages/
    │       └── api/
    │           └── feedback.ts  # API endpoint
    └── e2e/                     # E2E test suite
```

## Architecture & Design Decisions

### Technology Stack
- **Framework**: Pure Astro/Vanilla TypeScript (NO React/Vue/etc)
- **Build**: PNPM workspaces + Turborepo
- **Testing**: Vitest (unit/integration) + Playwright (E2E) + MSW v2 (API mocking)
- **Validation**: Zod schemas for runtime validation
- **Styling**: Starlight CSS variables for native theming

### Key Design Patterns
1. **Pluggable Storage Connectors**: Interface-based design for extensibility
2. **Graceful Degradation**: Integration never breaks builds, validates config safely
3. **Astro Islands**: Minimal hydration with `client:idle` for performance
4. **TypeScript-First**: Full type safety with exported declarations
5. **Test-Driven Development**: Write tests before implementation

## Development Workflow

### Quick Commands
```bash
# Install dependencies
pnpm install

# Development
pnpm --filter starmark.dev dev          # Start docs site with plugin
pnpm --filter starmark-integration test  # Run plugin tests
pnpm test                               # Run all tests
pnpm build                              # Build all packages

# Testing
pnpm test:unit                          # Unit tests
pnpm test:e2e                           # E2E tests (requires browsers)
pnpm test:watch                         # Watch mode
```

### Running the Project
1. Start the development server: `pnpm --filter starmark.dev dev`
2. Navigate to: http://localhost:4321
3. The feedback widget appears on all documentation pages
4. Click widget or select text to test feedback flow

## Milestone 5: Storage Connectors Implementation Plan

### Overview
Implement pluggable storage system with auto-discovery. Linear as "point of truth" for issues, Astro DB for analytics and optional feedback storage, with registry pattern for extensibility.

### Key Tasks

#### 1. Storage Connector Interface & Registry
```typescript
interface StorageConnector {
  name: string;
  store(feedback: FeedbackData): Promise<StorageResult>;
  health(): Promise<boolean>;
  getAnalytics?(): Promise<AnalyticsData>; // Optional - mainly for DB connectors
  detect(): Promise<boolean>; // Auto-detection capability
}

class StorageRegistry {
  register(connector: StorageConnector): void;
  detectAvailable(): Promise<StorageConnector[]>;
  getByName(name: string): StorageConnector | null;
}
```

#### 2. Linear Connector (Priority - Point of Truth)
- **Purpose**: Primary issue tracking for documentation team triage
- GraphQL mutations for issue creation with rich formatting
- Rate limiting protection and retry logic with exponential backoff
- Team/project configuration with proper labeling
- Error handling for API failures

#### 3. Astro DB Connector (Analytics + Optional Storage)
- **Purpose**: Analytics, reporting, and optional backup feedback storage
- Schema definition with Drizzle ORM (feedback table + analytics views)
- Support for development (SQLite) and production (Turso/D1)
- Analytics queries: feedback trends, category distribution, page stats
- Migration system for schema updates
- Can serve as primary storage for sites without Linear

#### 4. Cloudflare Environment Fix
- Handle `context.env` vs `process.env` differences for CF Pages/Workers
- Create CloudflareEnvAdapter for unified environment variable access
- Runtime environment detection (local vs CF)
- Proper secret handling for production deployments

#### 5. Endpoint Integration with Registry
- Integrate StorageRegistry for auto-discovery of available connectors
- Parallel execution with error isolation (Linear failure shouldn't block DB)
- Structured logging with correlation IDs for debugging
- Circuit breaker pattern for connector health monitoring
- Configuration-driven connector selection

### Implementation Order
1. **Storage Connector Interface** - Define base types and registry pattern
2. **Linear Connector** - Point of truth for issues (highest priority)
3. **Astro DB Connector** - Analytics and backup storage
4. **Environment Variable Adapter** - Cloudflare compatibility
5. **Registry Integration** - Update endpoint to use connector pattern
6. **Error Handling & Health Checks** - Production resilience
7. **Analytics Service** - Reporting capabilities

## Milestone 5.5: Standalone Highlight Module

### Overview
Create `@starmark/highlighter` as separate npm package for text selection and annotation. Framework-agnostic module that can be reused across projects.

### Package Details
- **Name**: `@starmark/highlighter`
- **Location**: Separate package in monorepo (potential future: separate repo/submodule)
- **Purpose**: Lightweight text highlighting with contextual tooltips
- **Framework**: TypeScript, framework-agnostic (no React/Vue dependencies)

### Key Features

#### 1. Text Selection Detection
- DOM Selection API integration (`window.getSelection()`)
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile touch selection support
- Keyboard selection detection (Shift+Arrow keys)

#### 2. Highlight Rendering
- Temporary `<mark>` element wrapping
- Customizable highlight styling (CSS custom properties)
- Clean removal without DOM artifacts
- Performance-optimized for large documents

#### 3. Contextual Tooltip
- Positioning logic with viewport awareness
- "Add Feedback" button with accessibility
- CSS-based styling with theme customization
- Auto-dismiss on click outside or ESC key

#### 4. Selection Data Capture
```typescript
interface SelectionData {
  text: string;
  contextSelector?: string;
  boundingRect: DOMRect;
  pageOffset: { x: number; y: number };
  metadata?: Record<string, any>;
}

// API Usage
highlighter.onSelection((selection: SelectionData) => {
  // Open feedback modal with pre-filled text
  openFeedbackModal(selection.text);
});
```

#### 5. API Design
```typescript
import { createHighlighter } from '@starmark/highlighter';

const highlighter = createHighlighter(containerElement, {
  highlightClass: 'custom-highlight',
  tooltipContent: 'Add Feedback',
  onSelection: (data) => handleSelection(data),
  styling: {
    highlightColor: '#ffeb3b',
    tooltipTheme: 'dark'
  }
});
```

### Implementation Tasks
1. **Package Setup** - Separate package.json, build config, TypeScript setup
2. **Core Selection Logic** - DOM Selection API integration
3. **Highlight Rendering** - Mark element creation and cleanup
4. **Tooltip Component** - Positioning and interaction logic
5. **Event Management** - Selection detection and cleanup
6. **Accessibility** - Keyboard navigation and ARIA labels
7. **Testing Suite** - JSDOM unit tests + Playwright browser tests
8. **Documentation** - README, API docs, usage examples
9. **StarMark Integration** - Import and use in feedback widget

### Integration with StarMark
- StarMark will import `@starmark/highlighter` as dependency
- Integration in `FeedbackWidget.astro` component
- Configuration passed through StarMark plugin options
- Callback integration with feedback modal opening

## Testing Strategy

### Unit Tests (Vitest)
- Test each connector in isolation with mocked APIs
- Validate data transformation and error handling
- Use MSW v2 for HTTP mocking

### Integration Tests
- Test connector registry and auto-discovery
- Validate parallel execution and error isolation
- Test with real SQLite for DB connector

### E2E Tests (Playwright)
- Full user flow with text selection
- Form submission and success states
- Cross-browser compatibility

## Configuration

### Plugin Configuration (astro.config.mjs)
```javascript
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starmark({
          // Storage configuration
          linear: {
            apiKey: process.env.LINEAR_API_KEY,
            teamId: 'team-id',
            projectId: 'project-id'
          },
          astroDb: true,
          
          // UI configuration
          categories: ['Typo', 'Confusing', 'Outdated', 'Missing', 'Other'],
          
          // Future: Auth configuration
          auth: {
            provider: 'auth0',
            domain: 'your-tenant.auth0.com',
            clientId: process.env.AUTH0_CLIENT_ID
          }
        })
      ]
    })
  ]
});
```

### Environment Variables

**For Testing (starmark.dev/.env):**
```bash
# Linear Integration (Primary - Point of Truth for Issues)
LINEAR_API_KEY=your_linear_api_key_here
LINEAR_TEAM_ID=your_linear_team_id

# Astro DB (Analytics + Optional Feedback Storage)
# Development uses SQLite automatically
# Production would use Turso or D1

# Future: Auth0 Integration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_secret

# Development
DEBUG=starmark:*
NODE_ENV=development
```

**Note:** The starmark.dev site should have a `.env` file with your Linear credentials for testing the storage connectors. We can add these as you provide them.

## Code Standards & Patterns

### TypeScript
- Strict mode enabled
- Explicit return types for public APIs
- Zod schemas for runtime validation
- Proper error types with discriminated unions

### Testing
- Follow TDD: test first, implement second
- Mock external dependencies (Linear API, etc)
- Use real implementations where possible (SQLite)
- Aim for >90% coverage on critical paths

### Error Handling
```typescript
interface StorageResult {
  success: boolean;
  id?: string;
  error?: Error;
  retryable?: boolean;
}
```

### Accessibility
- All interactive elements keyboard accessible
- ARIA labels and roles properly implemented
- Focus management in modal (trap, restore)
- Screen reader announcements for dynamic content

## Future Milestones Overview

### Milestone 6: Authentication Integration
- Auth0 implementation (primary)
- Modular auth provider system
- Anonymous feedback support
- Session management

### Milestone 7: Text Highlighting
- Custom annotation module development
- Selection API integration
- Contextual tooltip UI
- Mobile support

### Milestone 8: Inline Links & Categories
- Strategic "Confused?" link placement
- Dynamic category management
- Admin interface (optional)

### Milestone 9: Polish & i18n
- WCAG 2.2 AA compliance
- Full internationalization
- Performance optimization
- Theme integration

### Milestone 10: Open Source Release
- Comprehensive documentation
- Example sites and templates
- npm publication
- Community setup

## Known Issues & Considerations

### Current Limitations
1. No actual storage implementation yet (API returns success only)
2. Authentication configuration exists but not implemented
3. Text highlighting detection exists but UI not complete
4. No internationalization support yet

### Technical Debt
- Need to implement proper focus trap in modal
- Astro DB schema definition pending
- Environment variable handling needs Cloudflare adapter
- Missing comprehensive E2E test coverage

### Performance Considerations
- Widget uses `client:idle` hydration
- Modal loaded on-demand
- Highlight script minimal footprint
- Target <50KB total bundle size

## Resources & Documentation

### Internal Documentation
- `.cursor/checklist` - Detailed milestone checklist
- `.cursor/docs` - Technical specifications
- `.cursor/context` - Current development context
- `.cursor/rules` - Development rules and guidelines
- `.taskmaster/docs/prd.txt` - Complete PRD with feature specs

### External Resources
- [Astro Documentation](https://docs.astro.build)
- [Starlight Documentation](https://starlight.astro.build)
- [Linear API Documentation](https://developers.linear.app)
- [Astro DB Documentation](https://docs.astro.build/en/guides/astro-db/)

## Contact & Support

For questions or issues:
- GitHub Issues: (Repository will be public after milestone 10)
- Internal Slack: #starmark-dev channel
- Documentation: starmark.dev (once deployed)

## Development Philosophy

1. **Test-Driven Development**: Always write tests first
2. **Graceful Degradation**: Never break user's builds
3. **Performance First**: Minimal JavaScript, smart hydration
4. **Accessibility Always**: WCAG 2.2 AA compliance required
5. **Developer Experience**: Clear APIs, good documentation
6. **Extensibility**: Interfaces over implementations

---

This guide provides everything needed to understand and contribute to the Astro StarMark project. Focus on completing Milestone 5 (Storage Connectors) following the TDD approach and architectural patterns established in the first four milestones.