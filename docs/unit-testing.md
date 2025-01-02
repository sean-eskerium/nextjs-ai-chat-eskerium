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

## Part 4: Advanced Testing Patterns

### Async Operation Testing
1. **Choosing the Right Wait Method**
   ```typescript
   // ❌ DON'T: Use multiple separate waits
   await waitFor(() => expect(api).toHaveBeenCalled());
   await waitFor(() => expect(setMessages).toHaveBeenCalled());
   
   // ✅ DO: Group related async expectations
   await waitFor(() => {
     expect(api).toHaveBeenCalled();
     expect(setMessages).toHaveBeenCalled();
   });
   
   // ✅ DO: Use findBy for elements that appear
   const errorMessage = await screen.findByText('Error occurred');
   
   // ✅ DO: Use waitForElementToBeRemoved for disappearing elements
   await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
   ```

2. **Testing Loading States**
   ```typescript
   it('shows and hides loading state', async () => {
     const user = userEvent.setup();
     render(<Component />);
     
     // Click action that triggers loading
     await user.click(screen.getByRole('button'));
     
     // Verify loading state
     expect(screen.getByRole('button')).toBeDisabled();
     expect(screen.getByText('Loading...')).toBeInTheDocument();
     
     // Wait for loading to complete
     await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
     
     // Verify final state
     expect(screen.getByRole('button')).toBeEnabled();
   });
   ```

3. **Sequential Async Operations**
   ```typescript
   it('handles multi-step async process', async () => {
     const user = userEvent.setup();
     
     // Setup mocks with delayed responses
     const mockApi = jest.fn().mockImplementation(() => 
       new Promise(resolve => setTimeout(resolve, 100))
     );
     
     render(<Component api={mockApi} />);
     
     // Start process
     await user.click(screen.getByRole('button', { name: 'Start' }));
     
     // Verify first loading state
     expect(screen.getByText('Step 1...')).toBeInTheDocument();
     
     // Wait for first step to complete
     await waitForElementToBeRemoved(() => screen.queryByText('Step 1...'));
     
     // Verify intermediate state
     expect(screen.getByText('Step 2...')).toBeInTheDocument();
     
     // Wait for final state
     await waitFor(() => {
       expect(screen.getByText('Complete')).toBeInTheDocument();
     });
   });
   ```

### Advanced Mock Setup

1. **Hook Mocking Patterns**
   ```typescript
   // ❌ DON'T: Use simple return values for complex hooks
   jest.mock('useMyHook', () => jest.fn());
   
   // ✅ DO: Mock complete hook interface
   jest.mock('useMyHook', () => ({
     useMyHook: jest.fn().mockReturnValue({
       data: mockData,
       loading: false,
       error: null,
       mutate: jest.fn(),
     })
   }));
   
   // ✅ DO: Document hook dependencies
   /**
    * Hook Dependencies:
    * - data: Required for initial render
    * - loading: Controls loading state
    * - error: Required for error handling
    * - mutate: Called on form submit
    */
   ```

2. **Mock Verification in Async Context**
   ```typescript
   it('verifies mock calls after async operations', async () => {
     const mockSetMessages = jest.fn();
     
     render(<Component setMessages={mockSetMessages} />);
     
     // Trigger async operation
     await user.click(screen.getByRole('button'));
     
     // Wait for all async operations
     await waitFor(() => {
       // Verify mock was called
       expect(mockSetMessages).toHaveBeenCalled();
       
       // Get the updater function
       const updater = mockSetMessages.mock.calls[0][0];
       
       // Verify the update logic
       const result = updater(previousMessages);
       expect(result).toEqual(expectedMessages);
     });
   });
   ```

3. **Error State Mocking**
   ```typescript
   describe('error handling', () => {
     it('handles API errors', async () => {
       // Mock API error
       const mockError = new Error('API Error');
       mockApi.mockRejectedValueOnce(mockError);
       
       render(<Component />);
       
       // Trigger error
       await user.click(screen.getByRole('button'));
       
       // Verify error state
       await waitFor(() => {
         expect(screen.getByText('Error: API Error')).toBeInTheDocument();
         expect(screen.getByRole('button')).toBeEnabled();
       });
       
       // Verify error cleanup
       await user.click(screen.getByRole('button', { name: 'Retry' }));
       expect(screen.queryByText('Error:')).not.toBeInTheDocument();
     });
   });
   ```

### State Management Testing

1. **Testing State Updates with Side Effects**
   ```typescript
   it('updates state and triggers side effects', async () => {
     const mockSetState = jest.fn();
     const mockSideEffect = jest.fn();
     
     render(<Component setState={mockSetState} onUpdate={mockSideEffect} />);
     
     // Trigger state change
     await user.click(screen.getByRole('button'));
     
     // Wait for all effects
     await waitFor(() => {
       // Verify state update
       expect(mockSetState).toHaveBeenCalledWith(expect.any(Function));
       
       // Verify side effect
       expect(mockSideEffect).toHaveBeenCalledWith(newState);
     });
   });
   ```

