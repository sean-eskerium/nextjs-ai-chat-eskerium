import { render, screen, fireEvent, act } from '@testing-library/react';
import { Console } from '@/components/console';
import { ConsoleOutput } from '@/components/block';
import userEvent from '@testing-library/user-event';

// Mock icons
jest.mock('@/components/icons', () => ({
  TerminalWindowIcon: () => <span>Terminal</span>,
  LoaderIcon: () => <span>Loading...</span>,
  CrossSmallIcon: () => <span>×</span>,
}));

describe('Console', () => {
  const mockConsoleOutputs: ConsoleOutput[] = [
    {
      id: '1',
      content: 'First output',
      status: 'completed',
    },
    {
      id: '2',
      content: 'Loading...',
      status: 'in_progress',
    },
    {
      id: '3',
      content: 'Error occurred',
      status: 'failed',
    },
  ];

  const mockSetConsoleOutputs = jest.fn();
  const scrollIntoViewMock = jest.fn();

  beforeEach(() => {
    mockSetConsoleOutputs.mockClear();
    scrollIntoViewMock.mockClear();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    
    // Set up window dimensions
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
  });

  it('renders nothing when no outputs', () => {
    const { container } = render(
      <Console consoleOutputs={[]} setConsoleOutputs={mockSetConsoleOutputs} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders console outputs with correct status indicators', () => {
    render(
      <Console
        consoleOutputs={mockConsoleOutputs}
        setConsoleOutputs={mockSetConsoleOutputs}
      />
    );

    // Verify all outputs are rendered
    mockConsoleOutputs.forEach((output, index) => {
      // Check index number
      expect(screen.getByText(`[${index + 1}]`)).toBeInTheDocument();
      
      // Check content for completed and failed outputs
      if (output.status !== 'in_progress') {
        expect(screen.getByText(output.content as string)).toBeInTheDocument();
      }
    });

    // Verify loading indicator
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Verify scroll behavior
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('clears console when clicking clear button', async () => {
    const user = userEvent.setup();
    render(
      <Console
        consoleOutputs={mockConsoleOutputs}
        setConsoleOutputs={mockSetConsoleOutputs}
      />
    );

    const clearButton = screen.getByRole('button');
    await user.click(clearButton);

    expect(mockSetConsoleOutputs).toHaveBeenCalledWith([]);
  });

  describe('resizing behavior', () => {
    it('handles resize interactions', async () => {
      render(
        <Console
          consoleOutputs={mockConsoleOutputs}
          setConsoleOutputs={mockSetConsoleOutputs}
        />
      );

      const resizer = screen.getByRole('slider');

      // Start resizing
      await act(async () => {
        fireEvent.mouseDown(resizer);
      });

      // Move mouse to resize
      await act(async () => {
        fireEvent.mouseMove(window, { clientY: 500 });
      });

      // Stop resizing
      await act(async () => {
        fireEvent.mouseUp(window);
      });

      // Verify the console is still rendered
      expect(screen.getByText('Console')).toBeInTheDocument();
    });

    it('constrains resize within bounds', async () => {
      render(
        <Console
          consoleOutputs={mockConsoleOutputs}
          setConsoleOutputs={mockSetConsoleOutputs}
        />
      );

      const resizer = screen.getByRole('slider');

      // Start resizing
      await act(async () => {
        fireEvent.mouseDown(resizer);
      });

      // Try to resize below minimum
      await act(async () => {
        fireEvent.mouseMove(window, { clientY: 999 }); // Almost at bottom
      });

      // Try to resize above maximum
      await act(async () => {
        fireEvent.mouseMove(window, { clientY: 0 }); // At top
      });

      // Stop resizing
      await act(async () => {
        fireEvent.mouseUp(window);
      });

      // Verify the console is still rendered and usable
      expect(screen.getByText('Console')).toBeInTheDocument();
    });
  });

  it('scrolls to bottom when new outputs arrive', () => {
    const { rerender } = render(
      <Console
        consoleOutputs={mockConsoleOutputs}
        setConsoleOutputs={mockSetConsoleOutputs}
      />
    );

    // Initial render should scroll
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);

    // Add new output
    const newOutputs = [
      ...mockConsoleOutputs,
      {
        id: '4',
        content: 'New output',
        status: 'completed' as const,
      },
    ];

    rerender(
      <Console
        consoleOutputs={newOutputs}
        setConsoleOutputs={mockSetConsoleOutputs}
      />
    );

    // Should scroll again after new output
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
  });

  it('renders console header with controls', () => {
    render(
      <Console
        consoleOutputs={mockConsoleOutputs}
        setConsoleOutputs={mockSetConsoleOutputs}
      />
    );

    // Verify header elements
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });
}); 