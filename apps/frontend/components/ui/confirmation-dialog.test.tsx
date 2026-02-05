import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from './confirmation-dialog';
import { describe, it, expect, vi } from 'vitest';

describe('ConfirmationDialog', () => {
  it('renders correctly when open', () => {
    // Radix Dialog renders into a portal, but testing library usually handles it.
    // If not, we might need a custom render or check the body.
    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Are you sure?"
        description="This is visible"
      />
    );
    expect(screen.getByText('Are you sure?')).toBeDefined();
    expect(screen.getByText('This is visible')).toBeDefined();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={handleConfirm}
      />
    );
    
    // Find confirm button. The default label is 'Continue'
    const confirmButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(confirmButton);
    
    expect(handleConfirm).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        loading={true}
      />
    );
    
    expect(screen.getByText('Processing...')).toBeDefined();
    const button = screen.getByRole('button', { name: /processing/i });
    expect(button).toHaveProperty('disabled', true);
  });
});
