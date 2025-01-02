import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultimodalInput } from '@/components/multimodal-input';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';

// Mock useWindowSize
jest.mock('usehooks-ts', () => ({
  useWindowSize: jest.fn(),
  useLocalStorage: () => ['', jest.fn()],
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('MultimodalInput', () => {
  const defaultProps = {
    chatId: '123',
    input: '',
    setInput: jest.fn(),
    isLoading: false,
    stop: jest.fn(),
    attachments: [],
    setAttachments: jest.fn(),
    messages: [],
    setMessages: jest.fn(),
    append: jest.fn(),
    handleSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useWindowSize as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
  });

  it('renders correctly', () => {
    render(<MultimodalInput {...defaultProps} />);
    expect(screen.getByPlaceholderText('Send a message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'send' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'attach file' })).toBeInTheDocument();
  });

  describe('Input Handling', () => {
    it('updates input value on change', () => {
      render(<MultimodalInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Send a message...');
      fireEvent.change(textarea, { target: { value: 'test message' } });
      expect(defaultProps.setInput).toHaveBeenCalledWith('test message');
    });

    it('submits on Enter key if not empty', () => {
      render(<MultimodalInput {...defaultProps} input="test message" />);
      const textarea = screen.getByPlaceholderText('Send a message...');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      expect(defaultProps.handleSubmit).toHaveBeenCalledWith(undefined, {
        experimental_attachments: [],
      });
    });

    it('does not submit on Enter key if empty', () => {
      render(<MultimodalInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Send a message...');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      expect(defaultProps.handleSubmit).not.toHaveBeenCalled();
    });

    it('does not submit on Enter key if loading', () => {
      render(<MultimodalInput {...defaultProps} isLoading={true} input="test message" />);
      const textarea = screen.getByPlaceholderText('Send a message...');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      expect(defaultProps.handleSubmit).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Please wait for the model to finish its response!');
    });
  });

  describe('File Upload', () => {
    it('handles file upload successfully', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockUrl = 'test-url';
      
      // Mock fetch with a successful response
      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            url: mockUrl,
            pathname: 'test.txt',
            contentType: 'text/plain',
          }),
        })
      ) as jest.Mock;

      render(<MultimodalInput {...defaultProps} />);
      const input = screen.getByTestId('file-input');
      
      Object.defineProperty(input, 'files', {
        value: [file],
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(defaultProps.setAttachments).toHaveBeenCalledWith([{
          url: mockUrl,
          name: 'test.txt',
          contentType: 'text/plain',
        }]);
      });
    });

    it('shows error toast on upload failure', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      // Mock fetch with a failed response
      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to upload file, please try again!' }),
        })
      ) as jest.Mock;

      render(<MultimodalInput {...defaultProps} />);
      const input = screen.getByTestId('file-input');
      
      Object.defineProperty(input, 'files', {
        value: [file],
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload file, please try again!');
        expect(defaultProps.setAttachments).not.toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Behavior', () => {
    it('does not auto-focus textarea on mobile', () => {
      // Mock mobile width
      (useWindowSize as jest.Mock).mockReturnValue({ width: 500, height: 800 });
      
      render(<MultimodalInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Send a message...');
      expect(document.activeElement).not.toBe(textarea);
    });
  });

  describe('Loading State', () => {
    it('shows stop button when loading', () => {
      render(<MultimodalInput {...defaultProps} isLoading={true} />);
      
      const stopButton = screen.getByRole('button', { name: 'stop' });
      expect(stopButton).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'send' })).not.toBeInTheDocument();
    });

    it('calls stop function when stop button is clicked', () => {
      render(<MultimodalInput {...defaultProps} isLoading={true} />);
      
      const stopButton = screen.getByRole('button', { name: 'stop' });
      fireEvent.click(stopButton);
      
      expect(defaultProps.stop).toHaveBeenCalled();
    });
  });
}); 