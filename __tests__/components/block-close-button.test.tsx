import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockCloseButton } from '@/components/block-close-button';
import { useBlock } from '@/hooks/use-block';

// Mock dependencies
jest.mock('@/hooks/use-block', () => ({
  useBlock: jest.fn(),
  initialBlockData: {
    status: 'idle',
    isVisible: true,
    content: '',
    messages: [],
  },
}));

jest.mock('@/components/icons', () => ({
  CrossIcon: ({ size }: { size: number }) => (
    <span data-testid="cross-icon" data-size={size}>✕</span>
  ),
}));

describe('BlockCloseButton', () => {
  const mockSetBlock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default hook implementation
    (useBlock as jest.Mock).mockReturnValue({
      setBlock: mockSetBlock,
    });
  });

  describe('Rendering', () => {
    it('renders button with cross icon', () => {
      render(<BlockCloseButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-fit p-2');
      
      const icon = screen.getByTestId('cross-icon');
      expect(icon).toHaveAttribute('data-size', '18');
    });
  });

  describe('Interactions', () => {
    it('hides block when clicked during streaming', async () => {
      const user = userEvent.setup();
      render(<BlockCloseButton />);

      await user.click(screen.getByRole('button'));

      // Get the updater function
      const blockUpdater = mockSetBlock.mock.calls[0][0];
      
      // Test streaming state update
      const result = blockUpdater({ status: 'streaming', isVisible: true });
      expect(result).toEqual({
        status: 'streaming',
        isVisible: false,
      });
    });

    it('resets block to idle state when clicked while not streaming', async () => {
      const user = userEvent.setup();
      render(<BlockCloseButton />);

      await user.click(screen.getByRole('button'));

      // Get the updater function
      const blockUpdater = mockSetBlock.mock.calls[0][0];
      
      // Test non-streaming state update
      const result = blockUpdater({ status: 'complete', isVisible: true });
      expect(result).toEqual({
        status: 'idle',
        isVisible: true,
        content: '',
        messages: [],
      });
    });
  });
}); 