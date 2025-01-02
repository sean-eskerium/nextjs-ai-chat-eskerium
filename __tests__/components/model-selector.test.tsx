import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelector } from '@/components/model-selector';
import { models } from '@/lib/ai/models';
import { saveModelId } from '@/app/(chat)/actions';

// Mock the saveModelId action
jest.mock('@/app/(chat)/actions', () => ({
  saveModelId: jest.fn(),
}));

// Mock Radix UI components
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <div role="menuitem" onClick={onSelect}>{children}</div>
  ),
}));

describe('ModelSelector', () => {
  const defaultProps = {
    selectedModelId: models[0].id,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with selected model', () => {
    render(<ModelSelector {...defaultProps} />);
    
    // Check that the button shows the selected model's label
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(models[0].label);
  });

  it('shows model descriptions when available', () => {
    render(<ModelSelector {...defaultProps} />);
    
    // Check for model descriptions
    models.forEach((model) => {
      if (model.description) {
        expect(screen.getByText(model.description)).toBeInTheDocument();
      }
    });
  });

  it('handles model selection', () => {
    render(<ModelSelector {...defaultProps} />);
    
    // Select a different model
    const newModel = models[1];
    const menuItem = screen.getByText(newModel.label).closest('[role="menuitem"]');
    fireEvent.click(menuItem!);
    
    // Check that saveModelId was called
    expect(saveModelId).toHaveBeenCalledWith(newModel.id);
  });
}); 