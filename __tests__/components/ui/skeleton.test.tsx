import { render } from '@testing-library/react';
import { Skeleton } from '../../../components/ui/skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('animate-pulse');
    expect(skeleton.className).toContain('rounded-md');
    expect(skeleton.className).toContain('bg-muted');
  });

  it('accepts and applies additional className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('custom-class');
  });
}); 