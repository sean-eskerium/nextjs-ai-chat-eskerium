# Unit Testing Guide

## Part 1: How to Write Perfect Tests First Time

### Core Principle
The secret to writing perfect tests is to start with what works and build from there, rather than trying to test everything at once.

### Success-Driven Analysis Process

#### 1. Component Analysis
- Render the component manually in the app
- Interact with it as a user
- Note what you actually see change
- Identify what stays the same
- List the minimal interactions needed to verify it works

#### 2. Existing Tests Analysis (if available)
- Run the test suite
- Identify which tests pass consistently
- Analyze what makes those tests reliable:
  - Are they testing visible output?
  - Are they using minimal mocks?
  - Are they testing user interactions directly?
- Use these patterns for new tests

#### 3. Dependencies Analysis
Critical: Only list dependencies that directly affect user-visible behavior
- External routing (next/router)
- UI framework components that handle user interactions
- Animation libraries that affect clicking/interaction
Skip dependencies that don't affect user-visible behavior

### Test Writing Process

#### 1. Start With What's Visible
```typescript
it('renders initial state', () => {
  render(<Component />);
  // Only check for things you can see in the browser
  expect(screen.getByText('Visible Text')).toBeInTheDocument();
});
```

#### 2. Add One Interaction at a Time
```typescript
it('responds to primary interaction', async () => {
  const user = userEvent.setup();
  render(<Component />);
  
  // Simulate exactly what a user would do
  await user.click(screen.getByRole('button', { name: 'Visible Button Text' }));
  
  // Verify only what changes visibly
  expect(screen.getByText('New Visible Text')).toBeInTheDocument();
});
```

### Test Organization Patterns

Structure your tests to mirror user interaction patterns:

```typescript
describe('ComponentName', () => {
  // 1. Setup and Rendering
  describe('Rendering', () => {
    it('renders initial state correctly')
    it('handles conditional rendering cases')
  });

  // 2. User Interactions
  describe('User Interactions', () => {
    it('handles primary actions')
    it('provides feedback for actions')
  });

  // 3. State Management
  describe('State Management', () => {
    it('handles enabled/disabled states')
    it('reflects external state changes')
  });
});
```

### Test Setup Patterns

Create a reusable setup function that encapsulates common test setup:

```typescript
const setup = (props = {}) => {
  const user = userEvent.setup();
  const utils = render(
    <Component {...defaultProps} {...props} />
  );
  return {
    user,
    ...utils,
  };
};
```

This pattern:
- Provides consistent component initialization
- Makes test cases cleaner and more focused
- Allows easy prop overrides for different scenarios

### Testing UI Framework Components

#### Radix UI and Other Headless Components
When testing components that use headless UI libraries (like Radix UI):
1. Mock the UI components at their usage level, not their implementation level
2. Focus on testing the accessible roles and names that users interact with
3. Test the visible content that users interact with, not the framework's implementation

Example mock for Radix UI Tooltip:
```typescript
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => (
    <button type="button" aria-label="Copy">
      {children}
    </button>
  ),
  TooltipContent: ({ children }: any) => (
    <div role="tooltip">{children}</div>
  ),
  TooltipProvider: ({ children }: any) => children,
}));
```

Example test:
```typescript
it('shows tooltip content on hover', async () => {
  const user = userEvent.setup();
  render(<CopyButton />);
  
  // Find the button by its accessible name
  const button = screen.getByRole('button', { name: 'Copy' });
  
  // Hover to show tooltip
  await user.hover(button);
  
  // Verify tooltip content is shown
  expect(screen.getByRole('tooltip')).toHaveTextContent('Copy to clipboard');
});
```

### Testing Component Hierarchies

When testing components that contain nested interactive elements:
1. Use `within()` to scope your queries to specific elements
2. Find parent containers by their role or content
3. Use accessible roles and names to find child elements

