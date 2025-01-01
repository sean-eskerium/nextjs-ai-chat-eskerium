# Comprehensive Unit Test Plan for Refactoring

## Phase 1: Basic Import and Loading Tests

### 1.1 App Router Components
1. Pages
   ```typescript
   // Test each page component loads
   import Page from '../app/(chat)/page';
   import Layout from '../app/(chat)/layout';
   ```

2. API Routes
   ```typescript
   // Test each API route handler loads
   import { GET, POST } from '../app/(chat)/api/chat/route';
   ```

3. Server Actions
   ```typescript
   // Test server action imports
   import { createChat } from '../app/(chat)/actions';
   ```

### 1.2 Component Import Tests
[Previous component tests remain the same]

### 1.3 Library Code Tests
1. Database
   ```typescript
   // Test database utilities load
   import { db } from '../lib/db';
   import * as schema from '../lib/db/schema';
   ```

2. Editor
   ```typescript
   // Test editor utilities load
   import * as monaco from '../lib/editor/monaco';
   ```

3. AI Integration
   ```typescript
   // Test AI utilities load
   import * as openai from '../lib/ai/openai';
   ```

### 1.4 Configuration Tests
1. Next.js Config
   ```typescript
   // Test config loads
   import config from '../next.config';
   ```

2. TypeScript Config
   ```typescript
   // Test tsconfig paths resolve
   import { something } from '@/components/ui/button';
   ```

## Phase 2: Basic Function Accessibility

### 2.1 API Route Functions
1. Chat API
   ```typescript
   // Verify function signatures
   expect(typeof GET).toBe('function');
   expect(typeof POST).toBe('function');
   ```

2. Document API
   ```typescript
   // Verify exports
   expect(typeof createDocument).toBe('function');
   expect(typeof updateDocument).toBe('function');
   ```

### 2.2 Server Actions
1. Chat Actions
   ```typescript
   // Verify action accessibility
   expect(typeof createChat).toBe('function');
   expect(typeof updateChat).toBe('function');
   ```

2. Auth Actions
   ```typescript
   // Verify auth functions
   expect(typeof signIn).toBe('function');
   expect(typeof signOut).toBe('function');
   ```

### 2.3 Utility Functions
1. Database Utils
   ```typescript
   // Verify DB functions
   expect(typeof db.query).toBe('function');
   expect(typeof db.execute).toBe('function');
   ```

2. AI Utils
   ```typescript
   // Verify AI functions
   expect(typeof generateResponse).toBe('function');
   ```

## Phase 3: Import Path Testing

### 3.1 Path Resolution Tests
```typescript
// Test both old and new paths during migration
describe('Import Paths', () => {
  it('resolves old paths', () => {
    expect(() => import('@/components/ui/button')).not.toThrow();
  });
  
  it('resolves new paths', () => {
    expect(() => import('@/components/shared/button')).not.toThrow();
  });
});
```

### 3.2 Alias Resolution
```typescript
// Test path aliases work
describe('Path Aliases', () => {
  it('resolves @/ alias', () => {
    expect(() => import('@/utils/something')).not.toThrow();
  });
});
```

## Test Organization

### Directory Structure
```
src/__tests__/
  app/
    (chat)/
      page.test.tsx
      layout.test.tsx
      api/
        chat/
          route.test.ts
    (auth)/
      page.test.tsx
  components/
    [Previous component tests]
  lib/
    db.test.ts
    ai.test.ts
  config/
    next-config.test.ts
```

### Test Utilities
```typescript
// Import test helper
export const importTest = async (path: string) => {
  try {
    await import(path);
    return true;
  } catch (e) {
    return false;
  }
};

// Path resolution helper
export const resolvePath = (path: string) => {
  return path.startsWith('@/') 
    ? path.replace('@/', '../../src/') 
    : path;
};
```

## Migration Testing Strategy

### 1. Pre-Migration Tests
- Run all import tests with current paths
- Verify all functions are accessible
- Document current test results

### 2. During Migration
- Run tests after each file move
- Update test paths progressively
- Keep both old and new path tests until migration complete

### 3. Post-Migration
- Remove old path tests
- Verify all new paths work
- Run full test suite

## Test Execution

### Running Tests
```bash
# Test current paths
pnpm test --testPathPattern=current

# Test new paths
pnpm test --testPathPattern=new

# Test both
pnpm test
```

### Debugging
```typescript
// Add to jest.config.ts
{
  verbose: true,
  detectOpenHandles: true,
  logHeapUsage: true
}
```

## Success Criteria

### Phase 1
- All imports resolve successfully
- No module not found errors
- All function signatures verified

### Phase 2
- All functions accessible
- Correct types exported
- No undefined exports

### Phase 3
- All new paths resolve
- No deprecated paths used
- All aliases working

## Implementation Notes

1. Create test files before moving code
2. Run tests before and after each move
3. Keep both path tests until fully migrated
4. Update paths in batches by component type
5. Verify each batch before proceeding 