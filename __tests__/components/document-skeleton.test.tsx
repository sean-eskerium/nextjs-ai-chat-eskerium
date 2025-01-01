import { render } from '@testing-library/react';
import { DocumentSkeleton } from '../../components/document-skeleton';

describe('DocumentSkeleton', () => {
  it('renders the main skeleton structure', () => {
    const { container } = render(<DocumentSkeleton />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('flex flex-col gap-4 w-full');
    expect(mainDiv.children.length).toBe(7); // Should have 7 skeleton lines
  });
}); 