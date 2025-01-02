import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  beforeEach(() => {
    jest.clearAllMocks();
    (useSWRConfig as jest.Mock).mockReturnValue({ mutate: jest.fn() });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  });

  // Basic rendering
  it('renders all action buttons for assistant messages', () => {
    render(<MessageActions {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'upvote' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'downvote' })).toBeInTheDocument();
  });

  // Conditional rendering
  it('does not render for user messages', () => {
    render(
      <MessageActions
        {...defaultProps}
        message={{ ...mockMessage, role: 'user' }}
      />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render when loading', () => {
    render(<MessageActions {...defaultProps} isLoading={true} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render for messages with tool invocations', () => {
    render(
      <MessageActions
        {...defaultProps}
        message={{ 
          ...mockMessage, 
          toolInvocations: [{
            toolCallId: 'test-id',
            state: 'call',
            toolName: 'test',
            args: {}
          }] 
        }}
      />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // Copy functionality
  it('copies message content to clipboard', async () => {
    render(<MessageActions {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'copy' }));
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  // Voting functionality
  it('handles upvoting', async () => {
    const mutate = jest.fn();
    (useSWRConfig as jest.Mock).mockReturnValue({ mutate });
    
    render(<MessageActions {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'upvote' }));
    
    expect(global.fetch).toHaveBeenCalledWith('/api/vote', {
      method: 'PATCH',
      body: JSON.stringify({
        chatId: 'test-chat',
        messageId: 'test-id',
        type: 'up',
      }),
    });
    
    expect(toast.promise).toHaveBeenCalled();
  });

  it('handles downvoting', async () => {
    const mutate = jest.fn();
    (useSWRConfig as jest.Mock).mockReturnValue({ mutate });
    
    render(<MessageActions {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'downvote' }));
    
    expect(global.fetch).toHaveBeenCalledWith('/api/vote', {
      method: 'PATCH',
      body: JSON.stringify({
        chatId: 'test-chat',
        messageId: 'test-id',
        type: 'down',
      }),
    });
    
    expect(toast.promise).toHaveBeenCalled();
  });

  // Vote state handling
  it('disables upvote button when already upvoted', () => {
    render(
      <MessageActions
        {...defaultProps}
        vote={{ chatId: 'test-chat', messageId: 'test-id', isUpvoted: true }}
      />
    );
    
    expect(screen.getByRole('button', { name: 'upvote' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'downvote' })).not.toBeDisabled();
  });

  it('disables downvote button when already downvoted', () => {
    render(
      <MessageActions
        {...defaultProps}
        vote={{ chatId: 'test-chat', messageId: 'test-id', isUpvoted: false }}
      />
    );
    
    expect(screen.getByRole('button', { name: 'upvote' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'downvote' })).toBeDisabled();
  });

  // Memoization
  it('memoizes correctly to prevent unnecessary rerenders', () => {
    const { rerender } = render(<MessageActions {...defaultProps} />);
    
    // Rerender with same props
    rerender(<MessageActions {...defaultProps} />);
    
    // Rerender with different vote
    rerender(
      <MessageActions
        {...defaultProps}
        vote={{ chatId: 'test-chat', messageId: 'test-id', isUpvoted: true }}
      />
    );
    
    // Rerender with different loading state
    rerender(<MessageActions {...defaultProps} isLoading={true} />);
  });
}); 