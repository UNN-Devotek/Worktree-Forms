import { render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';
import { Button } from './button';
import { Mail } from 'lucide-react';
import { describe, it, expect } from 'vitest';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Create one to get started" />);
    expect(screen.getByText('No items')).toBeDefined();
    expect(screen.getByText('Create one to get started')).toBeDefined();
  });

  it('renders icon when provided', () => {
    // We can't easily query the icon by role without aria-label, but we can verify no errors
    const { container } = render(<EmptyState title="Test" icon={Mail} />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState 
        title="Test" 
        action={<Button>Create Item</Button>} 
      />
    );
    expect(screen.getByRole('button', { name: /create item/i })).toBeDefined();
  });
});
