# Unit Testing Guide

## Test Preparation Checklist

Before writing any test file, complete these steps:

1. **Analyze Component Implementation**
   - Read the component's source code completely
   - Understand the component's purpose and functionality
   - Note any conditional rendering logic
   - Identify all props and their types
   - Check for any hooks or context usage

2. **Type Analysis**
   - Identify and import all required types/interfaces
   - Check for any custom type definitions
   - Understand union types and their constraints
   - Note any generic type parameters
   - Review prop type definitions thoroughly

3. **Dependencies**
   - List all external dependencies
   - Plan mock implementations
   - Check for any context providers needed
   - Identify any required test utilities
   - Note any global setup requirements

4. **Test Strategy**
   - Plan test categories (rendering, interaction, etc.)
   - List all test cases
   - Identify edge cases
   - Plan mock data structure
   - Consider test isolation requirements

## Writing Clean Tests

### First-Time-Right Approach

1. **Setup Phase**
   ```typescript
   // 1. Import all required dependencies and types
   import * as React from 'react';
   import { render, screen } from '@testing-library/react';
   import type { RequiredType } from './types';
   
   // 2. Mock external dependencies
   jest.mock('external-dep', () => ({
     someFunction: jest.fn()
   }));
   
   // 3. Prepare test data
   const mockData: RequiredType = {
     // Use correct types from the start
   };
   ```

2. **Test Structure**
   ```typescript
   describe('ComponentName', () => {
     // Common test setup
     const defaultProps = {
       // Use proper types for all props
     };

     beforeEach(() => {
       // Reset mocks and common setup
     });

     // Group related tests
     describe('rendering', () => {
       // Rendering tests
     });

     describe('interactions', () => {
       // Interaction tests
     });
   });
   ```

### Common Pitfalls to Avoid

1. **Type-Related Issues**
   - Don't assume prop types without checking
   - Always import required types
   - Use proper type assertions
   - Handle union types correctly

2. **Mock-Related Issues**
   - Mock all external dependencies
   - Provide proper mock implementations
   - Reset mocks between tests
   - Mock at the correct level

3. **Test Data Issues**
   - Use properly typed mock data
   - Avoid hardcoding test values
   - Use meaningful test data
   - Handle edge cases

## Testing Complex Components

### Component with Multiple States
```typescript
// 1. Define all possible states
const states = {
  default: { /* ... */ },
  loading: { /* ... */ },
  error: { /* ... */ }
} as const;

// 2. Test each state
Object.entries(states).forEach(([stateName, stateProps]) => {
  it(`renders correctly in ${stateName} state`, () => {
    render(<Component {...stateProps} />);
    // Assertions
  });
});
```

### Components with Context
```typescript
// 1. Create context wrapper
const wrapper = ({ children }) => (
  <ContextProvider value={mockContextValue}>
    {children}
  </ContextProvider>
);

// 2. Use in tests
it('works with context', () => {
  render(<Component />, { wrapper });
});
```

## Best Practices for Clean Tests

1. **Preparation**
   - Always analyze component before writing tests
   - Understand all types and interfaces
   - Plan test cases before implementation
   - Prepare mock data with correct types

2. **Implementation**
   - Write tests in logical groups
   - Use meaningful test descriptions
   - Keep tests focused and isolated
   - Follow AAA pattern (Arrange, Act, Assert)

3. **Maintenance**
   - Keep tests simple and readable
   - Use helper functions for common operations
   - Document complex test setups
   - Update tests when component changes

4. **Type Safety**
   - Use TypeScript's type system effectively
   - Avoid type assertions when possible
   - Keep types in sync with implementation
   - Test edge cases of union types

Remember: The time spent understanding the component and its types before writing tests will save more time than fixing lint errors afterward. 