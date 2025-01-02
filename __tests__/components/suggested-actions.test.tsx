import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestedActions } from '@/components/suggested-actions';

// Mock framer-motion to prevent animation-related issues
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('SuggestedActions', () => {
  // Setup default props
  const defaultProps = {
    chatId: 'test-chat-id',
    append: jest.fn().mockResolvedValue('message-id'),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock window.history.replaceState
    window.history.replaceState = jest.fn();
  });

  it('renders all suggested actions correctly', () => {
    render(<SuggestedActions {...defaultProps} />);

    // Verify all action titles are present
    expect(screen.getByText('What are the advantages')).toBeInTheDocument();
    expect(screen.getByText('Write code that')).toBeInTheDocument();
    expect(screen.getByText('Help me write an essay')).toBeInTheDocument();
    expect(screen.getByText('What is the weather')).toBeInTheDocument();

    // Verify all action labels are present
    expect(screen.getByText('of using Next.js?')).toBeInTheDocument();
    expect(screen.getByText("demonstrates djikstra's algorithm")).toBeInTheDocument();
    expect(screen.getByText('about silicon valley')).toBeInTheDocument();
    expect(screen.getByText('in San Francisco?')).toBeInTheDocument();
  });

  it('handles action click correctly', async () => {
    const user = userEvent.setup();
    render(<SuggestedActions {...defaultProps} />);

    // Click the first action
    await user.click(screen.getByText('What are the advantages'));

    // Verify URL was updated
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/chat/test-chat-id'
    );

    // Verify message was appended
    expect(defaultProps.append).toHaveBeenCalledWith({
      role: 'user',
      content: 'What are the advantages of using Next.js?',
    });
  });

  it('renders buttons with correct accessibility roles', () => {
    render(<SuggestedActions {...defaultProps} />);

    // Get all buttons
    const buttons = screen.getAllByRole('button');

    // Verify we have 4 buttons
    expect(buttons).toHaveLength(4);

    // Verify each button has the correct variant and classes
    buttons.forEach(button => {
      expect(button.className).toContain('text-left');
      expect(button.className).toContain('border');
      expect(button.className).toContain('rounded-xl');
    });
  });

  it('applies correct visibility classes for mobile/desktop', () => {
    render(<SuggestedActions {...defaultProps} />);

    // Get all the motion divs by finding the parent of each title
    const motionDivs = [
      screen.getByText('What are the advantages').parentElement?.parentElement,
      screen.getByText('Write code that').parentElement?.parentElement,
      screen.getByText('Help me write an essay').parentElement?.parentElement,
      screen.getByText('What is the weather').parentElement?.parentElement,
    ];

    // First two items should always be visible
    expect(motionDivs[0]).toHaveClass('block');
    expect(motionDivs[1]).toHaveClass('block');

    // Last two items should be hidden on mobile, visible on desktop
    expect(motionDivs[2]).toHaveClass('hidden');
    expect(motionDivs[2]).toHaveClass('sm:block');
    expect(motionDivs[3]).toHaveClass('hidden');
    expect(motionDivs[3]).toHaveClass('sm:block');
  });

  it('maintains memoization between renders', () => {
    const { rerender } = render(<SuggestedActions {...defaultProps} />);

    // First render elements
    const firstRenderButtons = screen.getAllByRole('button');

    // Rerender with same props
    rerender(<SuggestedActions {...defaultProps} />);

    // Second render elements
    const secondRenderButtons = screen.getAllByRole('button');

    // Verify elements are the same instances
    firstRenderButtons.forEach((button, index) => {
      expect(button).toBe(secondRenderButtons[index]);
    });
  });
}); 