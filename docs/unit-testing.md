# Unit Testing Documentation

## Overview

This document outlines our unit testing strategy for the application, specifically focused on ensuring component dependencies and imports continue to work correctly during the transition to the Fuse React directory structure.

## Testing Stack

- **Jest**: Our primary testing framework
- **React Testing Library**: For testing React components
- **@testing-library/jest-dom**: For additional DOM testing utilities
- **@testing-library/user-event**: For simulating user interactions
- **web-streams-polyfill**: For mocking streaming responses in tests

## Test Organization

Our tests are organized in the `__tests__` directory, mirroring the structure of our source code:

```
__tests__/
  components/
    ui/           # UI component tests
    chat.test.tsx # Chat component tests
    ...
  app/
    api/          # API route tests
    chat/         # Chat page tests
  config/        # Test configuration
    setup.ts     # Global test setup
```

## Test Driven Development (TDD)

### Overview
We follow a TDD approach for all new features and modifications. The process is:

1. Write tests first based on expected behavior
2. Run tests (they should fail)
3. Implement the feature
4. Run tests again (they should pass)
5. Refactor if needed while keeping tests passing

### TDD Process for Different Components

#### API Routes
```typescript
// 1. Write the test first
describe('POST /api/chat', () => {
  it('handles chat message creation', async () => {
    const mockRequest = {
      json: () => Promise.resolve({
        messages: [{ role: 'user', content: 'Hello' }],
        id: 'test-chat',
        modelId: 'test-model',
      }),
    };

    const response = await POST(mockRequest as any);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  });
});

// 2. Implement the route handler
export async function POST(req: Request) {
  const body = await req.json();
  // Implementation follows...
}
```

#### React Components
```typescript
// 1. Write the test first
describe('ChatInput', () => {
  it('submits message on enter', async () => {
    const onSubmit = jest.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Hello{enter}');
    
    expect(onSubmit).toHaveBeenCalledWith('Hello');
  });
});

// 2. Implement the component
export function ChatInput({ onSubmit }: Props) {
  // Implementation follows...
}
```

### TDD Guidelines

1. **Test Structure**
   - Write descriptive test names that explain the behavior
   - Group related tests using `describe` blocks
   - Use `beforeEach` for common setup
   - Clean up after tests using `afterEach`

2. **Test Coverage**
   - Aim for 90%+ coverage on new code
   - Test both success and error cases
   - Test edge cases and boundary conditions

3. **Mocking Strategy**
   - Mock external dependencies
   - Use Jest's mock functions for callbacks
   - Keep mocks as simple as possible

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

#### Global Mocks (in `__tests__/config/setup.ts`)
```typescript
// Mock streaming responses
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;
global.Response = class extends Object {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super();
    Object.assign(this, {
      status: init?.status || 200,
      headers: new Headers(init?.headers),
      body: body,
    });
  }
} as any;

// Mock TextDecoder
class MockTextDecoder {
  encoding = 'utf-8';
  fatal = false;
  ignoreBOM = false;
  decode() {
    return 'test response';
  }
}
global.TextDecoder = MockTextDecoder as any;
```

#### Component-Level Mocks
```typescript
jest.mock('../../components/toolbar', () => ({
  Toolbar: () => <div data-testid="mock-toolbar" />
}));
```

#### API Mocks
```typescript
jest.mock('ai', () => {
  const mockStream = new ReadableStream({
    start(controller) {
      controller.enqueue('test response');
      controller.close();
    },
  });

  const mockResponse = new Response(mockStream, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
  mockResponse.mergeIntoDataStream = jest.fn();

  return {
    StreamingTextResponse: jest.fn().mockImplementation(() => mockResponse),
    experimental_StreamData: jest.fn(),
    // ... other mocks
  };
});
```

## Test Coverage Goals

### Priority 1: Core Components
- `chat.tsx`
- `message.tsx`
- `markdown.tsx`
- `editor.tsx`
- All UI components
- All API routes

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
    jest.clearAllMocks();
  });

  it('renders with all dependencies', () => {
    render(<ComponentName {...mockProps} />);
    // Verify dependencies are loaded
  });
});
```

### 3. API Route Test Template

```typescript
import { POST } from './route';

describe('API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles successful request', async () => {
    const mockRequest = {
      json: () => Promise.resolve({ /* request body */ }),
    };

    const response = await POST(mockRequest as any);
    expect(response.status).toBe(200);
    
    // For streaming responses
    const reader = response.body?.getReader();
    const { value } = await reader?.read() || {};
    const text = new TextDecoder().decode(value);
    expect(text).toBe('expected response');
  });
});
```

## Common Testing Patterns

### 1. Provider Components

Components that require providers should be wrapped:

```typescript
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      {ui}
    </TooltipProvider>
  );
};
```

### 2. Streaming Response Testing

For components or routes that use streaming:

```typescript
// Mock streaming response
const mockStream = new ReadableStream({
  start(controller) {
    controller.enqueue('test response');
    controller.close();
  },
});

const mockResponse = new Response(mockStream, {
  headers: { 'content-type': 'text/plain; charset=utf-8' },
});
mockResponse.mergeIntoDataStream = jest.fn();
```

### 3. Next.js Specific Mocks

```typescript
// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  notFound: jest.fn(),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
  headers: () => new Map(),
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

# Run tests with coverage
pnpm test --coverage
```

### Debugging Tests

1. Use `screen.debug()` to view the rendered DOM
2. Use `console.log` with `beforeEach` to debug setup
3. Use Jest's `--verbose` flag for detailed output
4. Use the debugger statement in tests
5. Use VS Code's Jest extension for inline debugging

## Best Practices

1. **Test First Development**
   - Write tests before implementing features
   - Use tests to drive the design
   - Keep tests focused and minimal

2. **Mock Strategy**
   - Mock external dependencies
   - Mock complex child components
   - Keep mocks simple and maintainable
   - Use Jest's mock functions for callbacks

3. **Maintainability**
   - Group related tests
   - Use descriptive test names
   - Keep test files focused
   - Update tests when modifying code

4. **Coverage**
   - Maintain high coverage for critical paths
   - Test error conditions
   - Test edge cases
   - Don't sacrifice quality for coverage

## Next Steps

1. Complete test coverage for UI components
2. Add tests for feature components
3. Add tests for utility functions
4. Set up CI/CD integration
5. Implement automated coverage reporting

## Conclusion

This testing strategy ensures our components and features are thoroughly tested using a TDD approach. The tests serve as both documentation and a safety net, quickly identifying any issues during development and refactoring. 