import ReactMarkdown from 'react-markdown';

export interface MarkdownProps {
  children: string;
  components?: {
    [key: string]: React.ComponentType<any>;
  };
}

export function Markdown({ children, components }: MarkdownProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
