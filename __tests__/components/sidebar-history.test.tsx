import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { subDays } from 'date-fns';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';

import { SidebarHistory } from '@/components/sidebar-history';
import { useSidebar } from '@/components/ui/sidebar';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import type { Chat } from '@/lib/db/schema';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    promise: jest.fn(),
  },
}));

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock useChatVisibility
jest.mock('@/hooks/use-chat-visibility', () => ({
  useChatVisibility: jest.fn(),
}));

// Mock alert dialog components
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div data-testid="alert-dialog-title">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: any) => <button data-testid="alert-dialog-cancel">{children}</button>,
}));

// Mock dropdown menu components
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, onSelect }: any) => (
    <button data-testid="dropdown-item" onClick={onClick || onSelect}>
      {children}
    </button>
  ),
  DropdownMenuSub: ({ children }: any) => <div data-testid="dropdown-sub">{children}</div>,
  DropdownMenuSubTrigger: ({ children }: any) => <div data-testid="dropdown-sub-trigger">{children}</div>,
  DropdownMenuSubContent: ({ children }: any) => <div data-testid="dropdown-sub-content">{children}</div>,
  DropdownMenuPortal: ({ children }: any) => children,
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
}));

// Mock sidebar components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: any) => <div data-testid="sidebar-group">{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div data-testid="sidebar-group-content">{children}</div>,
  SidebarMenuItem: ({ children }: any) => <div data-testid="sidebar-menu-item">{children}</div>,
  SidebarMenuButton: ({ children, isActive }: any) => (
    <div data-testid="sidebar-menu-button" data-active={isActive}>
      {children}
    </div>
  ),
  SidebarMenuAction: ({ children }: any) => (
    <button data-testid="sidebar-menu-action" aria-label="More">
      {children}
    </button>
  ),
  SidebarMenu: ({ children }: any) => <div data-testid="sidebar-menu">{children}</div>,
  useSidebar: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, onClick }: any) => (
    <a data-testid="link" href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

const mockChats: Chat[] = [
  {
    id: '1',
    title: 'Today Chat',
    visibility: 'private',
    userId: 'user1',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Yesterday Chat',
    visibility: 'public',
    userId: 'user1',
    createdAt: subDays(new Date(), 1),
  },
];

const mockUser = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
};

describe('SidebarHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (usePathname as jest.Mock).mockReturnValue('/chat/1');
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useSidebar as jest.Mock).mockReturnValue({ setOpenMobile: jest.fn() });
    (useChatVisibility as jest.Mock).mockReturnValue({
      visibilityType: 'private',
      setVisibilityType: jest.fn(),
    });

    // Setup SWR mock with loading state first
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      mutate: jest.fn(),
    });
  });

  it('renders loading state correctly', () => {
    render(<SidebarHistory user={mockUser} />);

    // Verify loading skeletons are present
    const skeletonContainer = screen.getByTestId('sidebar-group-content');
    const skeletons = skeletonContainer.querySelectorAll('.bg-sidebar-accent-foreground\\/10');
    expect(skeletons).toHaveLength(5);
  });

  it('renders empty state when no chats exist', () => {
    // Mock SWR with empty data
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<SidebarHistory user={mockUser} />);
    expect(screen.getByText(/Your conversations will appear here/i)).toBeInTheDocument();
  });

  it('renders login message when user is not authenticated', () => {
    render(<SidebarHistory user={undefined} />);
    expect(screen.getByText(/Login to save and revisit previous chats!/i)).toBeInTheDocument();
  });

  it('renders chat list with correct grouping', () => {
    // Mock SWR with chat data
    (useSWR as jest.Mock).mockReturnValue({
      data: mockChats,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<SidebarHistory user={mockUser} />);

    // Verify chat titles are rendered
    expect(screen.getByText('Today Chat')).toBeInTheDocument();
    expect(screen.getByText('Yesterday Chat')).toBeInTheDocument();
  });

  it('handles chat deletion', async () => {
    const user = userEvent.setup();
    const mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock SWR with chat data
    const mutate = jest.fn();
    (useSWR as jest.Mock).mockReturnValue({
      data: mockChats,
      isLoading: false,
      mutate,
    });

    // Mock fetch for delete
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<SidebarHistory user={mockUser} />);

    // Find and click More button
    const moreButton = screen.getAllByTestId('sidebar-menu-action')[0];
    await user.click(moreButton);

    // Find and click Delete button
    const deleteButton = screen.getAllByTestId('dropdown-item').find(
      button => button.textContent === 'Delete'
    );
    if (!deleteButton) throw new Error('Delete button not found');
    await user.click(deleteButton);

    // Find and click Continue in the confirmation dialog
    const continueButton = screen.getByTestId('alert-dialog-action');
    await user.click(continueButton);

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chat?id=1',
      expect.objectContaining({ method: 'DELETE' })
    );

    // Verify toast
    expect(toast.promise).toHaveBeenCalled();
  });

  it('handles visibility change', async () => {
    const user = userEvent.setup();
    const setVisibilityType = jest.fn();
    (useChatVisibility as jest.Mock).mockReturnValue({
      visibilityType: 'private',
      setVisibilityType,
    });

    // Mock SWR with chat data
    (useSWR as jest.Mock).mockReturnValue({
      data: mockChats,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(<SidebarHistory user={mockUser} />);

    // Find and click More button
    const moreButton = screen.getAllByTestId('sidebar-menu-action')[0];
    await user.click(moreButton);

    // Find and click Share button
    const shareButton = screen.getAllByTestId('dropdown-sub-trigger').find(
      button => button.textContent?.includes('Share')
    );
    if (!shareButton) throw new Error('Share button not found');
    await user.click(shareButton);

    // Find and click Public option
    const publicOption = screen.getAllByTestId('dropdown-item').find(
      button => button.textContent?.includes('Public')
    );
    if (!publicOption) throw new Error('Public option not found');
    await user.click(publicOption);

    // Verify visibility change
    expect(setVisibilityType).toHaveBeenCalledWith('public');
  });
}); 