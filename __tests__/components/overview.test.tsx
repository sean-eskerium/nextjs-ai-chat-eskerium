import { render, screen } from '@testing-library/react';
import { Overview } from '@/components/overview';
import { MessageIcon, VercelIcon } from '@/components/icons';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock icons
jest.mock('@/components/icons', () => ({
  MessageIcon: jest.fn(({ size }: { size: number }) => (
    <span data-testid="message-icon" data-size={size} />
  )),
  VercelIcon: jest.fn(({ size }: { size: number }) => (
    <span data-testid="vercel-icon" data-size={size} />
  )),
}));

describe('Overview', () => {
  it('renders with correct initial animation properties', () => {
    const { container } = render(<Overview />);
    const mainDiv = container.firstChild as HTMLElement;

    expect(mainDiv).toHaveClass('max-w-3xl mx-auto md:mt-20');
    expect(mainDiv).toHaveAttribute('initial');
    expect(mainDiv).toHaveAttribute('animate');
    expect(mainDiv).toHaveAttribute('exit');
    expect(mainDiv).toHaveAttribute('transition');
  });

  it('renders icons with correct size', () => {
    render(<Overview />);

    const messageIcon = screen.getByTestId('message-icon');
    const vercelIcon = screen.getByTestId('vercel-icon');

    expect(messageIcon).toHaveAttribute('data-size', '32');
    expect(vercelIcon).toHaveAttribute('data-size', '32');
  });

  it('renders links with correct attributes', () => {
    render(<Overview />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);

    // Open source link
    expect(links[0]).toHaveAttribute('href', 'https://github.com/vercel/ai-chatbot');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveClass('font-medium underline underline-offset-4');

    // Docs link
    expect(links[1]).toHaveAttribute('href', 'https://sdk.vercel.ai/docs');
    expect(links[1]).toHaveAttribute('target', '_blank');
    expect(links[1]).toHaveClass('font-medium underline underline-offset-4');
  });

  it('renders code snippets with correct styling', () => {
    render(<Overview />);

    const codeElements = screen.getAllByRole('code');
    expect(codeElements).toHaveLength(2);

    codeElements.forEach(element => {
      expect(element).toHaveClass('rounded-md bg-muted px-1 py-0.5');
    });

    expect(codeElements[0]).toHaveTextContent('streamText');
    expect(codeElements[1]).toHaveTextContent('useChat');
  });

  it('renders descriptive text content', () => {
    render(<Overview />);

    expect(screen.getByText(/This is an/)).toBeInTheDocument();
    expect(screen.getByText(/chatbot template built with/)).toBeInTheDocument();
    expect(screen.getByText(/You can learn more about/)).toBeInTheDocument();
  });

  it('renders with correct layout structure', () => {
    const { container } = render(<Overview />);

    const innerDiv = container.querySelector('.rounded-xl');
    expect(innerDiv).toHaveClass('p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl');

    const iconContainer = screen.getByText('+').parentElement;
    expect(iconContainer).toHaveClass('flex flex-row justify-center gap-4 items-center');
  });
}); 