Example:
```typescript
// DON'T: Find buttons directly at document level
const button = screen.getByRole('button', { name: 'Copy' });

// DO: Find container first, then button within it
const dialog = screen.getByRole('dialog', { name: 'Share options' });
const copyButton = within(dialog).getByRole('button', { name: 'Copy link' });

// DO: Handle lists of similar items
const todoList = screen.getByRole('list', { name: 'Todo items' });
const items = within(todoList).getAllByRole('listitem');
const deleteButtons = items.map(item => 
  within(item).getByRole('button', { name: 'Delete' })
);
```

### Common Testing Scenarios

#### Testing Tooltips and Popovers
- Mock the tooltip/popover components
- Test the trigger and content separately
- Verify tooltip text content directly
- Don't test hover states unless critical to functionality

#### Testing Async User Feedback
- Use `waitFor` for async state changes
- Test visible feedback (toasts, messages)
- Verify both success and error states
- Mock API calls at the fetch level

#### Testing Interactive Icons
- Test the button functionality, not the icon
- Use role="button" for accessibility
- Verify disabled states affect the whole interactive area
- Test tooltip content for icon-only buttons

### Warning Signs - Stop and Revise If You See These
- You're mocking more than routing and UI framework components
- You're testing something you can't see in the browser
- Your test setup is more than 3-4 lines
- You're simulating complex event chains
- You're checking implementation details

### Success Checklist
Before writing any test code, verify:
- [ ] You can see what you're testing in the browser
- [ ] You know what changes visually with each interaction
- [ ] You've identified working tests with similar patterns
- [ ] You need minimal mocks (usually just router/UI framework)
- [ ] Your test will verify visible changes only

## Part 2: Production Code Preservation

### Critical Principles
1. Never modify production code to make tests easier
2. Tests should adapt to production code, not vice versa
3. If tests are hard to write, improve test infrastructure
4. Document and understand before testing
5. Use proper mocking and async patterns

### Test Adaptation Strategies
When encountering difficulties making tests work with production code:

1. **Understand Before Changing**
```typescript
// DON'T: Change production code to make tests easier
// component.tsx
function Component() {
  // Changed just for testing
  if (process.env.NODE_ENV === 'test') {
    return <SimplifiedVersion />;
  }
  return <ActualVersion />;
}

// DO: Understand and test the actual implementation
// component.test.tsx
it('handles complex behavior', () => {
  // Set up proper mocks and conditions
  // Test the actual behavior
});
```

2. **Mock Complex Dependencies**
```typescript
// DON'T: Simplify production code
// production.ts
export const complexBehavior = process.env.NODE_ENV === 'test' 
  ? simplifiedBehavior 
  : actualBehavior;

// DO: Mock properly in tests
// test.ts
jest.mock('./complex-dependency', () => ({
  ...jest.requireActual('./complex-dependency'),
  complexBehavior: jest.fn().mockImplementation(() => {
    // Simulate actual behavior
  })
}));
```

3. **Handle Async Properly**
```typescript
// DON'T: Make async code sync for testing
// production.ts
export const fetchData = process.env.NODE_ENV === 'test'
  ? () => mockData
  : async () => await realFetch();

// DO: Test async behavior properly
// test.ts
it('handles async operations', async () => {
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

4. **Preserve Event Handling**
```typescript
// DON'T: Bypass events for testing
// production.ts
export const handleClick = process.env.NODE_ENV === 'test'
  ? () => simpleHandler()
  : (e) => complexHandler(e);

// DO: Test actual event handling
// test.ts
it('handles events properly', async () => {
  const user = userEvent.setup();
  await user.click(button);
  // Verify the actual behavior
});
```

5. **Maintain UI Library Integration**
```typescript
// DON'T: Simplify UI library usage
// production.ts
export const Animation = process.env.NODE_ENV === 'test'
  ? SimpleDiv
  : FramerMotionComponent;

