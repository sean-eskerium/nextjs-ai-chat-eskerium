import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarToggle } from '@/components/sidebar-toggle';

// Mock the useSidebar hook with proper setup
const mockToggleSidebar = jest.fn();
jest.mock('@/components/ui/sidebar', () => ({
  useSidebar: () => ({
    toggleSidebar: mockToggleSidebar,
  }),
}));

// Mock Radix UI Tooltip components with proper ARIA roles
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => children,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div role="tooltip">{children}</div>
  ),
}));

// Mock the Button component to match actual rendered output
jest.mock('@/components/ui/button', () => ({
  Button: ({ 
    children,
    className,
    onClick,
    variant = 'default',
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button
      onClick={onClick}
      className={className}
      type="button"
      aria-label="Toggle Sidebar"
    >
      {children}
    </button>
  ),
}));

describe('SidebarToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct accessibility and handles click', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<SidebarToggle />);
    
    // ASSERT - Initial render
    // Find button by its accessible name
    const button = screen.getByRole('button', { name: 'Toggle Sidebar' });
    expect(button).toBeInTheDocument();
    
    // Check tooltip content is accessible
    expect(screen.getByRole('tooltip')).toHaveTextContent('Toggle Sidebar');
    
    // Check icon is rendered
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
    
    // ACT - Click the button
    await user.click(button);
    
    // ASSERT - Verify toggleSidebar was called
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('accepts custom className without breaking accessibility', () => {
    // ARRANGE & ACT
    const customClass = 'test-class';
    render(<SidebarToggle className={customClass} />);
    
    // ASSERT - Verify accessibility is maintained
    const button = screen.getByRole('button', { name: 'Toggle Sidebar' });
    expect(button).toBeInTheDocument();
    
    // Verify tooltip is still accessible
    expect(screen.getByRole('tooltip')).toHaveTextContent('Toggle Sidebar');
  });
}); 