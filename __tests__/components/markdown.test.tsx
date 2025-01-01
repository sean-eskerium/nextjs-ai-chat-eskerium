import React from 'react';
import { render, screen } from '@testing-library/react';
import { Markdown } from '../../components/markdown';

jest.mock('react-markdown');

describe('Markdown', () => {
  it('renders markdown content', () => {
    const content = 'Hello world';
    render(<Markdown>{content}</Markdown>);
    
    const element = screen.getByTestId('markdown');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent(content);
  });
}); 