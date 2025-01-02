import { render, screen } from '@testing-library/react';
import { SubmitButton } from '@/components/submit-button';

// Mock useFormStatus hook
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: jest.fn(() => ({ pending: false }))
}));

describe('SubmitButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (jest.requireMock('react-dom').useFormStatus as jest.Mock).mockImplementation(() => ({ pending: false }));
  });

  it('renders with the correct label', () => {
    render(<SubmitButton isSuccessful={false}>Submit</SubmitButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Submit');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
    
    // Check accessibility output
    const output = screen.getByText('Submit form');
    expect(output).toHaveAttribute('aria-live', 'polite');
    expect(output).toHaveClass('sr-only');
  });

  it('shows loading state when pending', () => {
    (jest.requireMock('react-dom').useFormStatus as jest.Mock).mockImplementation(() => ({ pending: true }));
    
    render(<SubmitButton isSuccessful={false}>Submit</SubmitButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    
    // Check loading spinner
    const spinnerContainer = button.querySelector('.animate-spin') as HTMLElement;
    expect(spinnerContainer).toBeInTheDocument();
    expect(spinnerContainer.querySelector('svg')).toBeInTheDocument();
    
    // Check accessibility output
    const output = screen.getByText('Loading');
    expect(output).toHaveAttribute('aria-live', 'polite');
  });

  it('shows loading state when successful', () => {
    render(<SubmitButton isSuccessful={true}>Submit</SubmitButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    
    // Check loading spinner
    const spinnerContainer = button.querySelector('.animate-spin') as HTMLElement;
    expect(spinnerContainer).toBeInTheDocument();
    expect(spinnerContainer.querySelector('svg')).toBeInTheDocument();
    
    // Check accessibility output
    const output = screen.getByText('Loading');
    expect(output).toHaveAttribute('aria-live', 'polite');
  });

  it('handles both pending and successful states', () => {
    (jest.requireMock('react-dom').useFormStatus as jest.Mock).mockImplementation(() => ({ pending: true }));
    
    render(<SubmitButton isSuccessful={true}>Submit</SubmitButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    
    // Check loading spinner
    const spinnerContainer = button.querySelector('.animate-spin') as HTMLElement;
    expect(spinnerContainer).toBeInTheDocument();
    expect(spinnerContainer.querySelector('svg')).toBeInTheDocument();
    
    // Check accessibility output
    const output = screen.getByText('Loading');
    expect(output).toHaveAttribute('aria-live', 'polite');
  });
}); 