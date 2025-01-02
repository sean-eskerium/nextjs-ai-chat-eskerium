import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  // Basic rendering
  it('renders with default styles', () => {
    render(<Textarea data-testid="test-textarea" />);
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveClass('flex min-h-[80px] w-full rounded-md border');
  });

  // Props validation
  it('accepts and applies custom className', () => {
    render(<Textarea className="custom-class" data-testid="test-textarea" />);
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveClass('custom-class');
  });

  // Event handling
  it('calls onChange when text is entered', async () => {
    const handleChange = jest.fn();
    render(<Textarea onChange={handleChange} data-testid="test-textarea" />);
    
    const textarea = screen.getByTestId('test-textarea');
    await userEvent.type(textarea, 'Hello');
    
    expect(handleChange).toHaveBeenCalled();
    expect(textarea).toHaveValue('Hello');
  });

  // Placeholder
  it('displays placeholder text', () => {
    const placeholder = 'Enter your message';
    render(<Textarea placeholder={placeholder} />);
    
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
  });

  // Disabled state
  it('handles disabled state', () => {
    render(<Textarea disabled data-testid="test-textarea" />);
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('disabled:cursor-not-allowed disabled:opacity-50');
  });

  // Focus handling
  it('handles focus events', async () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Textarea 
        onFocus={handleFocus} 
        onBlur={handleBlur} 
        data-testid="test-textarea"
      />
    );
    const textarea = screen.getByTestId('test-textarea');
    
    // Focus the textarea
    await userEvent.click(textarea);
    expect(handleFocus).toHaveBeenCalled();
    
    // Blur the textarea
    await userEvent.tab();
    expect(handleBlur).toHaveBeenCalled();
  });

  // Value controlled behavior
  it('works as a controlled component', () => {
    const value = 'Controlled value';
    render(<Textarea value={value} readOnly data-testid="test-textarea" />);
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveValue(value);
  });

  // Ref forwarding
  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} data-testid="test-textarea" />);
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toBe(screen.getByTestId('test-textarea'));
  });
}); 