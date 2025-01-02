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

## Real Component Examples

### MessageEditor Component
```typescript
describe('MessageEditor', () => {
  // Mock dependencies
  jest.mock('@/app/(chat)/actions', () => ({
    deleteTrailingMessages: jest.fn(() => Promise.resolve()),
  }));

  jest.mock('sonner', () => ({
    toast: {
      error: jest.fn(),
    },
  }));

  jest.mock('@/hooks/use-user-message-id', () => ({
    useUserMessageId: jest.fn(),
  }));

  // Test data
  const mockMessage = {
    id: 'test-id',
    content: 'Initial content',
    role: 'user',
    createdAt: new Date(),
  };

  const defaultProps = {
    message: mockMessage,
    setMode: jest.fn(),
    setMessages: jest.fn(),
    reload: jest.fn(() => Promise.resolve(null)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default hook implementation
    (useUserMessageId as jest.Mock).mockReturnValue({
      userMessageIdFromServer: 'test-id',
    });
  });

  describe('Message Submission', () => {
    it('successfully updates message and returns to view mode', async () => {
      const user = userEvent.setup();
      const updatedContent = 'Updated content';
      const mockSetMessages = jest.fn();
      
      // Mock successful API call
      (deleteTrailingMessages as jest.Mock).mockResolvedValue(undefined);
      
      render(
        <MessageEditor
          {...defaultProps}
          setMessages={mockSetMessages}
        />
      );
      
      // Type the new content
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, updatedContent);
      
      // Verify the textarea content is updated
      expect(textarea).toHaveValue(updatedContent);
      
      // Click send
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      // Wait for the API call and state updates
      await waitFor(() => {
        expect(deleteTrailingMessages).toHaveBeenCalledWith({ id: 'test-id' });
        expect(mockSetMessages).toHaveBeenCalled();
        expect(defaultProps.setMode).toHaveBeenCalledWith('view');
        expect(defaultProps.reload).toHaveBeenCalled();
      });

      // Verify message content update
      const messagesUpdater = mockSetMessages.mock.calls[0][0];
      const result = messagesUpdater([mockMessage]);
      expect(result[0].content).toBe(updatedContent);
    });

    it('shows error toast when messageId is missing', async () => {
      const user = userEvent.setup();
      
      // Mock both message ID sources as null
      (useUserMessageId as jest.Mock).mockReturnValue({
        userMessageIdFromServer: null,
      });
      
      // Use an empty string for the ID to trigger the error condition
      const mockMessageWithoutId = {
        ...mockMessage,
        id: '',
      };
      
      render(
        <MessageEditor
          {...defaultProps}
          message={mockMessageWithoutId}
        />
      );
      
      // Click send
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      // Wait for error state
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong, please try again!');
      });

      // Verify no side effects
      expect(deleteTrailingMessages).not.toHaveBeenCalled();
      expect(defaultProps.setMessages).not.toHaveBeenCalled();
      expect(defaultProps.setMode).not.toHaveBeenCalled();
      expect(defaultProps.reload).not.toHaveBeenCalled();
    });
  });
});
```

### Key Learnings from MessageEditor Example
1. **Mock Setup**
   - Mock all external dependencies at the top
   - Document the purpose of each mock
   - Provide default implementations in `beforeEach`

2. **Test Data**
   - Create reusable test data
   - Use TypeScript interfaces for type safety
   - Document data requirements

3. **Async Testing**
   - Group related async assertions in single `waitFor`
   - Verify both positive and negative paths
   - Check for absence of side effects in error cases

4. **State Updates**
   - Test state updater functions directly
   - Verify all side effects
   - Check loading and error states
```

### Loading Skeleton Component Example
```typescript
// Component:
export const DocumentSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="animate-pulse rounded-lg h-12 bg-muted-foreground/20 w-1/2" />
      <div className="animate-pulse rounded-lg h-5 bg-muted-foreground/20 w-full" />
      <div className="animate-pulse rounded-lg h-5 bg-muted-foreground/20 w-full" />
      <div className="animate-pulse rounded-lg h-5 bg-muted-foreground/20 w-1/3" />
      <div className="animate-pulse rounded-lg h-5 bg-transparent w-52" />
      <div className="animate-pulse rounded-lg h-8 bg-muted-foreground/20 w-52" />
      <div className="animate-pulse rounded-lg h-5 bg-muted-foreground/20 w-2/3" />
    </div>
  );
};

