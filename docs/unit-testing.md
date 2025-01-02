# Unit Testing Guide

## Part 1: Essential Testing Requirements
> Focus on these sections when writing your first tests for a component

### Core Principle
The secret to writing perfect tests is to focus on user-visible behavior and accessibility first, implementation details last.

### Pro Tip
Analyze the `__tests__` folder as those are working tests. See `unit-testing-examples.md` for concrete examples.

### Success-Driven Analysis Process

#### 1. Component Analysis (MANDATORY FIRST STEP)
Before writing ANY test code:
- Render the component manually in the app
- Interact with it as a user would
- Write down EXACTLY what you see:
  - What text is visible?
  - What ARIA labels are present?
  - What happens when you click/hover?
  - What changes visually after interactions?
  - What multi-step processes exist?
  - What confirmation dialogs appear?
- Use browser dev tools to inspect:
  - Actual ARIA roles and labels
  - Actual tooltip content
  - Actual button text
  - Modal/dialog content
  - Menu structures
- Map out component hierarchy:
  - Parent-child relationships
  - Nested UI components
  - Dialog/modal layers
- Document the minimal steps to verify it works

For examples of DOM structure analysis and state mapping, see `unit-testing-examples.md`.

#### 2. Dependencies Analysis
ONLY list dependencies that affect user-visible behavior:
- ✅ DO Mock:
  - Routing if it changes visible URLs
  - Tooltips that users see
  - Click handlers that change visible state
  - Icons that users see
  - Animation components (e.g., framer-motion)
  - Window/document methods used in handlers
- ❌ DON'T Mock:
  - Styling utilities (like cn, cx)
  - Internal state management
  - Class merging logic
  - Style-only components

For examples of mocking strategies, see `unit-testing-examples.md`.

#### 3. Basic Test Writing Process

CRITICAL: Element Selection Strategy
1. NEVER modify production code to add test-specific attributes
2. Instead, use the existing DOM structure:
   - Role-based queries for interactive elements: `screen.getByRole('button', { name: /restore this version/i })`
   - Text content for non-interactive elements: `screen.getByText('You are viewing a previous version')`
   - DOM relationships: `getByText('Restore this version').nextElementSibling`
   - CSS class combinations: `container.querySelector('div.flex.flex-col.gap-4.rounded-2xl')`
3. Order of preference:
   a. Role-based queries with accessible names
   b. Text content that users see
   c. DOM relationships (parent/sibling/child)
   d. Specific combinations of CSS classes
   e. data-testid as ABSOLUTE LAST RESORT

Example - Finding elements without modifying production code:
```typescript
// ❌ DON'T modify production code to add test hooks
// weather.tsx
<div data-testid="weather-container" className="flex flex-col">

// ✅ DO use existing structure
// weather.test.tsx
const container = screen.getByText('30°C').closest('div.flex.flex-col');
// OR
const container = container.querySelector('div.flex.flex-col.gap-4.rounded-2xl');

// ❌ DON'T modify production code for loading states
// version-footer.tsx
<div data-testid="loading-spinner" className="animate-spin">

// ✅ DO use DOM relationships
// version-footer.test.tsx
const loadingContainer = screen.getByText('Restore this version').nextElementSibling;
expect(loadingContainer).toHaveClass('animate-spin');
```

Common Patterns from Our Codebase:
1. Finding containers:
   ```typescript
   // Use class combinations
   const container = container.querySelector('div.flex.flex-col.gap-4');
   
   // Use text content and traverse up
   const container = screen.getByText('Some Text').closest('div.container');
   ```

2. Finding interactive elements:
   ```typescript
   // Use role + name
   const button = screen.getByRole('button', { name: /restore this version/i });
   
   // Use role + accessible text
   const input = screen.getByRole('textbox', { name: /message/i });
   ```

3. Finding related elements:
   ```typescript
   // Use DOM relationships
   const label = screen.getByText('Username');
   const input = label.nextElementSibling;
   
   // Use parent-child relationships
   const container = screen.getByRole('region');
   const items = container.querySelectorAll('.item');
   ```

Remember:
- The DOM structure is part of your component's contract
- Class names used for styling are more stable than test-specific attributes
- Role-based queries align with how users (including screen readers) interact with your app
- Text content is a reliable way to find elements as it's what users see
- DOM relationships (parent/child/sibling) are often more stable than adding test attributes

### Essential Test Organization
1. Place mocks at the top of the file
2. Group related mocks together
3. Document mock requirements
4. Keep mocks minimal

