import * as React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageActions } from '@/components/message-actions';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import type { Message } from 'ai';
import type { Vote } from '@/lib/db/schema';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    promise: jest.fn(),
  },
}));

jest.mock('swr', () => ({
  useSWRConfig: jest.fn(),
}));

jest.mock('usehooks-ts', () => ({
  useCopyToClipboard: () => [null, jest.fn().mockResolvedValue(true)],
}));

// Mock Radix UI Tooltip components
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => (
    <div data-testid="tooltip-trigger">{children}</div>
  ),
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: any) => children,
}));

// Mock fetch
global.fetch = jest.fn();

describe('MessageActions', () => {
  const mockMessage: Message = {
    id: 'test-id',
    role: 'assistant',
    content: 'Test message',
  };

  const defaultProps = {
    chatId: 'test-chat',
    message: mockMessage,
    vote: undefined as Vote | undefined,
    isLoading: false,
  };

  const setup = (props = {}) => {
    const user = userEvent.setup();
    const utils = render(
      <MessageActions {...defaultProps} {...props} />
    );
    return {
      user,
      ...utils,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSWRConfig as jest.Mock).mockReturnValue({ mutate: jest.fn() });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  });

  describe('Rendering', () => {
    it('renders action buttons for assistant messages', () => {
      setup();
      
      // Check for visible buttons and their tooltips
      const tooltipTriggers = screen.getAllByTestId('tooltip-trigger');
      expect(tooltipTriggers).toHaveLength(3);
      
      // Verify tooltips
      const tooltipContents = screen.getAllByTestId('tooltip-content');
      expect(tooltipContents).toHaveLength(3);
      expect(tooltipContents[0]).toHaveTextContent('Copy');
      expect(tooltipContents[1]).toHaveTextContent('Upvote Response');
      expect(tooltipContents[2]).toHaveTextContent('Downvote Response');
    });

    it('does not render for user messages', () => {
      setup({
        message: { ...mockMessage, role: 'user' }
      });
      expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
    });

    it('does not render when loading', () => {
      setup({ isLoading: true });
      expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
    });

    it('does not render for messages with tool invocations', () => {
      setup({
        message: { 
          ...mockMessage, 
          toolInvocations: [{
            toolCallId: 'test-id',
            state: 'call',
            toolName: 'test',
            args: {}
          }] 
        }
      });
      expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('copies message content when copy button is clicked', async () => {
      const { user } = setup();
      
      // Find button by its tooltip content
      const tooltipTriggers = screen.getAllByTestId('tooltip-trigger');
      const copyButton = within(tooltipTriggers[0]).getByRole('button');
      await user.click(copyButton);
      
      // Verify the visible feedback (toast)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
      });
    });

    it('upvotes message when upvote button is clicked', async () => {
      const mutate = jest.fn();
      (useSWRConfig as jest.Mock).mockReturnValue({ mutate });
      
      const { user } = setup();
      
      // Find button by its tooltip content
      const tooltipTriggers = screen.getAllByTestId('tooltip-trigger');
      const upvoteButton = within(tooltipTriggers[1]).getByRole('button');
      await user.click(upvoteButton);
      
      // Verify the API call
      expect(global.fetch).toHaveBeenCalledWith('/api/vote', {
        method: 'PATCH',
        body: JSON.stringify({
          chatId: 'test-chat',
          messageId: 'test-id',
          type: 'up',
        }),
      });
      
      // Verify the visible feedback (toast)
      expect(toast.promise).toHaveBeenCalled();
    });

    it('downvotes message when downvote button is clicked', async () => {
      const mutate = jest.fn();
      (useSWRConfig as jest.Mock).mockReturnValue({ mutate });
      
      const { user } = setup();
      
      // Find button by its tooltip content
      const tooltipTriggers = screen.getAllByTestId('tooltip-trigger');
      const downvoteButton = within(tooltipTriggers[2]).getByRole('button');
      await user.click(downvoteButton);
      
      // Verify the API call
      expect(global.fetch).toHaveBeenCalledWith('/api/vote', {
        method: 'PATCH',
        body: JSON.stringify({
          chatId: 'test-chat',
          messageId: 'test-id',
          type: 'down',
        }),
      });
      
      // Verify the visible feedback (toast)
      expect(toast.promise).toHaveBeenCalled();
    });
  });

  describe('Button States', () => {
    it('disables upvote button when already upvoted', () => {
      setup({
        vote: { chatId: 'test-chat', messageId: 'test-id', isUpvoted: true }
      });
      
      // Get buttons by their tooltip triggers
      const tooltipTriggers = screen.getAllByTestId('tooltip-trigger');
      const upvoteButton = within(tooltipTriggers[1]).getByRole('button');
      const downvoteButton = within(tooltipTriggers[2]).getByRole('button');
      
      expect(upvoteButton).toBeDisabled();
      expect(downvoteButton).not.toBeDisabled();
    });

    it('disables downvote button when already downvoted', () => {
      setup({
        vote: { chatId: 'test-chat', messageId: 'test-id', isUpvoted: false }
      });
      
      // Get buttons by their tooltip triggers
      const tooltipTriggers = screen.getAllByTestId('tooltip-trigger');
      const upvoteButton = within(tooltipTriggers[1]).getByRole('button');
      const downvoteButton = within(tooltipTriggers[2]).getByRole('button');
      
      expect(upvoteButton).not.toBeDisabled();
      expect(downvoteButton).toBeDisabled();
    });
  });
}); 