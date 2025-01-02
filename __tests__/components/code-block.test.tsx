import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeBlock } from '@/components/code-block';

describe('CodeBlock', () => {
  describe('Inline Mode', () => {
    it('renders inline code with correct styling', () => {
      render(
        <CodeBlock inline={true} className="language-javascript" node={{}}>
          const x = 1;
        </CodeBlock>
      );

      const code = screen.getByText(/const x = 1/);
      expect(code.tagName).toBe('CODE');
      expect(code).toHaveClass('language-javascript');
      expect(code).toHaveClass('text-sm bg-zinc-100 dark:bg-zinc-800');
    });

    it('preserves code content and whitespace', () => {
      const content = '  const x = 1;  ';
      render(
        <CodeBlock inline={true} className="" node={{}}>
          {content}
        </CodeBlock>
      );

      const code = screen.getByText((text) => text.trim() === content.trim());
      expect(code).toBeInTheDocument();
    });
  });

  describe('Block Mode', () => {
    it('renders block code with pre/code elements', () => {
      render(
        <CodeBlock inline={false} className="language-javascript" node={{}}>
          const x = 1;
          const y = 2;
        </CodeBlock>
      );

      const code = screen.getByText(/const x = 1/);
      expect(code.tagName).toBe('CODE');
      expect(code).toHaveClass('whitespace-pre-wrap break-words');

      const pre = code.closest('pre');
      expect(pre).toBeInTheDocument();
      expect(pre).toHaveClass('text-sm w-full overflow-x-auto');
    });

    it('preserves multiline code content', () => {
      const content = `const x = 1;
const y = 2;
console.log(x + y);`;

      render(
        <CodeBlock inline={false} className="language-javascript" node={{}}>
          {content}
        </CodeBlock>
      );

      const code = screen.getByText((text) => text.includes('const x = 1;') && text.includes('console.log(x + y);'));
      expect(code).toBeInTheDocument();
      expect(code.tagName).toBe('CODE');
    });

    it('handles Python code with run functionality', () => {
      render(
        <CodeBlock inline={false} className="language-python" node={{}}>
          print("Hello World")
        </CodeBlock>
      );

      const code = screen.getByText(/print\("Hello World"\)/);
      expect(code).toBeInTheDocument();
      expect(code.tagName).toBe('CODE');

      const pre = code.closest('pre');
      expect(pre).toBeInTheDocument();
      expect(pre).toHaveClass('dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700');
    });
  });

  describe('Output Display', () => {
    it('shows output when available', () => {
      render(
        <CodeBlock inline={false} className="language-python" node={{}}>
          print("Hello World")
        </CodeBlock>
      );

      const code = screen.getByText(/print\("Hello World"\)/);
      expect(code).toBeInTheDocument();
      expect(code.tagName).toBe('CODE');
    });
  });
}); 