// Test:
describe('DocumentSkeleton', () => {
  it('renders with correct structure and styling', () => {
    const { container } = render(<DocumentSkeleton />);

    // Get container
    const skeletonContainer = container.firstChild as HTMLElement;
    expect(skeletonContainer).toHaveClass('flex flex-col gap-4 w-full');

    // Get all skeleton bars
    const skeletonBars = skeletonContainer.querySelectorAll('div[class*="animate-pulse"]');
    expect(skeletonBars).toHaveLength(7);

    // Verify specific bars with clear names
    const [
      titleBar,
      firstLine,
      secondLine,
      thirdLine,
      spacer,
      button,
      lastLine
    ] = Array.from(skeletonBars);

    // Title bar
    expect(titleBar).toHaveClass('h-12 w-1/2');

    // Content lines
    expect(firstLine).toHaveClass('h-5 w-full');
    expect(secondLine).toHaveClass('h-5 w-full');
    expect(thirdLine).toHaveClass('h-5 w-1/3');

    // Spacer
    expect(spacer).toHaveClass('h-5 bg-transparent w-52');

    // Button placeholder
    expect(button).toHaveClass('h-8 w-52');

    // Last line
    expect(lastLine).toHaveClass('h-5 w-2/3');

    // Common classes
    skeletonBars.forEach(bar => {
      expect(bar).toHaveClass('animate-pulse rounded-lg');
      if (bar !== spacer) {
        expect(bar).toHaveClass('bg-muted-foreground/20');
      }
    });
  });
});
```

Key Points:
1. Use DOM structure for loading states
2. Group class assertions by purpose
3. Give clear names to elements
4. Test both unique and common properties
5. Document visual patterns
``` 

## Advanced Component Testing Examples

### Resizable Component Example
```typescript
describe('ResizableComponent', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });

    // Mock initial state
    jest.spyOn(window, 'getComputedStyle').mockImplementation((element) => ({
      getPropertyValue: (prop: string) => {
        if (prop === 'height') return '300px';
        return '';
      },
    } as CSSStyleDeclaration));
  });

  it('handles resize behavior', async () => {
    render(<ResizableComponent />);
    const resizer = screen.getByRole('slider');

    // Start resizing
    await act(async () => {
      fireEvent.mouseDown(resizer);
    });

    // Test minimum height
    await act(async () => {
      fireEvent.mouseMove(window, { clientY: 900 }); // 1000 - 900 = 100px
    });
    expect(resizer.style.bottom).toBe('96px'); // 100px - 4px offset

    // Test maximum height
    await act(async () => {
      fireEvent.mouseMove(window, { clientY: 200 }); // 1000 - 200 = 800px
    });
    expect(resizer.style.bottom).toBe('796px'); // 800px - 4px offset

    // Stop resizing
    await act(async () => {
      fireEvent.mouseUp(window);
    });
  });
});
```

### State Update Examples
```typescript
describe('state updates', () => {
  // ❌ DON'T combine multiple state changes
  it('incorrect state update handling', async () => {
    await act(async () => {
      fireEvent.mouseDown(element);
      fireEvent.mouseMove(window, { clientY: 500 });
    });
  });

  // ✅ DO separate state changes
  it('correct state update handling', async () => {
    // First state change
    await act(async () => {
      fireEvent.mouseDown(element);
    });

    // Second state change
    await act(async () => {
      fireEvent.mouseMove(window, { clientY: 500 });
    });
  });
});
```

### Ref Testing Example
```typescript
describe('ComponentWithRefs', () => {
  const scrollIntoViewMock = jest.fn();

  beforeEach(() => {
    scrollIntoViewMock.mockClear();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
  });

  it('handles ref behavior', () => {
    const { rerender } = render(<ComponentWithRefs data={[]} />);

    // Initial render scroll
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });

    // Update data and verify scroll
    rerender(<ComponentWithRefs data={['new item']} />);
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
    expect(scrollIntoViewMock).toHaveBeenLastCalledWith({ behavior: 'smooth' });
  });
});
```

### Conditional Rendering Example
```typescript
describe('ConditionalComponent', () => {
  it('renders nothing when no data', () => {
    const { container } = render(<ConditionalComponent data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with minimal data', () => {
    render(<ConditionalComponent data={['item']} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('item')).toBeInTheDocument();
  });

  it('handles data updates', () => {
    const { rerender } = render(<ConditionalComponent data={['item 1']} />);
    expect(screen.getByText('item 1')).toBeInTheDocument();

    rerender(<ConditionalComponent data={['item 1', 'item 2']} />);
    expect(screen.getByText('item 2')).toBeInTheDocument();
  });

  it('cleans up on unmount', () => {
    const cleanupMock = jest.fn();
    const { unmount } = render(
      <ConditionalComponent data={['item']} onCleanup={cleanupMock} />
    );

    unmount();
    expect(cleanupMock).toHaveBeenCalled();
  });
});
``` 