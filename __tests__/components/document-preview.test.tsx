import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentPreview } from '@/components/document-preview';
import { useBlock } from '@/hooks/use-block';
import useSWR from 'swr';

// Mock dependencies that affect user-visible behavior
jest.mock('swr');
jest.mock('@/hooks/use-block');
jest.mock('@/components/editor', () => ({
  Editor: ({ content }: { content: string }) => (
    <div role="textbox" aria-label="Document editor">
      {content}
    </div>
  ),
}));
jest.mock('@/components/code-editor', () => ({
  CodeEditor: ({ content }: { content: string }) => (
    <div role="textbox" aria-label="Code editor">
      {content}
    </div>
  ),
}));
jest.mock('@/components/document-skeleton', () => ({
  InlineDocumentSkeleton: () => (
    <div role="progressbar" aria-label="Loading document">
      Loading...
    </div>
  ),
}));
jest.mock('@/components/document', () => ({
  DocumentToolResult: ({ result }: { result: any }) => (
    <div role="article" aria-label="Document result">
      {result.title}
    </div>
  ),
  DocumentToolCall: ({ args }: { args: any }) => (
    <div role="article" aria-label="Document call">
      {args.title}
    </div>
  ),
}));
jest.mock('@/components/icons', () => ({
  FileIcon: () => <span aria-hidden="true">📄</span>,
  LoaderIcon: () => <span aria-hidden="true">⌛</span>,
  FullscreenIcon: () => <span aria-label="Toggle fullscreen">⛶</span>,
}));

// Mock data matching the Document type
const mockDocument = {
  id: '1',
  title: 'Test Document',
  kind: 'text',
  content: 'Test content',
  createdAt: new Date(),
  userId: 'test-user',
};

describe('DocumentPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default block state
    (useBlock as jest.Mock).mockReturnValue({
      block: {
        status: 'idle',
        isVisible: false,
        documentId: null,
      },
      setBlock: jest.fn(),
    });
    
    // Default loading state
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    // Reset any DOM mocks
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect));
  });

  describe('Loading States', () => {
    it('shows loading skeleton with proper ARIA attributes when fetching', () => {
      render(<DocumentPreview isReadonly={false} />);
      
      const loadingElement = screen.getByRole('progressbar', { name: /loading document/i });
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Document Display', () => {
    it('renders text document with proper structure and accessibility', () => {
      (useSWR as jest.Mock).mockReturnValue({
        data: [mockDocument],
        isLoading: false,
      });

      render(<DocumentPreview isReadonly={false} />);

      // Check document structure
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /document editor/i })).toHaveTextContent('Test content');
      expect(screen.getByLabelText(/toggle fullscreen/i)).toBeInTheDocument();
    });

    it('renders code document with appropriate editor', () => {
      const codeDocument = { ...mockDocument, kind: 'code' };
      (useSWR as jest.Mock).mockReturnValue({
        data: [codeDocument],
        isLoading: false,
      });

      render(<DocumentPreview isReadonly={false} />);

      expect(screen.getByRole('textbox', { name: /code editor/i })).toBeInTheDocument();
    });
  });

  describe('Streaming State', () => {
    it('shows loading indicator when streaming', () => {
      // Set up streaming state
      (useBlock as jest.Mock).mockReturnValue({
        block: {
          status: 'streaming',
          isVisible: false,
          documentId: '1',
          title: 'Streaming Doc',
          kind: 'text',
          content: 'Streaming content',
        },
        setBlock: jest.fn(),
      });

      // Important: Set isLoading to false to prevent loading skeleton
      (useSWR as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
      });

      render(<DocumentPreview isReadonly={false} />);

      // Verify streaming state
      const titleElement = screen.getByText('Streaming Doc');
      expect(titleElement).toBeInTheDocument();
      expect(screen.getByText('⌛')).toBeInTheDocument();
    });
  });

  describe('Fullscreen Interaction', () => {
    it('updates visibility and bounding box on fullscreen toggle', () => {
      const setBlock = jest.fn();
      (useBlock as jest.Mock).mockReturnValue({
        block: {
          status: 'idle',
          isVisible: false,
          documentId: null,
        },
        setBlock,
      });

      // Important: Provide document data and set isLoading to false
      (useSWR as jest.Mock).mockReturnValue({
        data: [mockDocument],
        isLoading: false,
      });

      const mockBoundingBox = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
        top: 200,
        right: 400,
        bottom: 600,
        left: 100,
        toJSON: () => ({}),
      } as DOMRect;

      Element.prototype.getBoundingClientRect = jest.fn(() => mockBoundingBox);

      render(<DocumentPreview isReadonly={false} result={{ id: '1', kind: 'text' }} />);

      // Find the fullscreen button by its accessible label
      const fullscreenButton = screen.getByLabelText('Toggle fullscreen');
      // Get the clickable container (hitbox) by traversing up to the nearest clickable ancestor
      const hitboxLayer = fullscreenButton.closest('[aria-hidden="true"]');
      expect(hitboxLayer).toBeInTheDocument();
      
      fireEvent.click(hitboxLayer!);

      expect(setBlock).toHaveBeenCalled();
      
      // Verify the state update
      const updaterFn = setBlock.mock.calls[0][0];
      const newState = updaterFn({ status: 'idle' });
      
      expect(newState).toMatchObject({
        isVisible: true,
        boundingBox: {
          left: mockBoundingBox.x,
          top: mockBoundingBox.y,
          width: mockBoundingBox.width,
          height: mockBoundingBox.height,
        },
      });
    });
  });

  describe('Tool Results', () => {
    it('renders document tool result when visible with result prop', () => {
      (useBlock as jest.Mock).mockReturnValue({
        block: {
          status: 'idle',
          isVisible: true,
          documentId: '1',
        },
        setBlock: jest.fn(),
      });

      const result = {
        id: '1',
        title: 'New Document',
        kind: 'text',
      };

      render(<DocumentPreview isReadonly={false} result={result} />);

      expect(screen.getByRole('article', { name: /document result/i })).toHaveTextContent('New Document');
    });
  });
}); 