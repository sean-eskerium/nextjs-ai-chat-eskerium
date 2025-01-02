import React from 'react';

interface ReactMarkdownProps {
  children: string;
  components?: {
    h1?: React.ComponentType<any>;
    h2?: React.ComponentType<any>;
    h3?: React.ComponentType<any>;
    h4?: React.ComponentType<any>;
    h5?: React.ComponentType<any>;
    h6?: React.ComponentType<any>;
    p?: React.ComponentType<any>;
    a?: React.ComponentType<any>;
    code?: React.ComponentType<any>;
    pre?: React.ComponentType<any>;
    strong?: React.ComponentType<any>;
    ul?: React.ComponentType<any>;
    ol?: React.ComponentType<any>;
    li?: React.ComponentType<any>;
  };
  className?: string;
  remarkPlugins?: any[];
}

const ReactMarkdown: React.FC<ReactMarkdownProps> = ({ children, components = {}, className, remarkPlugins }) => {
  const parseInlineElements = React.useCallback((text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let currentText = '';
    let i = 0;

    const addCurrentText = () => {
      if (currentText) {
        parts.push(currentText);
        currentText = '';
      }
    };

    while (i < text.length) {
      // Code blocks
      if (text[i] === '`') {
        addCurrentText();
        const end = text.indexOf('`', i + 1);
        if (end !== -1) {
          const Code = components.code || (props => <code className="bg-gray-100 dark:bg-gray-800 rounded px-1" {...props} />);
          const code = text.slice(i + 1, end);
          parts.push(<Code key={`code-${i}`}>{code}</Code>);
          i = end + 1;
          continue;
        }
      }
      // Strong text
      else if (text[i] === '*' && text[i + 1] === '*') {
        addCurrentText();
        const end = text.indexOf('**', i + 2);
        if (end !== -1) {
          const Strong = components.strong || (props => <strong className="font-semibold" {...props} />);
          const strong = text.slice(i + 2, end);
          parts.push(<Strong key={`strong-${i}`}>{strong}</Strong>);
          i = end + 2;
          continue;
        }
      }
      // Links
      else if (text[i] === '[') {
        const textEnd = text.indexOf(']', i);
        const linkStart = textEnd !== -1 ? text.indexOf('(', textEnd) : -1;
        const linkEnd = linkStart !== -1 ? text.indexOf(')', linkStart) : -1;
        
        if (textEnd !== -1 && linkStart !== -1 && linkEnd !== -1) {
          addCurrentText();
          const A = components.a || (props => <a target="_blank" rel="noopener noreferrer" className="text-blue-500" {...props} />);
          const linkText = text.slice(i + 1, textEnd);
          const href = text.slice(linkStart + 1, linkEnd);
          parts.push(<A key={`link-${i}`} href={href}>{linkText}</A>);
          i = linkEnd + 1;
          continue;
        }
      }

      currentText += text[i];
      i++;
    }

    addCurrentText();
    return parts;
  }, [components]);

  const parseMarkdown = React.useCallback((text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Headings
      if (line.startsWith('# ')) {
        const H1 = components.h1 || (props => <h1 className="text-2xl font-bold" {...props} />);
        elements.push(<H1 key={i}>{parseInlineElements(line.slice(2))}</H1>);
      } else if (line.startsWith('## ')) {
        const H2 = components.h2 || (props => <h2 className="text-xl font-bold" {...props} />);
        elements.push(<H2 key={i}>{parseInlineElements(line.slice(3))}</H2>);
      } else if (line.startsWith('### ')) {
        const H3 = components.h3 || (props => <h3 className="text-lg font-bold" {...props} />);
        elements.push(<H3 key={i}>{parseInlineElements(line.slice(4))}</H3>);
      }
      // Lists
      else if (line.startsWith('* ') || line.startsWith('- ')) {
        const Ul = components.ul || (props => <ul className="list-disc list-inside" {...props} />);
        const Li = components.li || (props => <li {...props} />);
        elements.push(<Ul key={i}><Li>{parseInlineElements(line.slice(2))}</Li></Ul>);
      } else if (/^\d+\. /.test(line)) {
        const Ol = components.ol || (props => <ol className="list-decimal list-inside" {...props} />);
        const Li = components.li || (props => <li {...props} />);
        elements.push(<Ol key={i}><Li>{parseInlineElements(line.replace(/^\d+\. /, ''))}</Li></Ol>);
      }
      // Regular text
      else if (line) {
        const P = components.p || (props => <p {...props} />);
        elements.push(<P key={i}>{parseInlineElements(line)}</P>);
      }
    }

    return elements;
  }, [components, parseInlineElements]);

  return (
    <div className="prose dark:prose-invert max-w-none">
      <div className="markdown">
        {parseMarkdown(children)}
      </div>
    </div>
  );
};

export default React.memo(ReactMarkdown, (prevProps, nextProps) => {
  return prevProps.children === nextProps.children &&
         JSON.stringify(prevProps.components) === JSON.stringify(nextProps.components);
}); 