### Common Mistakes to Avoid
❌ DON'T:
- Test implementation details (class names, internal state)
- Mock styling utilities or class merging
- Make assumptions about markup structure
- Test framework-specific features
- Miss steps in multi-step processes
- Assume dialogs are immediately visible
- Use ambiguous selectors for similar elements
- Skip confirmation steps

✅ DO:
- Test what users see and interact with
- Use ARIA roles and labels for queries
- Mock only what affects user behavior
- Verify visible changes after interactions
- Document complete interaction flows
- Wait for dialog animations
- Use specific selectors for similar elements
- Handle all confirmation steps

### Essential Test Checklist
Before writing any test code, verify:
1. [ ] You've manually used the component in the app
2. [ ] You've documented exact visible text and labels
3. [ ] You've listed all user interactions
4. [ ] You've noted what changes visually
5. [ ] You've identified proper ARIA roles
6. [ ] You've determined minimal mocks needed
7. [ ] You're focusing only on user-visible behavior
8. [ ] You've mapped out all multi-step processes
9. [ ] You've identified all component dependencies
10. [ ] You've planned specific selectors for similar elements

## Part 2: Component Analysis and Test Writing
> These are critical steps for writing comprehensive tests

### Component Behavior Analysis
1. Document Expected Behavior
   - [ ] List all user interactions
   - [ ] Document expected outcomes
   - [ ] Note any side effects
   - [ ] List error conditions
   - [ ] Document loading states

2. Identify State Changes
   - [ ] List all state variables
   - [ ] Document state transitions
   - [ ] Note loading states
   - [ ] List error states
   - [ ] Document side effects

3. Map User Interactions
   - [ ] List all clickable elements
   - [ ] Document hover states
   - [ ] Note keyboard interactions
   - [ ] List form interactions
   - [ ] Document drag-and-drop

### Test Writing Process
1. Start with Accessibility
   - Focus on what screen readers see
   - Test ARIA roles and labels
   - Verify keyboard navigation

2. Add Visible Content
   - Test what users actually see
   - Check tooltips and visible text
   - Verify visual state changes

3. Test Multi-Step Processes
   - Document complete interaction flows
   - Test each step in sequence
   - Verify side effects

4. Test State Transitions
   - Test initial state
   - Test loading states
   - Test success/error states
   - Test final state

### Common Pitfalls and Solutions
1. **Async Operations**
   - ❌ Problem: Tests pass locally but fail in CI
   - ✅ Solution: Always use proper async/await and waitFor

2. **State Updates**
   - ❌ Problem: State changes not reflected in tests
   - ✅ Solution: Use act() for state updates, waitFor for async changes

3. **Event Handling**
   - ❌ Problem: Events not triggering as expected
   - ✅ Solution: Use userEvent over fireEvent when possible

4. **Component Mounting**
   - ❌ Problem: useEffect not running in tests
   - ✅ Solution: Ensure proper cleanup, use proper async utilities

## Part 3: Framework-Specific Guidelines

### Next.js Testing Guidelines
1. Router Handling
   - Mock useRouter consistently
   - Test navigation events
   - Verify route changes

2. Image Component
   - Mock next/image appropriately
   - Test image loading states
   - Verify responsive behavior

3. API Routes
   - Mock API responses
   - Test error conditions
   - Verify loading states

### React Query Guidelines
1. Query Setup
   - Use QueryClientProvider
   - Mock query responses
   - Test loading states

2. Mutation Handling
   - Test optimistic updates
   - Verify error handling
   - Test rollback behavior

### React Testing Best Practices
1. Component Testing
   - Test user interactions
   - Verify state changes
   - Check side effects

2. Hook Testing
   - Test state updates
   - Verify cleanup
   - Test error conditions

## Part 4: Advanced Testing Considerations
> After basic tests are working, consider these aspects for comprehensive testing

### State Management Analysis
- [ ] Document all state variables and their purposes
- [ ] Map state transitions and side effects
- [ ] Identify optimistic updates and loading states
- [ ] Understand error state handling
- [ ] Review state initialization
- [ ] Document state dependencies between components
- [ ] Map async state updates
- [ ] Identify state persistence requirements
- [ ] List conditions required for state changes
- [ ] Document state prerequisites for callbacks

### UI/UX Flow Analysis
- [ ] Map all possible user interaction paths
- [ ] Document expected behavior for each interaction
- [ ] List all visual states and transitions
- [ ] Identify accessibility requirements
- [ ] Document keyboard navigation flows
- [ ] Map focus management requirements
- [ ] List animation states and triggers
- [ ] Document responsive behavior
- [ ] Identify multi-step interactions
- [ ] Map out complete interaction sequences