// DO: Mock UI libraries properly
// test.ts
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => (
      <div {...props}>{children}</div>
    )
  }
}));
```

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

## Part 3: Comprehensive Reference

### Component Architecture Analysis

#### State Management Analysis
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

#### UI/UX Flow Analysis
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

#### Technical Dependencies
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

### Testing Patterns

#### Multi-Step Interaction Pattern
Some components require multiple user interactions to complete an action. When testing these:

1. **Map the Complete Interaction Flow**
```typescript
// Example: Reading Level Selector
// 1. User opens the selector
// 2. User drags to select a level
// 3. User clicks to confirm selection
```

2. **Identify State Dependencies**
- List all conditions that must be met for callbacks to fire
- Document state variables that affect behavior
```typescript
// Example: Reading Level Selection
// Required conditions:
// - currentLevel !== selectedLevel
// - hasUserSelectedLevel === true
```

3. **Mock Complex Libraries**
When mocking libraries like framer-motion:
```typescript
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onDragEnd, onClick, ...props }) => (
      <div
        onClick={(e) => {
          // Simulate any state updates that would happen during drag
          onDragEnd?.({
            target: { getBoundingClientRect: () => ({ top: 5 }) }
          });
          // Then trigger the click handler
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
}));
```

4. **Test Complete Interaction Sequences**
```typescript
it('handles complete interaction flow', async () => {
  const user = userEvent.setup();
  render(<Component />);

  // 1. Initial interaction
  await user.click(screen.getByRole('button'));

  // 2. Simulate intermediate state changes
  fireEvent.dragEnd(screen.getByTestId('selector'));

  // 3. Complete the interaction
  await user.click(screen.getByTestId('selector'));

  // 4. Verify the complete flow
  expect(mockCallback).toHaveBeenCalledWith(expectedArgs);
});
```

### Component-Specific Testing Patterns

#### Text Display Components
- Only test the rendered text
- Don't test styling or classes
- Don't mock unless absolutely necessary
```typescript
// DO: Test rendered content
it('renders markdown content', () => {
  render(<MarkdownComponent>**bold**</MarkdownComponent>);
  expect(screen.getByText('bold')).toBeInTheDocument();
});

// DON'T: Test implementation details
// ❌ expect(screen.getByTestId('markdown')).toHaveClass('prose');
```

#### Interactive Components
- Test only the primary interaction path first
- Add edge cases only after primary path works
- Mock only framework-level UI components
```typescript
// DO: Test user interactions
it('handles click', async () => {
  const user = userEvent.setup();
  render(<Button>Click me</Button>);
  await user.click(screen.getByRole('button'));
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});

// DON'T: Call handlers directly
// ❌ button.props.onClick();
```

#### Form Components
- Test visible input/output
- Don't test validation directly
- Test submission results, not submission process
```typescript
// DO: Test user input
it('handles input', async () => {
  const user = userEvent.setup();
  render(<Input />);
  await user.type(screen.getByRole('textbox'), 'test');
  expect(screen.getByRole('textbox')).toHaveValue('test');
});

