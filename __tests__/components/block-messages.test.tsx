import { render, screen } from '@testing-library/react';
import { BlockMessages } from '@/components/block-messages';
import { PreviewMessage } from '@/components/message';
import { useScrollToBottom } from '@/components/use-scroll-to-bottom';
import { Vote } from '@/lib/db/schema';
import { Message } from 'ai';

// Mock dependencies
jest.mock('@/components/message', () => ({
  PreviewMessage: jest.fn(() => null),
}));

jest.mock('@/components/use-scroll-to-bottom', () => ({
  useScrollToBottom: jest.fn(() => [jest.fn(), jest.fn()]),
}));

// Cast PreviewMessage mock to avoid type errors
const MockPreviewMessage = (PreviewMessage as unknown) as jest.Mock;

describe('BlockMessages', () => {
  const mockSetMessages = jest.fn();
  const mockReload = jest.fn();

  const defaultProps = {
    chatId: 'test-chat',
    isLoading: false,
    votes: undefined,
    messages: [] as Message[],
    setMessages: mockSetMessages,
    reload: mockReload,
    isReadonly: false,
    blockStatus: 'idle' as const,
  };

  const testMessage: Message = {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
  };

  const testVote: Vote = {
    messageId: 'msg-1',
    chatId: 'test-chat',
    isUpvoted: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockPreviewMessage.mockImplementation(() => null);
    (useScrollToBottom as jest.Mock).mockReturnValue([jest.fn(), jest.fn()]);
  });

  it('renders scroll container with correct classes', () => {
    const { container } = render(<BlockMessages {...defaultProps} />);
    const classes = [
      'flex',
      'flex-col',
      'gap-4',
      'h-full',
      'items-center',
      'overflow-y-scroll',
      'px-4',
      'pt-20',
    ];
    classes.forEach(className => {
      expect(container.firstChild).toHaveClass(className);
    });
  });

  it('renders messages with PreviewMessage components', () => {
    const messages = [testMessage];
    render(<BlockMessages {...defaultProps} messages={messages} />);

    expect(MockPreviewMessage.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        chatId: 'test-chat',
        message: testMessage,
        isLoading: false,
        vote: undefined,
        isReadonly: false,
        setMessages: mockSetMessages,
        reload: mockReload,
      })
    );
  });

  it('handles loading state for last message', () => {
    const messages = [testMessage, { ...testMessage, id: 'msg-2' }];
    render(
      <BlockMessages {...defaultProps} messages={messages} isLoading={true} />
    );

    const calls = MockPreviewMessage.mock.calls;
    expect(calls[0][0].isLoading).toBe(false); // First message
    expect(calls[1][0].isLoading).toBe(true); // Last message
  });

  it('matches votes with messages', () => {
    const messages = [testMessage];
    const votes = [testVote];
    render(<BlockMessages {...defaultProps} messages={messages} votes={votes} />);

    expect(MockPreviewMessage.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        chatId: 'test-chat',
        message: testMessage,
        isLoading: false,
        vote: testVote,
        isReadonly: false,
        setMessages: mockSetMessages,
        reload: mockReload,
      })
    );
  });

  it('handles readonly state', () => {
    const messages = [testMessage];
    render(
      <BlockMessages {...defaultProps} messages={messages} isReadonly={true} />
    );

    expect(MockPreviewMessage.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        chatId: 'test-chat',
        message: testMessage,
        isLoading: false,
        vote: undefined,
        isReadonly: true,
        setMessages: mockSetMessages,
        reload: mockReload,
      })
    );
  });

  describe('memo behavior', () => {
    it('prevents rerenders during streaming', () => {
      const { rerender } = render(
        <BlockMessages {...defaultProps} blockStatus="streaming" />
      );

      // Reset mock to track new calls
      MockPreviewMessage.mockClear();

      // Rerender with new props but same streaming status
      rerender(
        <BlockMessages
          {...defaultProps}
          blockStatus="streaming"
          isLoading={true}
        />
      );

      // Should not rerender PreviewMessage
      expect(MockPreviewMessage).not.toHaveBeenCalled();
    });

    it('updates on loading state change', () => {
      const messages = [testMessage];
      const { rerender } = render(
        <BlockMessages {...defaultProps} messages={messages} />
      );

      // Reset mock to track new calls
      MockPreviewMessage.mockClear();

      // Rerender with new loading state
      rerender(
        <BlockMessages {...defaultProps} messages={messages} isLoading={true} />
      );

      // Should rerender PreviewMessage
      expect(MockPreviewMessage).toHaveBeenCalled();
    });

    it('updates on message length change', () => {
      const { rerender } = render(<BlockMessages {...defaultProps} />);

      // Reset mock to track new calls
      MockPreviewMessage.mockClear();

      // Rerender with new messages
      rerender(
        <BlockMessages {...defaultProps} messages={[testMessage]} />
      );

      // Should rerender PreviewMessage
      expect(MockPreviewMessage).toHaveBeenCalled();
    });

    it('updates on vote changes', () => {
      const messages = [testMessage];
      const { rerender } = render(
        <BlockMessages {...defaultProps} messages={messages} />
      );

      // Reset mock to track new calls
      MockPreviewMessage.mockClear();

      // Rerender with new votes
      rerender(
        <BlockMessages
          {...defaultProps}
          messages={messages}
          votes={[testVote]}
        />
      );

      // Should rerender PreviewMessage
      expect(MockPreviewMessage).toHaveBeenCalled();
    });
  });
}); 