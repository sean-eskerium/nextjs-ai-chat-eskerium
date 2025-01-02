import { render } from '@testing-library/react';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { useChat } from 'ai/react';
import { useBlock } from '@/hooks/use-block';
import { useUserMessageId } from '@/hooks/use-user-message-id';
import { BlockKind } from '@/components/block';

// Mock dependencies
jest.mock('ai/react', () => ({
  useChat: jest.fn(),
}));

jest.mock('@/hooks/use-block', () => ({
  useBlock: jest.fn(),
  initialBlockData: {
    documentId: '',
    title: '',
    content: '',
    kind: 'text' as BlockKind,
    status: 'idle',
    isVisible: false,
  },
}));

jest.mock('@/hooks/use-user-message-id', () => ({
  useUserMessageId: jest.fn(),
}));

describe('DataStreamHandler', () => {
  const mockSetBlock = jest.fn();
  const mockSetUserMessageIdFromServer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useChat
    (useChat as jest.Mock).mockReturnValue({
      data: [],
    });

    // Mock useBlock
    (useBlock as jest.Mock).mockReturnValue({
      setBlock: mockSetBlock,
    });

    // Mock useUserMessageId
    (useUserMessageId as jest.Mock).mockReturnValue({
      setUserMessageIdFromServer: mockSetUserMessageIdFromServer,
    });
  });

  it('renders nothing', () => {
    const { container } = render(<DataStreamHandler id="test-id" />);
    expect(container.firstChild).toBeNull();
  });

  describe('data stream processing', () => {
    it('processes new deltas only', () => {
      const { rerender } = render(<DataStreamHandler id="test-id" />);

      // First update
      (useChat as jest.Mock).mockReturnValue({
        data: [{ type: 'text-delta', content: 'Hello' }],
      });
      rerender(<DataStreamHandler id="test-id" />);

      // Second update with same data
      rerender(<DataStreamHandler id="test-id" />);

      // Should only process once
      expect(mockSetBlock).toHaveBeenCalledTimes(1);
    });

    it('handles user message id', () => {
      const { rerender } = render(<DataStreamHandler id="test-id" />);

      (useChat as jest.Mock).mockReturnValue({
        data: [{ type: 'user-message-id', content: 'msg-123' }],
      });
      rerender(<DataStreamHandler id="test-id" />);

      expect(mockSetUserMessageIdFromServer).toHaveBeenCalledWith('msg-123');
      expect(mockSetBlock).not.toHaveBeenCalled();
    });

    it('handles block updates', () => {
      const { rerender } = render(<DataStreamHandler id="test-id" />);

      // Simulate stream of updates
      (useChat as jest.Mock).mockReturnValue({
        data: [
          { type: 'id', content: 'doc-123' },
          { type: 'title', content: 'Test Title' },
          { type: 'kind', content: 'code' },
          { type: 'text-delta', content: 'Hello' },
          { type: 'code-delta', content: 'console.log()' },
          { type: 'clear', content: '' },
          { type: 'finish', content: '' },
        ],
      });
      rerender(<DataStreamHandler id="test-id" />);

      // Verify all updates were processed
      expect(mockSetBlock).toHaveBeenCalledTimes(7);

      // Get all updater functions
      const updaters = mockSetBlock.mock.calls.map(call => call[0]);

      // Test each updater with a mock draft
      const mockDraft = {
        documentId: '',
        title: '',
        content: '',
        kind: 'text' as BlockKind,
        status: 'idle',
        isVisible: false,
      };

      // ID update
      expect(updaters[0](mockDraft)).toEqual({
        ...mockDraft,
        documentId: 'doc-123',
        status: 'streaming',
      });

      // Title update
      expect(updaters[1](mockDraft)).toEqual({
        ...mockDraft,
        title: 'Test Title',
        status: 'streaming',
      });

      // Kind update
      expect(updaters[2](mockDraft)).toEqual({
        ...mockDraft,
        kind: 'code',
        status: 'streaming',
      });

      // Text delta update
      expect(updaters[3](mockDraft)).toEqual({
        ...mockDraft,
        content: 'Hello',
        status: 'streaming',
      });

      // Code delta update
      expect(updaters[4](mockDraft)).toEqual({
        ...mockDraft,
        content: 'console.log()',
        status: 'streaming',
      });

      // Clear update
      expect(updaters[5](mockDraft)).toEqual({
        ...mockDraft,
        content: '',
        status: 'streaming',
      });

      // Finish update
      expect(updaters[6](mockDraft)).toEqual({
        ...mockDraft,
        status: 'idle',
      });
    });
  });

  describe('block state updates', () => {
    it('creates initial block if none exists', () => {
      const { rerender } = render(<DataStreamHandler id="test-id" />);

      (useChat as jest.Mock).mockReturnValue({
        data: [{ type: 'text-delta', content: 'Hello' }],
      });
      rerender(<DataStreamHandler id="test-id" />);

      // Get the updater function
      const updater = mockSetBlock.mock.calls[0][0];

      // Test with no existing block
      const result = updater(null);
      expect(result).toEqual({
        documentId: '',
        title: '',
        content: '',
        kind: 'text',
        status: 'streaming',
        isVisible: false,
      });
    });

    it('handles visibility transitions', () => {
      const { rerender } = render(<DataStreamHandler id="test-id" />);

      // Create a long text to trigger visibility
      const longText = 'a'.repeat(425);
      (useChat as jest.Mock).mockReturnValue({
        data: [{ type: 'text-delta', content: longText }],
      });
      rerender(<DataStreamHandler id="test-id" />);

      // Get the updater function
      const updater = mockSetBlock.mock.calls[0][0];

      // Test with existing block that has content
      const mockDraft = {
        documentId: '',
        title: '',
        content: longText,
        kind: 'text' as BlockKind,
        status: 'streaming',
        isVisible: false,
      };

      const result = updater(mockDraft);
      expect(result.isVisible).toBe(true);
    });

    it('maintains visibility state', () => {
      const { rerender } = render(<DataStreamHandler id="test-id" />);

      // Short text shouldn't change visibility
      const shortText = 'Hello';
      (useChat as jest.Mock).mockReturnValue({
        data: [{ type: 'text-delta', content: shortText }],
      });
      rerender(<DataStreamHandler id="test-id" />);

      // Get the updater function
      const updater = mockSetBlock.mock.calls[0][0];

      // Test with existing visible block
      const mockDraft = {
        documentId: '',
        title: '',
        content: '',
        kind: 'text' as BlockKind,
        status: 'streaming',
        isVisible: true,
      };

      const result = updater(mockDraft);
      expect(result.isVisible).toBe(true);
    });
  });
}); 