import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders with default styles', () => {
    render(<Textarea data-testid="test-textarea" />);
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea.className).toContain('flex');
    expect(textarea.className).toContain('min-h-[80px]');
    expect(textarea.className).toContain('w-full');
    expect(textarea.className).toContain('rounded-md');
  });

  it('accepts and displays user input', () => {
    render(<Textarea data-testid="test-textarea" />);
    
    const textarea = screen.getByTestId('test-textarea');
    fireEvent.change(textarea, { target: { value: 'Hello, World!' } });
    
    expect(textarea).toHaveValue('Hello, World!');
  });

  it('handles disabled state', () => {
    render(<Textarea data-testid="test-textarea" disabled />);
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toBeDisabled();
    expect(textarea.className).toContain('disabled:cursor-not-allowed');
    expect(textarea.className).toContain('disabled:opacity-50');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Textarea ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('applies custom className', () => {
    render(<Textarea data-testid="test-textarea" className="custom-class" />);
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea.className).toContain('custom-class');
  });

  it('handles placeholder text', () => {
    const placeholder = 'Enter your message...';
    render(<Textarea data-testid="test-textarea" placeholder={placeholder} />);
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveAttribute('placeholder', placeholder);
  });

  it('triggers onChange event', () => {
    const handleChange = jest.fn();
    render(<Textarea data-testid="test-textarea" onChange={handleChange} />);
    
    const textarea = screen.getByTestId('test-textarea');
    fireEvent.change(textarea, { target: { value: 'New value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });
}); 