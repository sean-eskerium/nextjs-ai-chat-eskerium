# Unit Testing Documentation

## Overview

This document outlines our unit testing strategy for the application, specifically focused on ensuring component dependencies and imports continue to work correctly during the transition to the Fuse React directory structure.

## Testing Stack

- **Jest**: Our primary testing framework
- **React Testing Library**: For testing React components
- **@testing-library/jest-dom**: For additional DOM testing utilities
- **@testing-library/user-event**: For simulating user interactions

## Test Organization

Our tests are organized in the `__tests__` directory, mirroring the structure of our source code:

```
__tests__/
  components/
    ui/           # UI component tests
    chat.test.tsx # Chat component tests
    ...
  config/        # Test configuration
    jest.setup.ts
    jest.env.setup.ts
```

## Testing Strategy

### 1. Component Import Testing

The primary goal is to ensure components can load their dependencies correctly. Each test should verify:

- Component can be imported
- Required sub-components are available
- Props are correctly typed
- Basic rendering works

### 2. Component Categories

#### UI Components (`components/ui/`)
- Simple, self-contained components
- Focus on basic rendering and prop validation
- Examples: Button, Input, Select

#### Feature Components (`components/`)
- More complex, composed components
- Focus on dependency loading and basic functionality
- Examples: Chat, Message, Editor

### 3. Mock Strategy

We use several types of mocks to isolate components:

#### Global Mocks
```typescript
// Example from __mocks__/react-markdown.tsx
const ReactMarkdown: React.FC<{ children: string }> = ({ children }) => {
  return <div data-testid="markdown">{children}</div>;
};
```

#### Component-Level Mocks
```typescript
jest.mock('../../components/toolbar', () => ({
  Toolbar: () => <div data-testid="mock-toolbar" />
}));
```

#### Hook Mocks
```typescript
jest.mock('../../components/ui/sidebar', () => ({
  useSidebar: () => ({ open: false }),
}));
```

## Test Coverage Goals

### Priority 1: Core Components
- `chat.tsx`
- `message.tsx`
- `markdown.tsx`
- `editor.tsx`
- All UI components

### Priority 2: Feature Components
- `toolbar.tsx`
- `sidebar-history.tsx`
- `document.tsx`
- `block.tsx`

### Priority 3: Utility Components
- `icons.tsx`
- `theme-provider.tsx`
- Other utility components

## Test Implementation Guide

### 1. Basic Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './path-to-component';

describe('ComponentName', () => {
  it('renders successfully', () => {
    render(<ComponentName />);
    // Basic assertions
  });
});
```

### 2. Complex Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './path-to-component';

// Mock dependencies
jest.mock('./dependency', () => ({
  DependencyComponent: () => <div data-testid="mock-dependency" />
}));

describe('ComponentName', () => {
  const mockProps = {
    // Define required props
  };

  beforeEach(() => {
    // Setup before each test
  });

  it('renders with all dependencies', () => {
    render(<ComponentName {...mockProps} />);
    // Verify dependencies are loaded
  });
});
```

## Common Testing Patterns

### 1. Provider Components

Components that require providers (e.g., TooltipProvider) should be wrapped:

```typescript
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      {ui}
    </TooltipProvider>
  );
};
```

### 2. Window Size Testing

For components that use window size:

```typescript
// Mock window size at component level
jest.mock('../../components/component', () => {
  const Original = jest.requireActual('../../components/component').Component;
  return {
    Component: (props: any) => {
      (window as any).innerWidth = 1024;
      (window as any).innerHeight = 768;
      return <Original {...props} />;
    }
  };
});
```

### 3. Router Dependencies

For components using Next.js router:

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));
```

## Test Execution

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test path/to/test

# Run tests in watch mode
pnpm test --watch
```

### Debugging Tests

1. Use `screen.debug()` to view the rendered DOM
2. Use `console.log` with `beforeEach` to debug setup
3. Use Jest's `--verbose` flag for detailed output

## Best Practices

1. **Minimal Testing**
   - Test component loading
   - Test basic rendering
   - Test critical paths only

2. **Mock Strategy**
   - Mock external dependencies
   - Mock complex child components
   - Keep mocks simple

3. **Maintainability**
   - Group related tests
   - Use descriptive test names
   - Keep test files focused

## Next Steps

1. Complete test coverage for UI components
2. Add tests for feature components
3. Add tests for utility functions
4. Set up CI/CD integration

## Conclusion

This testing strategy focuses on ensuring our components can be safely moved to the new Fuse React directory structure. The tests serve as a safety net, quickly identifying any broken dependencies or import issues during the transition. 