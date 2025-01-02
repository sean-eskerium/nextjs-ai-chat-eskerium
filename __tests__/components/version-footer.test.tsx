import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VersionFooter } from '@/components/version-footer';
import { useWindowSize } from 'usehooks-ts';
import { useSWRConfig } from 'swr';
import { useBlock } from '@/hooks/use-block';
import type { Document } from '@/lib/db/schema';

// Mock external dependencies
jest.mock('usehooks-ts', () => ({
  useWindowSize: jest.fn(),
}));

jest.mock('swr', () => ({
  useSWRConfig: jest.fn(),
}));

jest.mock('@/hooks/use-block', () => ({
  useBlock: jest.fn(),
}));

// Mock framer-motion to prevent animation-related issues
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('VersionFooter', () => {
  // Setup default props and mocks
  const defaultProps = {
    handleVersionChange: jest.fn(),
    documents: [
      {
        id: '1',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        title: 'Test Document 1',
        content: 'Test content 1',
        kind: 'text' as const,
        userId: 'user-1'
      },
      {
        id: '2',
        createdAt: new Date('2024-01-02T00:00:00Z'),
        title: 'Test Document 2',
        content: 'Test content 2',
        kind: 'text' as const,
        userId: 'user-2'
      },
    ] as Document[],
    currentVersionIndex: 1,
  };

  const mockMutate = jest.fn();
  const mockSetIsMutating = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (useWindowSize as jest.Mock).mockReturnValue({ width: 1024 });
    (useSWRConfig as jest.Mock).mockReturnValue({ mutate: mockMutate });
    (useBlock as jest.Mock).mockReturnValue({
      block: { documentId: 'test-doc-id' },
    });

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('renders with correct content and accessibility', () => {
    render(<VersionFooter {...defaultProps} />);

    // Verify visible content
    expect(screen.getByText('You are viewing a previous version')).toBeInTheDocument();
    expect(screen.getByText('Restore this version to make edits')).toBeInTheDocument();

    // Verify buttons are present with correct accessibility
    expect(screen.getByRole('button', { name: /restore this version/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to latest version/i })).toBeInTheDocument();
  });

  it('handles restore version click correctly', async () => {
    const user = userEvent.setup();
    render(<VersionFooter {...defaultProps} />);

    // Click restore button
    const restoreButton = screen.getByRole('button', { name: /restore this version/i });
    await user.click(restoreButton);

    // Verify fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith(
      '/api/document?id=test-doc-id',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.any(String),
      })
    );

    // Verify mutate was called
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles back to latest version click correctly', async () => {
    const user = userEvent.setup();
    render(<VersionFooter {...defaultProps} />);

    // Click back to latest version button
    const latestButton = screen.getByRole('button', { name: /back to latest version/i });
    await user.click(latestButton);

    // Verify handleVersionChange was called with 'latest'
    expect(defaultProps.handleVersionChange).toHaveBeenCalledWith('latest');
  });

  it('adapts to mobile view', () => {
    // Mock mobile window size
    (useWindowSize as jest.Mock).mockReturnValue({ width: 767 });

    render(<VersionFooter {...defaultProps} />);

    // Verify the component renders in mobile view
    // Note: We're not testing specific styles as they're handled by Tailwind
    // but we can verify the content is still present
    expect(screen.getByText('You are viewing a previous version')).toBeInTheDocument();
  });

  it('handles undefined documents gracefully', () => {
    const { container } = render(
      <VersionFooter
        {...defaultProps}
        documents={undefined}
      />
    );

    // Component should render nothing when documents is undefined
    expect(container).toBeEmptyDOMElement();
  });

  it('shows loading state during mutation', async () => {
    const user = userEvent.setup();
    render(<VersionFooter {...defaultProps} />);

    // Click restore button
    const restoreButton = screen.getByRole('button', { name: /restore this version/i });
    await user.click(restoreButton);

    // Verify loading indicator is shown
    const loadingContainer = screen.getByText('Restore this version').nextElementSibling;
    expect(loadingContainer).toHaveClass('animate-spin');

    // Verify button is disabled during mutation
    expect(restoreButton).toBeDisabled();
  });
}); 