import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { ChatHeader } from '@/components/chat-header';
import { useSidebar } from '@/components/ui/sidebar';
import { VisibilityType } from '@/components/visibility-selector';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock usehooks-ts
jest.mock('usehooks-ts', () => ({
  useWindowSize: jest.fn(() => ({
    width: 1024,
    height: 768,
  })),
}));

// Mock sidebar hook
jest.mock('@/components/ui/sidebar', () => ({
  useSidebar: jest.fn(() => ({
    open: false,
    toggleSidebar: jest.fn(),
  })),
}));

// Mock Radix UI Tooltip components
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock ModelSelector component
jest.mock('@/components/model-selector', () => ({
  ModelSelector: () => <div data-testid="model-selector">Model Selector</div>,
}));

// Mock VisibilitySelector component
jest.mock('@/components/visibility-selector', () => ({
  VisibilitySelector: () => <div data-testid="visibility-selector">Visibility Selector</div>,
}));

// Mock SidebarToggle component
jest.mock('@/components/sidebar-toggle', () => ({
  SidebarToggle: () => (
    <button aria-label="Toggle Sidebar">
      <svg aria-hidden="true" />
    </button>
  ),
}));

describe('ChatHeader', () => {
  const defaultProps = {
    chatId: 'test-chat-id',
    selectedModelId: 'gpt-4',
    selectedVisibilityType: 'public' as VisibilityType,
    isReadonly: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all components when not readonly', () => {
    render(<ChatHeader {...defaultProps} />);
    
    // Verify sidebar toggle is present
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    
    // Verify new chat button is present
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
    
    // Verify model selector is present
    expect(screen.getByTestId('model-selector')).toBeInTheDocument();
    
    // Verify visibility selector is present
    expect(screen.getByTestId('visibility-selector')).toBeInTheDocument();
  });

  it('hides model and visibility selectors when readonly', () => {
    render(<ChatHeader {...defaultProps} isReadonly={true} />);
    
    // Verify sidebar toggle is still present
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    
    // Verify new chat button is still present
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
    
    // Verify model selector is not present
    expect(screen.queryByTestId('model-selector')).not.toBeInTheDocument();
    
    // Verify visibility selector is not present
    expect(screen.queryByTestId('visibility-selector')).not.toBeInTheDocument();
  });

  it('navigates to home and refreshes on new chat click', async () => {
    const user = userEvent.setup();
    const mockRouter = {
      push: jest.fn(),
      refresh: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    render(<ChatHeader {...defaultProps} />);
    
    const newChatButton = screen.getByRole('button', { name: /new chat/i });
    await user.click(newChatButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/');
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('shows new chat button when sidebar is closed or on mobile', () => {
    // Test with closed sidebar
    (useSidebar as jest.Mock).mockReturnValue({ open: false });
    const { rerender } = render(<ChatHeader {...defaultProps} />);
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();

    // Test with open sidebar but on mobile
    (useSidebar as jest.Mock).mockReturnValue({ open: true });
    (useWindowSize as jest.Mock).mockReturnValue({ width: 767, height: 768 });
    rerender(<ChatHeader {...defaultProps} />);
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
  });

  it('hides new chat button when sidebar is open and on desktop', () => {
    (useSidebar as jest.Mock).mockReturnValue({ open: true });
    (useWindowSize as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
    
    render(<ChatHeader {...defaultProps} />);
    
    expect(screen.queryByRole('button', { name: /new chat/i })).not.toBeInTheDocument();
  });
}); 