// DON'T: Set values directly
// ❌ input.value = 'test';
```

### Visual Testing Guidelines

#### Animation States
```typescript
it('handles animation states correctly', async () => {
  const { container } = render(<AnimatedComponent />);
  
  // Initial state
  expect(container.firstChild).toHaveClass('initial-state');
  
  // Trigger animation
  await userEvent.click(screen.getByRole('button'));
  
  // Check transition class
  expect(container.firstChild).toHaveClass('animating');
  
  // Wait for animation completion
  await waitFor(() => {
    expect(container.firstChild).toHaveClass('final-state');
  });
});
```

#### Layout Testing
```typescript
it('handles responsive layout correctly', () => {
  const { container } = render(<ResponsiveComponent />);
  
  // Test mobile layout
  window.innerWidth = 375;
  fireEvent(window, new Event('resize'));
  expect(container.firstChild).toHaveClass('mobile-layout');
  
  // Test desktop layout
  window.innerWidth = 1024;
  fireEvent(window, new Event('resize'));
  expect(container.firstChild).toHaveClass('desktop-layout');
});
```

### Performance Testing

#### Render Performance
```typescript
it('renders efficiently', async () => {
  const renderCount = jest.fn();
  
  function TestComponent() {
    useEffect(renderCount);
    return <Component />;
  }
  
  render(<TestComponent />);
  
  // Trigger state update
  await userEvent.click(screen.getByRole('button'));
  
  // Should only render twice (initial + update)
  expect(renderCount).toHaveBeenCalledTimes(2);
});
```

#### Memory Management
```typescript
it('cleans up resources properly', () => {
  const cleanup = jest.fn();
  jest.spyOn(React, 'useEffect').mockImplementation((cb) => {
    const cleanupFn = cb();
    if (cleanupFn) cleanup = cleanupFn;
  });
  
  const { unmount } = render(<Component />);
  unmount();
  
  expect(cleanup).toHaveBeenCalled();
});
```

### Error Handling Matrix

| Scenario | Expected Behavior | Test Approach | Example |
|----------|------------------|---------------|---------|
| Network Error | Show error message | Mock failed request | `mockFetch.mockRejectedValue(new Error())` |
| Invalid Input | Display validation | Simulate invalid input | `await user.type(input, '!@#')` |
| Timeout | Show retry option | Mock timeout | `jest.advanceTimersByTime(5000)` |
| Server Error | Display error state | Mock error response | `res(ctx.status(500))` |
| Validation Error | Show field errors | Submit invalid form | `expect(screen.getByRole('alert')).toBeInTheDocument()` |
| Auth Error | Redirect to login | Mock auth failure | `expect(mockRouter.push).toHaveBeenCalledWith('/login')` |

### Framework-Specific Guidelines

#### Next.js Components
- Always mock `next/link`, `next/router`, `next/image`
- Don't mock basic Next.js features
- Test client-side navigation through router mocks

#### React Query / SWR
- Mock at the query level, not the fetch level
- Test loading, success, and error states
- Use proper query client wrappers

#### UI Libraries
- Framer Motion: Mock at component level
- Radix UI: Test accessibility features
- Headless UI: Test state management

### Testing Library Best Practices

#### Queries
Use queries in this order:
1. `getByRole` - Best for interactive elements
2. `getByText` - Best for non-interactive elements
3. `getByLabelText` - Best for form fields
4. `getByPlaceholderText` - Acceptable for inputs
5. `getByTestId` - Last resort

#### Async
Always use proper async utilities:
```typescript
// DO: Use proper async handling
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// DON'T: Use arbitrary timeouts
// ❌ setTimeout(() => {}, 1000);
```

### Test Case Design Patterns

#### State Machine Pattern
```typescript
const states = {
  initial: {
    setup: () => render(<Component />),
    assertions: () => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    }
  },
  open: {
    setup: async (user) => {
      await user.click(screen.getByRole('button'));
    },
    assertions: () => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    }
  },
  loading: {
    setup: async (user) => {
      await user.click(screen.getByRole('button', { name: 'Submit' }));
    },
    assertions: () => {
      expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    }
  },
  error: {
    setup: async (user) => {
      server.use(
        rest.post('/api/submit', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );
      await user.click(screen.getByRole('button', { name: 'Submit' }));
    },
    assertions: () => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error occurred');
    }
  }
};

describe('Component States', () => {
  Object.entries(states).forEach(([stateName, state]) => {
    it(`behaves correctly in ${stateName} state`, async () => {
      const user = userEvent.setup();
      await state.setup(user);
      await state.assertions();
    });
  });
});
```

#### Interaction Flow Pattern
```typescript
const flows = {
  simpleClick: {
    description: 'Single click interaction',
    steps: [
      {
        action: async (user) => {
          await user.click(screen.getByRole('button'));
        },
        assert: () => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        }
      }
    ]
  },
  dragAndClick: {
    description: 'Drag followed by click confirmation',
    steps: [
      {
        action: (element) => {
          fireEvent.dragEnd(element, {
            target: { getBoundingClientRect: () => ({ top: 100 }) }
          });
        },
        assert: () => {
          expect(screen.getByTestId('value-display')).toHaveTextContent('100');
        }
      },
      {
        action: async (user) => {
          await user.click(screen.getByTestId('confirm'));
        },
        assert: () => {
          expect(mockCallback).toHaveBeenCalledWith(100);
        }
      }
    ]
  }
};