### Technical Dependencies
- [ ] List all external libraries used
- [ ] Document UI framework-specific features
- [ ] Note any custom hooks or utilities
- [ ] Identify performance considerations
- [ ] List required providers
- [ ] Document API dependencies
- [ ] Map WebSocket interactions
- [ ] Review build dependencies
- [ ] Understand animation library requirements
- [ ] Document testing library limitations

## Part 5: Production Code Preservation

### Critical Principles
1. Never modify production code to make tests easier
2. Tests should adapt to production code, not vice versa
3. If tests are hard to write, improve test infrastructure
4. Document and understand before testing
5. Use proper mocking and async patterns

### Test Adaptation Strategies
When encountering difficulties making tests work with production code:

1. **Understand Before Changing**
- Study the actual implementation
- Document the behavior
- Test the real functionality

2. **Mock Complex Dependencies**
- Mock only what's necessary
- Preserve actual behavior
- Use proper mocking patterns

3. **Handle Async Properly**
- Use proper async utilities
- Wait for state changes
- Test actual async behavior

4. **Preserve Event Handling**
- Test real event flows
- Maintain event propagation
- Verify event outcomes

5. **Maintain UI Library Integration**
- Mock UI libraries properly
- Preserve component behavior
- Test actual interactions

### Common Anti-Patterns to Avoid

1. **Environment-Based Code Paths**
   - ❌ Using `process.env.NODE_ENV === 'test'` to change behavior
   - ✅ Write tests that work with actual implementation

2. **Simplified Production Code**
   - ❌ Making code simpler just for testing
   - ✅ Write better test infrastructure

3. **Mock-Driven Development**
   - ❌ Changing code to be more mockable
   - ✅ Develop better mocking strategies

4. **Timing Modifications**
   - ❌ Removing timeouts/delays for tests
   - ✅ Use proper async testing patterns

5. **Feature Toggles for Tests**
   - ❌ Adding flags to disable features in tests
   - ✅ Test features as they exist in production

## Part 6: Organization and Code Review

#### Code Review Checklist
- [ ] Tests follow naming conventions
- [ ] Mocks are properly typed
- [ ] Tests focus on user-visible behavior
- [ ] Proper async handling is used
- [ ] Mocks are minimal and necessary
- [ ] Error cases are covered
- [ ] Performance implications considered
- [ ] Accessibility tests included
- [ ] Test isolation maintained
- [ ] Proper cleanup implemented
- [ ] Documentation updated

### Common Pitfalls and Solutions

#### Test Organization Pitfalls
1. **Unclear Test Structure**
   - ❌ Problem: Tests are hard to follow and maintain
   - ✅ Solution: Use describe blocks to group related tests

2. **Poor Naming**
   - ❌ Problem: Test names don't describe what's being tested
   - ✅ Solution: Use descriptive names that explain the scenario and expected outcome

3. **Missing Edge Cases**
   - ❌ Problem: Only happy path is tested
   - ✅ Solution: Include error states, boundary conditions, and edge cases

#### Technical Pitfalls
1. **Async Operations**
   - ❌ Problem: Tests pass locally but fail in CI
   - ✅ Solution: Always use proper async/await and waitFor

2. **State Updates**
   - ❌ Problem: State changes not reflected in tests
   - ✅ Solution: Use act() for state updates, waitFor for async changes

3. **Event Handling**
   - ❌ Problem: Events not triggering as expected
   - ✅ Solution: Use userEvent over fireEvent when possible

4. **Component Mounting**
   - ❌ Problem: useEffect not running in tests
   - ✅ Solution: Ensure proper cleanup, use proper async utilities

5. **Mock Management**
   - ❌ Problem: Mocks interfering between tests
   - ✅ Solution: Clear all mocks in afterEach

### Organization Guidelines

#### Test Structure
1. Group related tests together
2. Order tests by complexity
3. Start with basic rendering
4. Move to interaction tests
5. End with complex flows

#### Test Naming
1. Use descriptive names
2. Include the scenario being tested
3. Describe expected behavior
4. Group related tests under describe blocks

#### Mock Organization
1. Place mocks at the top of the file
2. Group related mocks together
3. Document mock requirements
4. Keep mocks minimal

## References
- See `unit-testing-examples.md` for:
  - DOM structure examples
  - Mock examples
  - Test pattern examples
  - Class testing examples
  - Real-world component examples
- Check `__tests__` folder for working examples
- Review Jest and Testing Library documentation for best practices 
