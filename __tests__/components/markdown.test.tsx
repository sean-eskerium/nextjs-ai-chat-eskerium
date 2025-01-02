import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Markdown } from '@/components/markdown';

describe('Markdown', () => {
  // Basic rendering
  it('renders plain text content', () => {
    const content = 'Hello world';
    render(<Markdown>{content}</Markdown>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  // Headings
  it('renders headings with correct hierarchy and styles', () => {
    const content = '# Heading 1\n## Heading 2\n### Heading 3';
    render(<Markdown>{content}</Markdown>);
    
    expect(screen.getByRole('heading', { level: 1, name: 'Heading 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Heading 2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Heading 3' })).toBeInTheDocument();
  });

  // Lists
  it('renders unordered and ordered lists', () => {
    const content = '- Item 1\n- Item 2\n1. First\n2. Second';
    render(<Markdown>{content}</Markdown>);
    
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Item 1');
    expect(items[2]).toHaveTextContent('First');
  });

  // Links
  it('renders links with proper attributes', () => {
    const content = '[Test Link](https://example.com)';
    render(<Markdown>{content}</Markdown>);
    
    const link = screen.getByRole('link', { name: 'Test Link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // Code blocks
  it('renders inline code', () => {
    const content = '`const test = "code";`';
    render(<Markdown>{content}</Markdown>);
    
    const code = screen.getByText('const test = "code";');
    expect(code.tagName).toBe('CODE');
  });

  // Emphasis
  it('renders emphasized text', () => {
    const content = '**Bold**';
    render(<Markdown>{content}</Markdown>);
    
    const boldText = screen.getByText('Bold');
    expect(boldText.tagName).toBe('STRONG');
  });

  // Custom components
  it('accepts custom components for rendering', () => {
    const CustomParagraph = ({ children }: { children: React.ReactNode }) => (
      <p data-testid="custom-p">{children}</p>
    );

    const content = 'Test paragraph';
    render(<Markdown components={{ p: CustomParagraph }}>{content}</Markdown>);
    
    expect(screen.getByTestId('custom-p')).toHaveTextContent('Test paragraph');
  });

  // Memoization
  it('memoizes correctly to prevent unnecessary rerenders', () => {
    const renderCount = { current: 0 };
    const TestComponent = () => {
      renderCount.current++;
      return null;
    };

    const { rerender } = render(
      <Markdown components={{ p: TestComponent }}>Test content</Markdown>
    );

    const firstRenderCount = renderCount.current;
    
    // Rerender with same content and components
    rerender(<Markdown components={{ p: TestComponent }}>Test content</Markdown>);
    expect(renderCount.current).toBe(firstRenderCount); // Should not rerender
    
    // Rerender with different content
    rerender(<Markdown components={{ p: TestComponent }}>Different content</Markdown>);
    expect(renderCount.current).toBeGreaterThan(firstRenderCount); // Should rerender
  });

  // Wrapper classes
  it('applies proper wrapper classes', () => {
    render(<Markdown>Test content</Markdown>);
    
    const wrapper = screen.getByText('Test content').closest('.prose');
    expect(wrapper).toHaveClass('prose dark:prose-invert max-w-none');
  });

  // Empty content
  it('handles empty content gracefully', () => {
    const { container } = render(<Markdown>{''}</Markdown>);
    const wrapper = container.querySelector('.prose');
    expect(wrapper).toBeInTheDocument();
  });
}); 