describe('Component Flows', () => {
  Object.entries(flows).forEach(([flowName, flow]) => {
    it(`handles ${flow.description}`, async () => {
      const user = userEvent.setup();
      const element = render(<Component />);
      
      for (const step of flow.steps) {
        await step.action(user, element);
        await step.assert();
      }
    });
  });
});
```

### Test Maintenance

#### Code Review Checklist
- [ ] Tests follow naming conventions
- [ ] Mocks are properly typed
- [ ] Error cases are covered
- [ ] Performance implications considered
- [ ] Accessibility tests included
- [ ] Test isolation maintained
- [ ] Proper cleanup implemented
- [ ] Documentation updated

#### Test Refactoring Patterns
```typescript
// Extract common setup
const setup = (props = {}) => {
  const user = userEvent.setup();
  const utils = render(<Component {...defaultProps} {...props} />);
  return {
    user,
    ...utils,
  };
};

// Create test utilities
const fillForm = async (user: UserEvent, data: FormData) => {
  for (const [field, value] of Object.entries(data)) {
    await user.type(screen.getByLabelText(field), value);
  }
};

// Implement test factories
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});
```

### Testing Metrics

#### Coverage Goals
- Line Coverage: >90%
- Branch Coverage: >85%
- Function Coverage: >90%
- Statement Coverage: >90%

#### Quality Metrics
- Test Reliability: <1% flaky tests
- Test Performance: <5s per test
- Maintenance Ratio: <1:3 test:code
- Coverage Trend: Increasing or stable

Remember:
- Start with what works and build from there
- Test what users can see and do
- Mock only what's necessary
- Keep tests simple and focused
- Follow the complete interaction flow
- Use proper async patterns
- Focus on component output 

### Component Behavior Analysis
Before writing any tests, analyze how the component actually behaves:

1. **Button and Control Analysis**
- Identify the actual accessible names of buttons (what screen readers would announce)
- Note any icon-only buttons and their accessible labels
- Document any conditional button states (e.g., enabled/disabled, visible/hidden)
- Map out button locations within the component hierarchy

2. **State Transitions**
- Document the complete state machine of the component
- Note what triggers each state change
- Identify loading states and their triggers
- Map error states and their conditions

Example Analysis:
```typescript
// Component: MultimodalInput
// Buttons:
// - Send: Only visible when there's input, icon-only button with aria-label="Send message"
// - Stop: Only visible during message generation, icon-only button with aria-label="Stop generating"
// - Attach: Always visible, icon-only button with aria-label="Attach file"

// States:
// - Initial: Empty input, only Attach button visible
// - HasInput: Input has text, Send button becomes visible
// - Generating: Loading state, Stop button replaces Send button
// - Error: Error message shown, returns to HasInput or Initial state
```

3. **Accessibility Structure**
- Use browser dev tools to inspect the actual ARIA roles and labels
- Note the hierarchy of interactive elements
- Document any dynamic ARIA attributes

#### Test Writing Process

1. **Start With Element Queries**
```typescript
// DON'T: Make assumptions about button names
const sendButton = screen.getByRole('button', { name: 'send' });

// DO: Check actual accessible names in the browser first
const sendButton = screen.getByRole('button', { name: 'Send message' });
```

2. **Handle Conditional Elements**
```typescript
// DON'T: Assume elements are immediately available
expect(screen.getByRole('button', { name: 'Stop generating' })).toBeInTheDocument();

