import { render, screen } from '@testing-library/react';
import { Select, SelectTrigger } from '../../../components/ui/select';

describe('SelectTrigger', () => {
  it('renders with default styles', () => {
    render(
      <Select>
        <SelectTrigger data-testid="test-trigger">Select</SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByTestId('test-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('flex h-10 w-full items-center justify-between rounded-md border');
  });

  it('merges custom className with default styles', () => {
    render(
      <Select>
        <SelectTrigger data-testid="test-trigger" className="custom-class">Select</SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByTestId('test-trigger');
    expect(trigger).toHaveClass('custom-class');
    expect(trigger).toHaveClass('flex h-10 w-full items-center justify-between rounded-md border');
  });
}); 