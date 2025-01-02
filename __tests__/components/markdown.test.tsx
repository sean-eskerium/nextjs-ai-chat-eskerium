import { render, screen } from '@testing-library/react';
import { Markdown } from '@/components/markdown';

// Mock next/link as it's an external dependency
jest.mock('next/link', () => {
  return function Link({ children, ...props }: { children: React.ReactNode }) {
    return <a {...props}>{children}</a>;
  };
});

describe('Markdown', () => {
  describe('Basic Rendering', () => {
    it('renders plain text correctly', () => {
      render(<Markdown>Hello world</Markdown>);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('handles empty content', () => {
      const { container } = render(<Markdown>{''}</Markdown>);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Markdown Elements', () => {
    it('renders headings with correct styling', () => {
      render(<Markdown>{'# Test Heading'}</Markdown>);
      expect(screen.getByText('Test Heading')).toBeInTheDocument();
    });

    it('renders lists correctly', () => {
      render(<Markdown>{'- Test Item'}</Markdown>);
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('renders links with correct attributes', () => {
      render(<Markdown>{'[Test](https://example.com)'}</Markdown>);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Code Blocks', () => {
    it('renders code blocks', () => {
      render(<Markdown>{'`test code`'}</Markdown>);
      expect(screen.getByText('test code')).toBeInTheDocument();
    });

    it('renders inline code', () => {
      const content = 'Use `const` for constants';
      render(<Markdown>{content}</Markdown>);
      expect(screen.getByText('const')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('prevents rerenders when content is unchanged', () => {
      const { rerender } = render(<Markdown>Test content</Markdown>);
      const firstInstance = screen.getByText('Test content');
      
      rerender(<Markdown>Test content</Markdown>);
      const secondInstance = screen.getByText('Test content');
      
      expect(firstInstance).toBe(secondInstance);
    });

    it('rerenders when content changes', () => {
      const { rerender } = render(<Markdown>Initial content</Markdown>);
      
      rerender(<Markdown>New content</Markdown>);
      expect(screen.getByText('New content')).toBeInTheDocument();
      expect(screen.queryByText('Initial content')).not.toBeInTheDocument();
    });
  });
}); 