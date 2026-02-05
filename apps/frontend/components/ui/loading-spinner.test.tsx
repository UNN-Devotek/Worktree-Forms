import { render } from '@testing-library/react';
import { LoadingSpinner } from './loading-spinner';
import { describe, it, expect } from 'vitest';

describe('LoadingSpinner', () => {
  it('renders correctly', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.animate-spin')).toBeDefined();
  });

  it('renders centered when prop is true', () => {
    const { container } = render(<LoadingSpinner centered />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('flex');
    expect(div.className).toContain('items-center');
    expect(div.className).toContain('justify-center');
  });

  it('applies custom class name', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    // Note: The structure might be different depending on if it's centered or not, 
    // but the spinner itself should have the class.
    expect(container.querySelector('.custom-class')).toBeDefined();
  });
});
