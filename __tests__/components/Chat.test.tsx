import { render, screen } from '@testing-library/react';
import { Chat } from '../../components/chat';
import type { Message } from 'ai';
import type { VisibilityType } from '../../components/visibility-selector';
import { TooltipProvider } from '@radix-ui/react-tooltip';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

// Mock problematic dependencies
jest.mock('../../components/toolbar', () => ({
  Toolbar: () => <div data-testid="mock-toolbar" />
}));

jest.mock('../../components/block', () => ({
  Block: () => <div data-testid="mock-block" />
}));

// Mock sidebar hook
jest.mock('../../components/ui/sidebar', () => ({
  useSidebar: () => ({ open: false }),
}));

// Set up window mock before tests
beforeAll(() => {
  Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
});

describe('Chat Component', () => {
  const mockProps = {
    id: '123',
    initialMessages: [] as Message[],
    selectedModelId: 'gpt-4',
    selectedVisibilityType: 'private' as VisibilityType,
    isReadonly: false,
  };

  it('renders in read/write mode', () => {
    render(
      <TooltipProvider>
        <Chat {...mockProps} />
      </TooltipProvider>
    );
    const textbox = screen.getByRole('textbox');
    expect(textbox).toBeInTheDocument();
  });

  it('renders in readonly mode', () => {
    render(
      <TooltipProvider>
        <Chat {...mockProps} isReadonly={true} />
      </TooltipProvider>
    );
    const textbox = screen.queryByRole('textbox');
    expect(textbox).not.toBeInTheDocument();
  });
}); 