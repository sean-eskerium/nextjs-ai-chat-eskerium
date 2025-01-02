import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Radix UI components
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children, side }: { children: React.ReactNode; side?: string }) => (
    <div data-testid="dropdown-content" role="menu" data-side={side}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onSelect, asChild }: { children: React.ReactNode; onSelect?: () => void; asChild?: boolean }) => (
    <div 
      data-testid="dropdown-item" 
      role="menuitem" 
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.();
      }}
      tabIndex={-1}
    >
      {asChild ? children : <span>{children}</span>}
    </div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" role="separator" />,
}));

// Mock Sidebar components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-menu">{children}</div>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-menu-item">{children}</div>
  ),
  SidebarMenuButton: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button type="button" className={className} data-testid="sidebar-menu-button">
      {children}
    </button>
  ),
}));

const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
};

const setup = (props = {}) => {
  const user = userEvent.setup();
  const utils = render(
    <TooltipProvider>
      <SidebarUserNav user={mockUser} {...props} />
    </TooltipProvider>
  );
  return {
    user,
    ...utils,
  };
};

describe('SidebarUserNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
    });
  });

  it('renders user information correctly', () => {
    setup();

    const menuButton = screen.getByTestId('sidebar-menu-button');
    expect(menuButton).toBeInTheDocument();

    const avatar = within(menuButton).getByAltText('test@example.com');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute(
      'src',
      'https://avatar.vercel.sh/test@example.com'
    );

    expect(within(menuButton).getByText('test@example.com')).toBeInTheDocument();
  });

  it('handles theme toggle correctly', async () => {
    const mockSetTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    const { user } = setup();

    // Open dropdown
    const menuButton = screen.getByTestId('sidebar-menu-button');
    await user.click(menuButton);

    // Find and click theme toggle
    const dropdownContent = screen.getByTestId('dropdown-content');
    const themeToggle = within(dropdownContent).getByText('Toggle dark mode');
    await user.click(themeToggle);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('handles sign out correctly', async () => {
    const { user } = setup();

    // Open dropdown
    const menuButton = screen.getByTestId('sidebar-menu-button');
    await user.click(menuButton);

    // Find and click sign out
    const dropdownContent = screen.getByTestId('dropdown-content');
    const signOutButton = within(dropdownContent).getByText('Sign out');
    await user.click(signOutButton);

    expect(signOut).toHaveBeenCalledWith({
      redirectTo: '/',
    });
  });

  it('supports keyboard navigation', async () => {
    const { user } = setup();

    // Focus menu button
    await user.tab();
    const menuButton = screen.getByTestId('sidebar-menu-button');
    expect(menuButton).toHaveFocus();

    // Open menu with Enter
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();

    // Verify menu items are present
    const dropdownContent = screen.getByTestId('dropdown-content');
    const menuItems = within(dropdownContent).getAllByTestId('dropdown-item');
    expect(menuItems).toHaveLength(2);

    // Verify menu items have correct text
    expect(menuItems[0]).toHaveTextContent('Toggle dark mode');
    expect(menuItems[1]).toHaveTextContent('Sign out');
  });

  it('handles theme toggle in dark mode', async () => {
    const mockSetTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    const { user } = setup();

    // Open dropdown
    const menuButton = screen.getByTestId('sidebar-menu-button');
    await user.click(menuButton);

    // Find and click theme toggle
    const dropdownContent = screen.getByTestId('dropdown-content');
    const themeToggle = within(dropdownContent).getByText('Toggle light mode');
    await user.click(themeToggle);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
}); 