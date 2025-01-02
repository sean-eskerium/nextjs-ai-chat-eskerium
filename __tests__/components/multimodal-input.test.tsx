import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultimodalInput } from '@/components/multimodal-input';
import { toast } from 'sonner';
import { useWindowSize, useLocalStorage } from 'usehooks-ts';
import * as React from 'react';

// Mock useWindowSize and useLocalStorage
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

// Mock fetch for file uploads
global.fetch = jest.fn();

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

  const setup = (props = {}) => {
    const user = userEvent.setup();
    const utils = render(<MultimodalInput {...defaultProps} {...props} />);
    return {
      user,
      ...utils,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useWindowSize as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        url: 'test-url',
        pathname: 'test.txt',
        contentType: 'text/plain',
      }),
    });
  });

  describe('Message Input', () => {
    it('allows typing and sending a message', async () => {
      const handleSubmit = jest.fn();
      const setInput = jest.fn();
      setup({ handleSubmit, setInput, input: 'Hello world' });
      
      const input = screen.getByPlaceholderText('Send a message...');
      expect(input).toHaveValue('Hello world');
      
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(button => 
        button.querySelector('svg') && 
        button.className.includes('rounded-full')
      );
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).not.toBeDisabled();
      
      await userEvent.click(sendButton!);
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('prevents sending empty messages', () => {
      setup();
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(button => 
        button.querySelector('svg') && 
        button.className.includes('rounded-full')
      );
      expect(sendButton).toBeDisabled();
    });
  });

  describe('File Attachments', () => {
    it('allows file uploads', async () => {
      const setAttachments = jest.fn();
      const { user } = setup({ setAttachments });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(setAttachments).toHaveBeenCalled();
      });
    });

    it('shows error when upload fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));
      const { user } = setup();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload file, please try again!');
      });
    });
  });

  describe('Message Generation', () => {
    it('allows stopping message generation', async () => {
      const stop = jest.fn();
      const { user } = setup({ isLoading: true, stop });
      
      const buttons = screen.getAllByRole('button');
      const stopButton = buttons.find(button => 
        !button.hasAttribute('disabled') && 
        button.querySelector('svg') && 
        button.className.includes('rounded-full')
      );
      expect(stopButton).toBeInTheDocument();
      
      if (stopButton) {
        await user.click(stopButton);
        expect(stop).toHaveBeenCalled();
      }
    });
  });

  describe('Suggested Actions', () => {
    it('shows suggestions for new conversations', () => {
      setup();
      const suggestions = screen.getAllByRole('button').filter(button => 
        button.textContent && button.textContent.length > 0
      );
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('hides suggestions when conversation exists', () => {
      setup({ messages: [{ role: 'user', content: 'test', id: '1' }] });
      const suggestions = screen.getAllByRole('button').filter(button => 
        button.textContent && button.textContent.length > 0
      );
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('provides accessible input controls', () => {
      setup();
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      
      expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.some(button => !button.hasAttribute('disabled'))).toBe(true);
    });
  });
}); 