// DO: Account for state transitions
await waitFor(() => {
  expect(screen.getByRole('button', { name: 'Stop generating' })).toBeInTheDocument();
});
```

3. **Test Complete Interaction Flows**
```typescript
it('handles message generation flow', async () => {
  const user = userEvent.setup();
  render(<MultimodalInput />);

  // 1. Initial state
  expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();
  
  // 2. Enter text
  await user.type(screen.getByRole('textbox'), 'test message');
  expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  
  // 3. Send message
  await user.click(screen.getByRole('button', { name: 'Send message' }));
  
  // 4. Verify loading state
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Stop generating' })).toBeInTheDocument();
  });
});
```

### Common Pitfalls and Solutions

#### Element Querying
- ❌ Don't assume button names without checking the actual DOM
- ❌ Don't use implementation-specific selectors
- ✅ Always verify actual accessible names in the browser
- ✅ Use role-based queries with correct names

#### State Management
- ❌ Don't test implementation details of state
- ❌ Don't assume immediate state changes
- ✅ Test visible results of state changes
- ✅ Use proper async utilities for state transitions

#### Component Contract
- ❌ Don't modify production code to make tests easier
- ❌ Don't add test-specific attributes
- ✅ Test the component as users would interact with it
- ✅ Use existing accessibility attributes for queries

### Testing Controlled Components

When testing components that manage state through props and callbacks:

1. **Understand the Component Contract**
```typescript
// Component contract example:
interface ControlledInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}
```

2. **Test State Updates**
```typescript
it('calls onChange with new value', async () => {
  const handleChange = jest.fn();
  const user = userEvent.setup();
  
  render(
    <ControlledInput
      value=""
      onChange={handleChange}
      onSubmit={jest.fn()}
    />
  );
  
  // Type into the input
  await user.type(screen.getByRole('textbox'), 'test');
  
  // Verify each change is called
  expect(handleChange).toHaveBeenCalledTimes(4);
  expect(handleChange).toHaveBeenLastCalledWith('test');
});
```

3. **Test Loading States**
```typescript
it('disables input during loading', () => {
  render(
    <ControlledInput
      value=""
      onChange={jest.fn()}
      onSubmit={jest.fn()}
      isLoading={true}
    />
  );
  
  // Verify input is disabled
  expect(screen.getByRole('textbox')).toBeDisabled();
  
  // Verify submit button is disabled
  expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
});
```

4. **Test Conditional Rendering**
```typescript
it('shows appropriate button based on loading state', () => {
  const { rerender } = render(
    <ControlledInput
      value="test"
      onChange={jest.fn()}
      onSubmit={jest.fn()}
      isLoading={false}
    />
  );
  
  // Initially shows submit button
  expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  
  // Update to loading state
  rerender(
    <ControlledInput
      value="test"
      onChange={jest.fn()}
      onSubmit={jest.fn()}
      isLoading={true}
    />
  );
  
  // Now shows loading indicator
  expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
});
```

5. **Test Complete Interaction Flows**
```typescript
it('handles submit flow correctly', async () => {
  const handleSubmit = jest.fn();
  const user = userEvent.setup();
  
  const { rerender } = render(
    <ControlledInput
      value=""
      onChange={jest.fn()}
      onSubmit={handleSubmit}
      isLoading={false}
    />
  );
  
  // Initially submit button should be disabled
  expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  
  // Rerender with value
  rerender(
    <ControlledInput
      value="test"
      onChange={jest.fn()}
      onSubmit={handleSubmit}
      isLoading={false}
    />
  );
  
  // Now submit button should be enabled
  const submitButton = screen.getByRole('button', { name: 'Submit' });
  expect(submitButton).toBeEnabled();
  
  // Click submit
  await user.click(submitButton);
  
  // Verify submit was called
  expect(handleSubmit).toHaveBeenCalledTimes(1);
});
```

Common Pitfalls:
- ❌ Don't test internal state, test props and callbacks
- ❌ Don't assume immediate state updates
- ❌ Don't test implementation details of state management
- ✅ Test the component's public API
- ✅ Test visible changes based on prop updates
- ✅ Test callback behavior with user interactions

// ... existing code ... 