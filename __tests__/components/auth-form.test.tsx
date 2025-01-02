import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '@/components/auth-form';

// Mock next/form
jest.mock('next/form', () => ({
  __esModule: true,
  default: ({ action, children, ...props }: any) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        action(formData);
      }}
      {...props}
    >
      {children}
    </form>
  ),
}));

describe('AuthForm', () => {
  const mockAction = jest.fn();
  const mockChildren = <button type="submit">Submit</button>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders form elements with proper labels and attributes', () => {
      render(
        <AuthForm action={mockAction}>
          {mockChildren}
        </AuthForm>
      );

      // Email field
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'user@acme.com');

      // Password field
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');

      // Children
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders with default email when provided', () => {
      const defaultEmail = 'test@example.com';
      render(
        <AuthForm action={mockAction} defaultEmail={defaultEmail}>
          {mockChildren}
        </AuthForm>
      );

      expect(screen.getByRole('textbox', { name: /email address/i }))
        .toHaveValue(defaultEmail);
    });
  });

  describe('Form Submission', () => {
    it('calls action with form data when submitted', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm action={mockAction}>
          {mockChildren}
        </AuthForm>
      );

      // Fill out form
      await user.type(
        screen.getByRole('textbox', { name: /email address/i }),
        'test@example.com'
      );
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Verify form data
      expect(mockAction).toHaveBeenCalledTimes(1);
      const formData = mockAction.mock.calls[0][0] as FormData;
      expect(formData.get('email')).toBe('test@example.com');
      expect(formData.get('password')).toBe('password123');
    });

    it('requires email and password fields', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm action={mockAction}>
          {mockChildren}
        </AuthForm>
      );

      // Try to submit without filling fields
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Form should not submit
      expect(mockAction).not.toHaveBeenCalled();

      // Verify required attributes
      expect(screen.getByRole('textbox', { name: /email address/i }))
        .toBeInvalid();
      expect(screen.getByLabelText(/password/i)).toBeInvalid();
    });
  });
}); 