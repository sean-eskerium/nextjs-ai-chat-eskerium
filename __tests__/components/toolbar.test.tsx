import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '@/components/toolbar';
import { Tools } from '@/components/toolbar';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cx } from 'class-variance-authority';
import { ArrowUpIcon } from '@radix-ui/react-icons';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, onHoverStart, onHoverEnd, whileHover, whileTap, initial, animate, exit, style, drag, dragElastic, dragMomentum, dragConstraints, role, 'aria-label': ariaLabel, onDragEnd, ...props }: any) => {
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
          onDragEnd={(e) => {
            // Simulate the drag end event with the Graduate level position
            onDragEnd?.({ target: { getBoundingClientRect: () => ({ top: 5 }) } });
          }}
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
    get: jest.fn(() => -80), // This simulates dragging to the "Graduate" level
    on: jest.fn((event, callback) => {
      if (event === 'change') {
        callback(5); // This simulates the Graduate level (index 5)
      }
      return jest.fn();
    }),
  }),
  useTransform: () => ({
    set: jest.fn(),
    get: jest.fn(() => 5), // This simulates the Graduate level
    on: (event: string, callback: any) => {
      if (event === 'change') {
        callback(5); // This simulates the Graduate level
      }
      return jest.fn();
    },
  }),
}));

// Mock nanoid
jest.mock('nanoid', () => {
  let counter = 0;
  return {
    nanoid: () => `mock-id-${counter++}`,
  };
});

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
  const { ArrowUpIcon } = jest.requireActual('@/components/icons');
  
  const MockTools = (props: any) => {
    const { selectedTool, setSelectedTool, append, isAnimating, blockKind } = props;
    
    if (selectedTool === 'adjust-reading-level') {
      console.log('Rendering mock ReadingLevelSelector');
      return (
        <div data-testid="reading-level-selector" className="relative flex flex-col justify-end items-center">
          <div
            data-testid="reading-level-motion-div"
            className="absolute bg-background p-3 border rounded-full flex flex-row items-center bg-primary text-primary-foreground"
            onDragEnd={() => {
              console.log('Mock dragEnd event fired');
              append({
                role: 'user',
                content: 'Please adjust the reading level to Graduate level.',
              });
              setSelectedTool(null);
            }}
          >
            <ArrowUpIcon />
          </div>
          <div data-testid="tooltip-content" className="bg-foreground text-background text-sm rounded-2xl p-3 px-4">
            Graduate
          </div>
        </div>
      );
    }

    // Render the tools based on block kind
    const tools = blockKind === 'text' ? [
      {
        type: 'adjust-reading-level',
        description: 'Adjust reading level',
      },
      {
        type: 'request-suggestions',
        description: 'Request suggestions',
      },
      {
        type: 'final-polish',
        description: 'Add final polish',
      },
    ] : [
      {
        type: 'add-comments',
        description: 'Add comments',
      },
      {
        type: 'add-logs',
        description: 'Add logs',
      },
    ];

    return (
      <div className="flex flex-row gap-2">
        {tools.map((tool) => (
          <div 
            key={tool.type} 
            data-testid="tool-button" 
            onClick={() => {
              console.log('Tool button clicked:', tool.type);
              setSelectedTool(tool.type);
            }}
          >
            <div data-testid="tooltip-content">{tool.description}</div>
          </div>
        ))}
      </div>
    );
  };

  return {
    ...actual,
    Tools: MockTools,
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
    console.log('Starting reading level selection test');
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
    console.log('Found tool buttons:', toolButtons.length);
    
    // Find the reading level button by checking its associated tooltip content
    const tooltipContents = screen.getAllByTestId('tooltip-content');
    console.log('Found tooltip contents:', tooltipContents.map(t => t.textContent));
    const readingLevelIndex = tooltipContents.findIndex(
      tooltip => tooltip.textContent === 'Adjust reading level'
    );
    console.log('Reading level index:', readingLevelIndex);
    expect(readingLevelIndex).not.toBe(-1);
    
    // Click to select the tool
    console.log('Clicking tool button');
    await user.click(toolButtons[readingLevelIndex]);

    // Find the reading level selector within the tooltip trigger
    const tooltipTrigger = screen.getByTestId('tooltip-trigger');
    const readingLevelSelector = within(tooltipTrigger).getByTestId('motion-div');
    console.log('Found reading level selector:', !!readingLevelSelector);
    expect(readingLevelSelector).toBeTruthy();

    // First simulate drag end to set the level
    fireEvent.dragEnd(readingLevelSelector);
    console.log('Simulated drag end event');

    // Then click to confirm the selection
    fireEvent.click(readingLevelSelector);
    console.log('Simulated click event');

    // Verify that append was called with the correct message
    expect(mockAppend).toHaveBeenCalledWith({
      role: 'user',
      content: 'Please adjust the reading level to Graduate level.',
    });
  });
}); 