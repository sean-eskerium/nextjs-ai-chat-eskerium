# Unit Testing Examples and References

## DOM Structure Examples

### SuggestedActions Component Example
```typescript
// 1. Document the EXACT rendered output (not the JSX)
<div class="grid sm:grid-cols-2 gap-2 w-full">
  <div class="block">                              // motion.div gets rendered as div
    <button class="text-left border rounded-xl..."> // First action
      <span class="font-medium">Title text</span>
      <span class="text-muted-foreground">Label text</span>
    </button>
  </div>
  // ... similar structure for other items
</div>

// Class locations
{
  'grid sm:grid-cols-2': 'outer container div',
  'block': 'motion.div wrappers for first two items',
  'hidden sm:block': 'motion.div wrappers for last two items',
  'text-left border rounded-xl': 'button elements'
}

// Parent-child relationships
{
  'button text': 'Inside two spans inside button',
  'button': 'Inside motion.div wrapper',
  'motion.div': 'Direct child of grid container'
}
```

## Mock Examples

### Animation Framework Mocking
```typescript
// Example for framer-motion:
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => (
      <div {...props}>{children}</div>
    )
  }
}));

// Verification
expect(screen.getByRole('button')).toHaveClass('motion-class');
```

### Complex Library Mocking (CodeMirror)
```typescript
// In jest.setup.ts:
jest.mock('@codemirror/state', () => ({
  EditorState: {
    create: jest.fn(),
  },
}));

jest.mock('@codemirror/view', () => ({
  EditorView: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
  })),
}));

// In test file:
const createSpy = jest.spyOn(EditorState, 'create');
const destroySpy = jest.spyOn(EditorView.prototype, 'destroy');

it('initializes editor', () => {
  render(<Editor content="test" />);
  expect(createSpy).toHaveBeenCalledWith(
    expect.objectContaining({ doc: 'test' })
  );
});
```

## Test Pattern Examples

### Component Lifecycle Pattern
```typescript
describe('Component', () => {
  const defaultProps = {
    content: 'test content',
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial content', () => {
    render(<Component {...defaultProps} />);
    expect(screen.getByText('test content')).toBeInTheDocument();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<Component {...defaultProps} />);
    unmount();
    expect(destroySpy).toHaveBeenCalled();
  });
});
```

### State Management Pattern
```typescript
describe('state management', () => {
  it('handles state transitions', () => {
    render(<Component {...defaultProps} />);
    
    // Initial state
    expect(screen.getByText('initial')).toBeInTheDocument();
    
    // Trigger change
    fireEvent.click(screen.getByRole('button'));
    
    // New state
    expect(screen.getByText('updated')).toBeInTheDocument();
  });
});
```

### Async Operation Pattern
```typescript
describe('async operations', () => {
  it('handles loading states', async () => {
    render(<Component />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));
    expect(screen.getByText('completed')).toBeInTheDocument();
  });
});
```

### Error Handling Pattern
```typescript
describe('error handling', () => {
  it('displays error messages', async () => {
    server.use(
      rest.post('/api/endpoint', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    
    expect(await screen.findByText('error message')).toBeInTheDocument();
  });
});
```

## Class Testing Examples

### Single Class Testing
```typescript
it('has correct base class', () => {
  const element = screen.getByRole('button');
  expect(element.className).toContain('base-class');
});
```

### Multiple Classes Testing
```typescript
it('has correct state classes', () => {
  const element = screen.getByRole('button');
  expect(element.className).toContain('class1');
  expect(element.className).toContain('class2');
});
```

### Responsive Classes Testing
```typescript
it('applies correct responsive classes', () => {
  const element = screen.getByRole('button');
  expect(element.className).toContain('base');
  expect(element.className).toContain('sm:responsive');
});
```

## Real-world Test Examples

### MultimodalInput Component
```typescript
describe('MultimodalInput', () => {
  it('handles complete input flow', async () => {
    const user = userEvent.setup();
    render(<MultimodalInput />);

    // Initial state
    expect(screen.queryByRole('button', { name: 'Send message' }))
      .not.toBeInTheDocument();

    // Enter text
    await user.type(screen.getByRole('textbox'), 'test message');
    expect(screen.getByRole('button', { name: 'Send message' }))
      .toBeInTheDocument();

    // Send message
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(screen.getByRole('button', { name: 'Stop generating' }))
      .toBeInTheDocument();
  });
});
```

### CodeEditor Component
```typescript
describe('CodeEditor', () => {
  const defaultProps = {
    content: 'test content',
    saveContent: jest.fn(),
    status: 'idle' as const,
  };

  it('initializes editor correctly', () => {
    const createSpy = jest.spyOn(EditorState, 'create');
    render(<CodeEditor {...defaultProps} />);
    
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ doc: 'test content' })
    );
  });

  it('cleans up editor on unmount', () => {
    const destroySpy = jest.spyOn(EditorView.prototype, 'destroy');
    const { unmount } = render(<CodeEditor {...defaultProps} />);
    
    unmount();
    expect(destroySpy).toHaveBeenCalled();
  });
});
```

### Element Selection Examples
```typescript
// Document your element selection strategy BEFORE writing tests
{
  // 1. Prefer role-based queries for interactive elements
  'buttons': 'screen.getAllByRole("button")',
  'specific button': 'screen.getByRole("button", { name: "exact text" })',
  
  // 2. Use text content for non-interactive elements
  'static text': 'screen.getByText("exact text")',
  'dynamic text': 'screen.getByText(new RegExp(dynamicText))',
  
  // 3. Use parent-child relationships carefully
  'wrapper div': {
    correct: 'screen.getByText("child text").parentElement?.parentElement',
    wrong: 'container.querySelector(".some-class")'
  },
  
  // 4. Data-testid as last resort
  'complex structure': 'screen.getByTestId("unique-id")'
}
```

### State Management Examples
```typescript
// State Machine Pattern
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
  }
};

// Testing State Transitions
it('handles state transitions', async () => {
  const user = userEvent.setup();
  render(<Component />);

  // Initial state
  expect(screen.getByTestId('initial-state')).toBeInTheDocument();

  // Loading state
  await user.click(screen.getByRole('button'));
  expect(screen.getByTestId('loading-state')).toBeInTheDocument();

  // Success state
  await waitFor(() => {
    expect(screen.getByTestId('success-state')).toBeInTheDocument();
  });
});
```

### Performance Testing Examples
```typescript
// Render Performance
it('renders efficiently', async () => {
  const renderCount = jest.fn();
  
  function TestComponent() {
    useEffect(renderCount);
    return <Component />;
  }
  
  render(<TestComponent />);
  await userEvent.click(screen.getByRole('button'));
  expect(renderCount).toHaveBeenCalledTimes(2);
});

// Memory Management
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

### Framework-Specific Examples

#### Next.js Testing
```typescript
// Router Mocking
const mockRouter = {
  push: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/current-path'
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter
}));

// Image Component Mocking
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />
}));
```

#### React Query Examples
```typescript
// Query Client Setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Testing Query States
it('handles query states', async () => {
  render(<Component />, { wrapper });
  
  // Loading
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  
  // Success
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
``` 