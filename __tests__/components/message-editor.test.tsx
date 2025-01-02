import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageEditor } from '@/components/message-editor';
import { Message } from 'ai';
import { deleteTrailingMessages } from '@/app/(chat)/actions';
import { toast } from 'sonner';
import { useUserMessageId } from '@/hooks/use-user-message-id';

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
const mockMessage: Message = {
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

describe('MessageEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default hook implementation
    (useUserMessageId as jest.Mock).mockReturnValue({
      userMessageIdFromServer: 'test-id',
    });
  });

  describe('Initial Render', () => {
    it('renders textarea with initial message content', () => {
      render(<MessageEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Initial content');
    });

    it('renders action buttons with proper labels', () => {
      render(<MessageEditor {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls setMode with "view" when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<MessageEditor {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(defaultProps.setMode).toHaveBeenCalledWith('view');
    });

    it('updates content when user types', async () => {
      const user = userEvent.setup();
      render(<MessageEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'New content');
      
      expect(textarea).toHaveValue('New content');
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      (deleteTrailingMessages as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<MessageEditor {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /send/i }));
      expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
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
      
      // Wait for the API call
      await waitFor(() => {
        expect(deleteTrailingMessages).toHaveBeenCalledWith({ id: 'test-id' });
      });

      // Wait for setMessages to be called
      await waitFor(() => {
        expect(mockSetMessages).toHaveBeenCalled();
      });

      // Get the messages updater function and verify the update
      const messagesUpdater = mockSetMessages.mock.calls[0][0];
      const result = messagesUpdater([mockMessage]);
      expect(result[0].content).toBe(updatedContent);

      // Verify mode is set to view and reload is called
      await waitFor(() => {
        expect(defaultProps.setMode).toHaveBeenCalledWith('view');
        expect(defaultProps.reload).toHaveBeenCalled();
      });
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