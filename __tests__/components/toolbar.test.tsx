import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '@/components/toolbar';
import { Tools } from '@/components/toolbar';
import { useState } from 'react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, onHoverStart, onHoverEnd, whileHover, whileTap, initial, animate, exit, style, drag, dragElastic, dragMomentum, dragConstraints, role, 'aria-label': ariaLabel, ...props }: any) => {
      // Determine test ID based on content
      let testId = 'motion-div';
      if (className?.includes('absolute right-6 bottom-6')) {
        testId = 'stop-button';
      } else if (className?.includes('p-3 rounded-full')) {
        testId = 'tool-button';
      }
      return (
        <div 
          className={className} 
          onClick={onClick} 
          onMouseEnter={onHoverStart} 
          onMouseLeave={onHoverEnd} 
          data-testid={testId}
          style={style}
          role={role}
          aria-label={ariaLabel}
          {...props}
        >
          {children}
        </div>
      );
    },
    button: ({ children, className, onClick, whileHover, whileTap, initial, animate, exit, style, role, type, 'aria-label': ariaLabel, ...props }: any) => (
      <button 
        className={className} 
        onClick={onClick} 
        data-testid="motion-button"
        style={style}
        role={role}
        type={type}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
  useMotionValue: () => ({
    set: jest.fn(),
    get: jest.fn(),
  }),
  useTransform: () => ({
    set: jest.fn(),
    get: jest.fn(),
    on: (event: string, callback: any) => {
      callback(2);
      return jest.fn();
    },
  }),
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: () => 'mock-id',
}));

// Mock Radix UI Tooltip components
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children, open }: any) => children,
  TooltipTrigger: ({ children, asChild }: any) => (
    <div data-testid="tooltip-trigger">{children}</div>
  ),
  TooltipContent: ({ children, side, sideOffset, className }: any) => (
    <div data-testid="tooltip-content" className={className}>{children}</div>
  ),
  TooltipProvider: ({ children }: any) => children,
}));

// Mock ReadingLevelSelector component
jest.mock('@/components/toolbar', () => {
  const actual = jest.requireActual('@/components/toolbar');
  return {
    ...actual,
    ReadingLevelSelector: ({ setSelectedTool, append, isAnimating }: any) => (
      <div data-testid="reading-level-selector" className="relative flex flex-col justify-end items-center">
        <div data-testid="tooltip-trigger">
          <button
            type="button"
            role="button"
            aria-label="Adjust reading level"
            data-testid="reading-level-button"
            className="absolute bg-primary text-primary-foreground p-3 border rounded-full flex flex-row items-center"
            onClick={() => {
              append({
                role: 'user',
                content: `Please adjust the reading level to Graduate level.`,
              });
              setSelectedTool(null);
            }}
          >
            <span className="sr-only">Adjust reading level</span>
          </button>
        </div>
      </div>
    ),
  };
});

describe('Toolbar', () => {
  const mockAppend = jest.fn();
  const mockStop = jest.fn();
  const mockSetMessages = jest.fn();
  const mockSetIsToolbarVisible = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with text block kind', () => {
    render(
      <Toolbar
        isLoading={false}
        append={mockAppend}
        stop={mockStop}
        setMessages={mockSetMessages}
        blockKind="text"
        isToolbarVisible={true}
        setIsToolbarVisible={mockSetIsToolbarVisible}
      />
    );
    
    // Check for text tools in tooltip content
    const tooltips = screen.getAllByTestId('tooltip-content');
    expect(tooltips.some(el => el.textContent === 'Add final polish')).toBe(true);
    expect(tooltips.some(el => el.textContent === 'Request suggestions')).toBe(true);
    expect(tooltips.some(el => el.textContent === 'Adjust reading level')).toBe(true);
  });

  it('renders correctly with code block kind', () => {
    render(
      <Toolbar
        isLoading={false}
        append={mockAppend}
        stop={mockStop}
        setMessages={mockSetMessages}
        blockKind="code"
        isToolbarVisible={true}
        setIsToolbarVisible={mockSetIsToolbarVisible}
      />
    );
    
    // Check for code tools in tooltip content
    const tooltips = screen.getAllByTestId('tooltip-content');
    expect(tooltips.some(el => el.textContent === 'Add comments')).toBe(true);
    expect(tooltips.some(el => el.textContent === 'Add logs')).toBe(true);
  });

  it('handles tool selection and execution', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        isLoading={false}
        append={mockAppend}
        stop={mockStop}
        setMessages={mockSetMessages}
        blockKind="text"
        isToolbarVisible={true}
        setIsToolbarVisible={mockSetIsToolbarVisible}
      />
    );

    // Find all tool buttons
    const toolButtons = screen.getAllByTestId('tool-button');
    // Get the polish tool button (last one)
    const polishButton = toolButtons[toolButtons.length - 1];
    expect(polishButton).toBeTruthy();

    // Click to select
    await user.click(polishButton);

    // Click again to execute
    await user.click(polishButton);

    expect(mockAppend).toHaveBeenCalledWith({
      role: 'user',
      content: expect.stringContaining('polish'),
    });
  });

  it('shows loading state correctly', () => {
    render(
      <Toolbar
        isLoading={true}
        append={mockAppend}
        stop={mockStop}
        setMessages={mockSetMessages}
        blockKind="text"
        isToolbarVisible={true}
        setIsToolbarVisible={mockSetIsToolbarVisible}
      />
    );

    const stopButton = screen.getByTestId('stop-button');
    expect(stopButton).toBeInTheDocument();
  });

  it('handles stop action', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        isLoading={true}
        append={mockAppend}
        stop={mockStop}
        setMessages={mockSetMessages}
        blockKind="text"
        isToolbarVisible={true}
        setIsToolbarVisible={mockSetIsToolbarVisible}
      />
    );

    const stopButton = screen.getByTestId('stop-button');
    const stopIcon = stopButton.querySelector('[data-testid="motion-div"]');
    expect(stopIcon).toBeTruthy();
    await user.click(stopIcon!);

    // Wait for the click event to be processed
    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
      expect(mockSetMessages).toHaveBeenCalled();
    });
  });

  it('handles reading level selection', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        isLoading={false}
        append={mockAppend}
        stop={mockStop}
        setMessages={mockSetMessages}
        blockKind="text"
        isToolbarVisible={true}
        setIsToolbarVisible={mockSetIsToolbarVisible}
      />
    );

    // Find all tool buttons
    const toolButtons = screen.getAllByTestId('tool-button');
    // Get the reading level button (first one)
    const levelButton = toolButtons[0];
    expect(levelButton).toBeTruthy();

    // Click to select
    await user.click(levelButton);

    // Wait for and find the reading level selector
    const readingLevelSelector = await screen.findByTestId('reading-level-selector');
    expect(readingLevelSelector).toBeTruthy();

    // Find the button within the selector
    const readingLevelButton = readingLevelSelector.querySelector('button[role="button"]');
    expect(readingLevelButton).toBeTruthy();

    // Click to confirm selection
    await user.click(readingLevelButton!);

    expect(mockAppend).toHaveBeenCalledWith({
      role: 'user',
      content: expect.stringContaining('reading level'),
    });
  });
}); 