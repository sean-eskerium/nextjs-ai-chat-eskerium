import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { Block } from '@/components/block';
import type { Message, CreateMessage, ChatRequestOptions, Attachment } from 'ai';
import { Dispatch, SetStateAction } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { Document } from '@/lib/db/schema';
import { useBlock } from '@/hooks/use-block';

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
  useSWRConfig: jest.fn()
}));

// Mock dependencies
jest.mock('@/components/ui/sidebar', () => ({
  useSidebar: () => ({ open: false })
}));

// Create stable mock data
const mockDocuments = [{
  id: 'test-doc',
  title: 'Test Document',
  content: 'test content',
  kind: 'text',
  createdAt: new Date(),
  userId: 'test-user'
}];

// Create stable mock block
const mockBlock = {
  documentId: 'test-doc',
  title: 'Test Document',
  content: 'test content',
  kind: 'text',
  isVisible: true,
  status: 'idle',
  boundingBox: { top: 0, left: 0, width: 0, height: 0 }
};

const mockSetBlock = jest.fn();
const mockSetLocalBlock = jest.fn();
const mockMutateDocuments = jest.fn().mockResolvedValue(mockDocuments);

// Mock useBlock with stable implementation
const mockUseBlock = jest.fn().mockReturnValue({
  block: mockBlock,
  setBlock: mockSetBlock,
  setLocalBlock: mockSetLocalBlock
});

jest.mock('@/hooks/use-block', () => ({
  useBlock: () => mockUseBlock()
}));

// Mock child components with minimal implementations
jest.mock('@/components/editor', () => ({
  Editor: jest.fn().mockImplementation(({ content, isReadonly }) => (
    <div data-testid="editor" aria-readonly={isReadonly}>
      {content}
    </div>
  ))
}));

jest.mock('@/components/code-editor', () => ({
  CodeEditor: jest.fn().mockImplementation(({ content }) => (
    <div data-testid="code-editor">{content}</div>
  ))
}));

jest.mock('@/components/document-skeleton', () => ({
  DocumentSkeleton: jest.fn().mockImplementation(() => (
    <div data-testid="document-skeleton">Loading...</div>
  ))
}));

jest.mock('@/components/toolbar', () => ({
  Toolbar: jest.fn().mockImplementation(() => <div data-testid="toolbar">Toolbar</div>)
}));

jest.mock('@/components/block-actions', () => ({
  BlockActions: jest.fn().mockImplementation(() => <div data-testid="block-actions">Actions</div>)
}));

jest.mock('@/components/block-messages', () => ({
  BlockMessages: jest.fn().mockImplementation(() => <div data-testid="block-messages">Messages</div>)
}));

// Mock window.ResizeObserver
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

global.ResizeObserver = mockResizeObserver;

describe('Block', () => {
  const defaultProps = {
    chatId: 'test-chat',
    input: '',
    setInput: jest.fn(),
    isLoading: false,
    stop: jest.fn(),
    attachments: [] as Attachment[],
    setAttachments: jest.fn() as Dispatch<SetStateAction<Attachment[]>>,
    append: jest.fn().mockResolvedValue('') as (message: Message | CreateMessage, options?: ChatRequestOptions) => Promise<string | null | undefined>,
    messages: [] as Message[],
    setMessages: jest.fn() as Dispatch<SetStateAction<Message[]>>,
    reload: jest.fn().mockResolvedValue(null) as (options?: ChatRequestOptions) => Promise<string | null | undefined>,
    votes: [],
    isReadonly: false,
    handleSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBlock.mockReturnValue({
      block: mockBlock,
      setBlock: mockSetBlock,
      setLocalBlock: mockSetLocalBlock
    });

    // Setup default mock implementations with stable data
    (useSWR as jest.Mock).mockImplementation((key) => {
      if (!key) return { data: undefined, isLoading: false, mutate: mockMutateDocuments };
      if (key.includes('/api/document')) {
        return {
          data: mockDocuments,
          isLoading: false,
          mutate: mockMutateDocuments
        };
      }
      if (key.includes('/api/suggestions')) {
        return {
          data: [],
          isLoading: false,
          mutate: mockMutateDocuments
        };
      }
      return { data: undefined, isLoading: false, mutate: mockMutateDocuments };
    });

    (useSWRConfig as jest.Mock).mockReturnValue({
      mutate: jest.fn().mockResolvedValue(mockDocuments)
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial Rendering', () => {
    it('should render in loading state when documents are being fetched', async () => {
      // Set up block with no content
      mockUseBlock.mockReturnValue({
        block: { ...mockBlock, content: '' },
        setBlock: mockSetBlock,
        setLocalBlock: mockSetLocalBlock
      });

      // Override the default mock for this test
      (useSWR as jest.Mock).mockImplementation((key) => {
        if (key?.includes('/api/document')) {
          return { data: undefined, isLoading: true, mutate: mockMutateDocuments };
        }
        return { data: undefined, isLoading: false, mutate: mockMutateDocuments };
      });

      render(<Block {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('document-skeleton')).toBeInTheDocument();
      });
    });

    it('should render editor for text documents', async () => {
      render(<Block {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('editor')).toBeInTheDocument();
      });
    });

    it('should render code editor for code documents', async () => {
      const codeDocuments = [{
        ...mockDocuments[0],
        kind: 'code'
      }];

      const codeBlock = {
        ...mockBlock,
        kind: 'code'
      };

      // Update the useBlock mock for this test
      mockUseBlock.mockReturnValue({
        block: codeBlock,
        setBlock: mockSetBlock,
        setLocalBlock: mockSetLocalBlock
      });

      // Override the default mock for this test
      (useSWR as jest.Mock).mockImplementation((key) => {
        if (key?.includes('/api/document')) {
          return {
            data: codeDocuments,
            isLoading: false,
            mutate: mockMutateDocuments
          };
        }
        return { data: undefined, isLoading: false, mutate: mockMutateDocuments };
      });

      render(<Block {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('code-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Component State', () => {
    it('should render toolbar when block is visible', async () => {
      render(<Block {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      });
    });

    it('should render block actions', async () => {
      render(<Block {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('block-actions')).toBeInTheDocument();
      });
    });
  });
}); 