import { render, screen } from '@testing-library/react';
import { Textarea } from '../../../components/ui/textarea';

describe('Textarea', () => {
  it('renders with default styles', () => {
    render(<Textarea data-testid="test-textarea" />);
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveClass('flex min-h-[80px] w-full rounded-md border');
  });

  it('merges custom className with default styles', () => {
    render(<Textarea data-testid="test-textarea" className="custom-class" />);
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveClass('custom-class');
    expect(textarea).toHaveClass('flex min-h-[80px] w-full rounded-md border');
  });
}); 