# Fuse React Integration Refactor Plan

## Current Structure Analysis

### Core Areas
1. App Directory (Next.js App Router)
   - Chat routes and pages
   - Auth routes
   - API routes
   - Server actions

2. Components
   - UI components
   - Feature components
   - Layout components

3. Library Code
   - Database utilities
   - Editor utilities
   - AI integration
   - General utilities

4. Configuration
   - Next.js config
   - TypeScript config
   - Testing config
   - Environment variables

## Target Fuse React Structure

### Root Level
```
src/
  app/             # Next.js app directory
  auth/            # Authentication logic
  components/      # Shared components
  hooks/           # React hooks
  store/           # State management
  types/           # TypeScript types
  utils/           # Utility functions
  configs/         # Configuration files
  __mocks__/       # Jest mocks
  __tests__/       # Test files
```

### Component Organization
```
src/components/
  shared/          # Shared UI components
  chat/            # Chat-specific components
  document/        # Document-specific components
  layout/          # Layout components
```

## Migration Strategy

### Phase 1: Infrastructure Setup
1. Create new directory structure
   ```bash
   mkdir -p src/{app,auth,components/{shared,chat,document,layout},hooks,store,types,utils,configs}
   ```

2. Move configuration files
   - Move Jest config to `src/configs`
   - Update paths in configs
   - Update import aliases

### Phase 2: Component Migration
1. UI Components
   - Move from `components/ui` to `src/components/shared`
   - Update import paths
   - Run tests to verify

2. Feature Components
   - Move from `components` to appropriate subdirectories
   - Update import paths
   - Run tests to verify

### Phase 3: App Directory Migration
1. Pages and Routes
   - Move from `app` to `src/app`
   - Update import paths
   - Verify routing still works

2. API Routes
   - Move from `app/api` to `src/app/api`
   - Update import paths
   - Test API endpoints

### Phase 4: Library Code Migration
1. Utilities
   - Move from `lib` to `src/utils`
   - Update import paths
   - Run tests to verify

2. Hooks
   - Move from `hooks` to `src/hooks`
   - Update import paths
   - Run tests to verify

### Phase 5: Test Migration
1. Test Files
   - Move from `__tests__` to `src/__tests__`
   - Update import paths in tests
   - Update Jest configuration
   - Run full test suite

## Import Path Updates

### 1. Component Imports
```typescript
// Old
import { Button } from '@/components/ui/button'

// New
import { Button } from '@/components/shared/button'
```

### 2. Utility Imports
```typescript
// Old
import { db } from '@/lib/db'

// New
import { db } from '@/utils/db'
```

### 3. Hook Imports
```typescript
// Old
import { useChat } from '@/hooks/use-chat'

// New
import { useChat } from '@/hooks/chat/use-chat'
```

## Testing Strategy During Migration

### 1. Test File Updates
- Update paths in all test files
- Update mock imports
- Update test utilities

### 2. Jest Configuration
```typescript
// Update moduleNameMapper in jest.config.ts
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

### 3. Test Running
- Run tests after each component move
- Fix failing tests before proceeding
- Maintain test coverage

## Rollback Plan

### 1. Git Strategy
- Create feature branch for migration
- Commit after each phase
- Maintain ability to roll back

### 2. Backup
- Backup all configuration files
- Document all changes
- Keep old structure until verified

## Verification Steps

### 1. Component Verification
- Import resolution
- Proper rendering
- Maintained functionality

### 2. Route Verification
- Page loading
- API endpoints
- Server actions

### 3. Build Verification
- Development build
- Production build
- Type checking

## Success Criteria

### 1. Functionality
- All features work as before
- No regression in behavior
- All tests passing

### 2. Performance
- Build size maintained/improved
- Runtime performance maintained
- No new bottlenecks

### 3. Developer Experience
- Clear import paths
- Logical file organization
- Improved maintainability 