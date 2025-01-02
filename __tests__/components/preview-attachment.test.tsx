import { render, screen } from '@testing-library/react';
import { PreviewAttachment } from '@/components/preview-attachment';
import type { Attachment } from 'ai';

describe('PreviewAttachment', () => {
  // Test data setup
  const mockImageAttachment: Attachment = {
    name: 'test-image.jpg',
    url: 'https://example.com/test.jpg',
    contentType: 'image/jpeg',
  };

  const mockNonImageAttachment: Attachment = {
    name: 'test-file.pdf',
    url: 'https://example.com/test.pdf',
    contentType: 'application/pdf',
  };

  const mockAttachmentNoType: Attachment = {
    name: 'test-unknown',
    url: 'https://example.com/test',
    contentType: '',
  };

  describe('rendering', () => {
    it('renders image attachment correctly', () => {
      render(<PreviewAttachment attachment={mockImageAttachment} />);
      
      // Verify image is rendered
      const img = screen.getByRole('img', { name: 'test-image.jpg' });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/test.jpg');
      
      // Verify filename is displayed
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });

    it('renders non-image attachment correctly', () => {
      render(<PreviewAttachment attachment={mockNonImageAttachment} />);
      
      // Verify no image is rendered
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      
      // Verify filename is displayed
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    it('renders attachment without content type correctly', () => {
      render(<PreviewAttachment attachment={mockAttachmentNoType} />);
      
      // Verify no image is rendered
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      
      // Verify filename is displayed
      expect(screen.getByText('test-unknown')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when isUploading is true', () => {
      const { container } = render(<PreviewAttachment attachment={mockImageAttachment} isUploading={true} />);
      
      // Verify loading spinner is present
      const loadingContainer = container.querySelector('div.animate-spin');
      expect(loadingContainer).toBeInTheDocument();
      
      // Verify loader SVG is present
      const loaderSvg = loadingContainer?.querySelector('svg');
      expect(loaderSvg).toBeInTheDocument();
      expect(loaderSvg).toHaveAttribute('height', '16');
      expect(loaderSvg).toHaveAttribute('width', '16');
    });

    it('does not show loading spinner when isUploading is false', () => {
      const { container } = render(<PreviewAttachment attachment={mockImageAttachment} isUploading={false} />);
      
      // Verify loading spinner is not present
      const loadingContainer = container.querySelector('div.animate-spin');
      expect(loadingContainer).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('provides proper alt text for images', () => {
      render(<PreviewAttachment attachment={mockImageAttachment} />);
      
      // Verify image has proper alt text
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'test-image.jpg');
    });

    it('provides default alt text when image name is missing', () => {
      const attachmentNoName = { ...mockImageAttachment, name: undefined };
      render(<PreviewAttachment attachment={attachmentNoName} />);
      
      // Verify image has default alt text
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'An image attachment');
    });
  });
}); 