import { render, screen } from '@testing-library/react';
import { PageHeader } from './page-header';
import { Button } from './button';
import { describe, it, expect } from 'vitest';

describe('PageHeader', () => {
  it('renders title correctly', () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeDefined();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Test Title" description="Test Description" />);
    expect(screen.getByText('Test Description')).toBeDefined();
  });

  it('renders children (actions) when provided', () => {
    render(
      <PageHeader title="Test Title">
        <Button>Action</Button>
      </PageHeader>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeDefined();
  });
});
