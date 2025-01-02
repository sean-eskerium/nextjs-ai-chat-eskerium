import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisibilitySelector } from '@/components/visibility-selector';

// Mock the useChatVisibility hook
jest.mock('@/hooks/use-chat-visibility', () => ({
  useChatVisibility: jest.fn(({ initialVisibility }) => ({
    visibilityType: initialVisibility,
    setVisibilityType: jest.fn(),
  })),
}));

describe('VisibilitySelector', () => {
  const chatId = '123';
  const user = userEvent.setup();

  it('renders with initial visibility', () => {
    render(<VisibilitySelector chatId={chatId} selectedVisibilityType="private" />);
    
    const trigger = screen.getByRole('button', { name: /private/i });
    expect(trigger).toBeInTheDocument();
  });

  it('shows dropdown menu when clicked', async () => {
    render(<VisibilitySelector chatId={chatId} selectedVisibilityType="private" />);
    
    // Open dropdown
    await user.click(screen.getByRole('button', { name: /private/i }));
    
    // Verify dropdown content
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    
    // Check menu items
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(/private/i);
    expect(items[1]).toHaveTextContent(/public/i);
  });

  it('shows visual indicator for selected visibility', async () => {
    render(<VisibilitySelector chatId={chatId} selectedVisibilityType="private" />);
    
    // Open dropdown
    await user.click(screen.getByRole('button', { name: /private/i }));
    
    // Get menu items
    const menuItems = screen.getAllByRole('menuitem');
    
    // Private should be selected
    const privateItem = menuItems[0];
    expect(privateItem).toHaveAttribute('data-active', 'true');
    
    // Public should not be selected
    const publicItem = menuItems[1];
    expect(publicItem).toHaveAttribute('data-active', 'false');
  });

  it('handles visibility selection correctly', async () => {
    const { useChatVisibility } = require('@/hooks/use-chat-visibility');
    const mockSetVisibilityType = jest.fn();
    
    (useChatVisibility as jest.Mock).mockImplementation(({ initialVisibility }) => ({
      visibilityType: initialVisibility,
      setVisibilityType: mockSetVisibilityType,
    }));

    render(<VisibilitySelector chatId={chatId} selectedVisibilityType="private" />);
    
    // Open dropdown
    await user.click(screen.getByRole('button', { name: /private/i }));
    
    // Select public visibility
    const publicItem = screen.getByText('Public').closest('[role="menuitem"]') as HTMLElement;
    await user.click(publicItem);
    
    // Verify setVisibilityType was called
    expect(mockSetVisibilityType).toHaveBeenCalledWith('public');
  });

  it('supports keyboard navigation', async () => {
    render(<VisibilitySelector chatId={chatId} selectedVisibilityType="private" />);
    
    const button = screen.getByRole('button', { name: /private/i });
    
    // Focus button
    await user.tab();
    expect(button).toHaveFocus();
    
    // Open menu with Enter
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    
    // Navigate to Public option
    await user.keyboard('{ArrowDown}');
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems[1]).toHaveAttribute('data-highlighted', '');
  });
}); 