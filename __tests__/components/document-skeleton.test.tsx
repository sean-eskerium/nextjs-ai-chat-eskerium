import { render } from '@testing-library/react';
import { DocumentSkeleton, InlineDocumentSkeleton } from '@/components/document-skeleton';

describe('DocumentSkeleton', () => {
  describe('DocumentSkeleton (Full)', () => {
    it('renders with correct structure and styling', () => {
      const { container } = render(<DocumentSkeleton />);

      // Get container
      const skeletonContainer = container.firstChild as HTMLElement;
      expect(skeletonContainer).toHaveClass('flex flex-col gap-4 w-full');

      // Get all skeleton bars
      const skeletonBars = skeletonContainer.querySelectorAll('div[class*="animate-pulse"]');
      expect(skeletonBars).toHaveLength(7);

      // Verify specific bars
      const [
        titleBar,
        firstLine,
        secondLine,
        thirdLine,
        spacer,
        button,
        lastLine
      ] = Array.from(skeletonBars);

      // Title bar
      expect(titleBar).toHaveClass('h-12 w-1/2');

      // Content lines
      expect(firstLine).toHaveClass('h-5 w-full');
      expect(secondLine).toHaveClass('h-5 w-full');
      expect(thirdLine).toHaveClass('h-5 w-1/3');

      // Spacer
      expect(spacer).toHaveClass('h-5 bg-transparent w-52');

      // Button placeholder
      expect(button).toHaveClass('h-8 w-52');

      // Last line
      expect(lastLine).toHaveClass('h-5 w-2/3');

      // Common classes
      skeletonBars.forEach(bar => {
        expect(bar).toHaveClass('animate-pulse rounded-lg');
        if (bar !== spacer) {
          expect(bar).toHaveClass('bg-muted-foreground/20');
        }
      });
    });
  });

  describe('InlineDocumentSkeleton', () => {
    it('renders with correct structure and styling', () => {
      const { container } = render(<InlineDocumentSkeleton />);

      // Get container
      const skeletonContainer = container.firstChild as HTMLElement;
      expect(skeletonContainer).toHaveClass('flex flex-col gap-4 w-full');

      // Get all skeleton bars
      const skeletonBars = skeletonContainer.querySelectorAll('div[class*="animate-pulse"]');
      expect(skeletonBars).toHaveLength(7);

      // Verify specific bars
      const [
        firstLine,
        secondLine,
        thirdLine,
        fourthLine,
        fifthLine,
        sixthLine,
        seventhLine
      ] = Array.from(skeletonBars);

      // Verify line widths
      expect(firstLine).toHaveClass('w-48');
      expect(secondLine).toHaveClass('w-3/4');
      expect(thirdLine).toHaveClass('w-1/2');
      expect(fourthLine).toHaveClass('w-64');
      expect(fifthLine).toHaveClass('w-40');
      expect(sixthLine).toHaveClass('w-36');
      expect(seventhLine).toHaveClass('w-64');

      // Common classes and height
      skeletonBars.forEach(bar => {
        expect(bar).toHaveClass('animate-pulse rounded-lg h-4 bg-muted-foreground/20');
      });
    });
  });
}); 