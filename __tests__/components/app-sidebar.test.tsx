import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppSidebar } from '@/components/app-sidebar';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock the sidebar hook
jest.mock('@/components/ui/sidebar', () => ({
  useSidebar: jest.fn(() => ({
    setOpenMobile: jest.fn(),
  })),
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock child components
jest.mock('@/components/sidebar-history', () => ({
  SidebarHistory: () => <div data-testid="sidebar-history">History Mock</div>,
}));

jest.mock('@/components/sidebar-user-nav', () => ({
  SidebarUserNav: () => <div data-testid="sidebar-user-nav">User Nav Mock</div>,
}));

// Mock Radix UI Tooltip components
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Helper function to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      {ui}
    </TooltipProvider>
  );
};

describe('AppSidebar', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
  };

  it('renders correctly with user', () => {
    renderWithProviders(<AppSidebar user={mockUser} />);
    
    expect(screen.getByText('Chatbot')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-history')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-user-nav')).toBeInTheDocument();
    
    // New chat button should be present with plus icon
    const newChatButton = screen.getByRole('button');
    expect(newChatButton).toBeInTheDocument();
    expect(newChatButton.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('renders correctly without user', () => {
    renderWithProviders(<AppSidebar user={undefined} />);
    
    expect(screen.getByText('Chatbot')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-user-nav')).not.toBeInTheDocument();
  });

  it('handles new chat button click correctly', async () => {
    const mockRouter = {
      push: jest.fn(),
      refresh: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    const mockSetOpenMobile = jest.fn();
    (useSidebar as jest.Mock).mockReturnValue({
      setOpenMobile: mockSetOpenMobile,
    });

    renderWithProviders(<AppSidebar user={mockUser} />);
    
    // Find and click the new chat button
    const newChatButton = screen.getByRole('button');
    fireEvent.click(newChatButton);
    
    await waitFor(() => {
      expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
      expect(mockRouter.push).toHaveBeenCalledWith('/');
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it('has an accessible new chat button with tooltip', () => {
    renderWithProviders(<AppSidebar user={mockUser} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('p-2 h-fit');
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });
}); 