2. **Testing State Transitions**
   ```typescript
   it('handles state transitions correctly', async () => {
     render(<Component />);
     
     // Initial state
     expect(screen.getByText('Initial')).toBeInTheDocument();
     
     // Trigger transition
     await user.click(screen.getByRole('button'));
     
     // Loading state
     expect(screen.getByText('Loading...')).toBeInTheDocument();
     
     // Wait for final state
     await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
     expect(screen.getByText('Complete')).toBeInTheDocument();
     
     // Verify no loading artifacts
     expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
   });
   ```

3. **Testing Error State Transitions**
   ```typescript
   it('handles error state transitions', async () => {
     // Mock API to fail
     mockApi.mockRejectedValueOnce(new Error('Failed'));
     
     render(<Component />);
     
     // Initial state
     expect(screen.getByText('Initial')).toBeInTheDocument();
     
     // Trigger error
     await user.click(screen.getByRole('button'));
     
     // Loading state
     expect(screen.getByText('Loading...')).toBeInTheDocument();
     
     // Wait for error state
     await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
     expect(screen.getByText('Error: Failed')).toBeInTheDocument();
     
     // Verify recovery
     await user.click(screen.getByRole('button', { name: 'Retry' }));
     expect(screen.queryByText('Error:')).not.toBeInTheDocument();
   });
   ```

### Testing Loading States and Visual Patterns

1. **Loading Skeleton Components**
   ```typescript
   // ❌ DON'T: Try to find loading elements by ARIA roles
   const skeleton = screen.getByRole('region', { name: /loading/i });
   
   // ✅ DO: Use DOM structure and class selectors
   const { container } = render(<LoadingSkeleton />);
   const skeleton = container.firstChild as HTMLElement;
   const bars = skeleton.querySelectorAll('div[class*="animate-pulse"]');
   ```

2. **CSS Class Testing**
   ```typescript
   // ❌ DON'T: Test classes separately
   expect(element).toHaveClass('animate-pulse');
   expect(element).toHaveClass('rounded-lg');
   
   // ✅ DO: Group related classes
   expect(element).toHaveClass('animate-pulse rounded-lg');
   
   // ✅ DO: Test classes by purpose
   // Animation classes
   expect(element).toHaveClass('animate-pulse');
   // Layout classes
   expect(element).toHaveClass('flex flex-col gap-4');
   // Visual state classes
   expect(element).toHaveClass('bg-muted-foreground/20');
   ```

3. **Visual Pattern Testing**
   ```typescript
   // ❌ DON'T: Test each element individually
   skeletonBars.forEach((bar, index) => {
     expect(bar).toHaveClass('animate-pulse');
     if (index === 0) expect(bar).toHaveClass('w-1/2');
     if (index === 1) expect(bar).toHaveClass('w-full');
   });
   
   // ✅ DO: Destructure and test with clear names
   const [
     titleBar,
     firstLine,
     secondLine,
     // ...
   ] = Array.from(elements);
   
   // Title bar
   expect(titleBar).toHaveClass('h-12 w-1/2');
   
   // Content lines
   expect(firstLine).toHaveClass('h-5 w-full');
   ```

4. **Common Loading State Patterns**
   - Document the purpose of each skeleton element
   - Group similar elements (e.g., content lines)
   - Test both unique and common properties
   - Verify animation classes
   - Check responsive classes if applicable

5. **Visual Testing Best Practices**
   - Start with container structure
   - Test layout classes first
   - Verify individual element styles
   - Group common class tests
   - Document visual patterns

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

## Part 4: Advanced Component Testing Guidelines

### Testing Resizable Components
1. Setup Requirements
   - Mock window dimensions consistently
   - Mock initial component state
   - Setup proper event handling
   - See `unit-testing-examples.md` for setup examples

2. Test Cases to Cover
   - Initial render state
   - Enter/exit resize mode
   - Resize within bounds (min/max)
   - Proper cleanup of event listeners

3. Best Practices
   - Wrap state updates in act()
   - Test boundary conditions (min/max)
   - Verify cleanup of event listeners
   - Test resize mode visual indicators
   - See `unit-testing-examples.md` for implementation examples

### Enhanced State Update Testing
1. Common Issues
   - State changes not reflected in tests
   - Race conditions in async updates
   - Missing state transitions

2. Best Practices
   - Use act() for state updates
   - Separate act() calls for different state changes
   - Wait for all state updates to complete
   - See `unit-testing-examples.md` for state update patterns

### Testing Components with Refs
1. Mock Behavior
   - Mock ref methods (e.g., scrollIntoView)
   - Setup ref behavior in beforeEach
   - Clear mocks between tests

2. Best Practices
   - Mock only necessary ref methods
   - Verify ref method calls
   - Test ref behavior on state changes
   - See `unit-testing-examples.md` for ref testing examples

### Testing Conditional Rendering
1. Test Cases
   - Component renders nothing (null case)
   - Component renders with minimal data
   - Component renders with full data
   - Component updates on data changes

2. Best Practices
   - Test boundary conditions
   - Verify cleanup on unmount
   - Test transitions between states
   - See `unit-testing-examples.md` for conditional rendering examples
