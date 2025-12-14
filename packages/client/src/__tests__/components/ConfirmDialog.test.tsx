import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

describe('ConfirmDialog', () => {
  it('renders when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm Action"
        description="Are you sure?"
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Confirm Action"
        description="Are you sure?"
        onConfirm={() => {}}
      />
    );

    expect(screen.queryByText('Confirm Action')).toBeNull();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm Action"
        description="Are you sure?"
        onConfirm={handleConfirm}
        confirmLabel="Yes, do it"
      />
    );

    fireEvent.click(screen.getByText('Yes, do it'));
    await waitFor(() => expect(handleConfirm).toHaveBeenCalledTimes(1));
  });

  it('calls onOpenChange with false when cancel is clicked', () => {
    const handleOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={handleOpenChange}
        title="Confirm Action"
        description="Are you sure?"
        onConfirm={() => {}}
        cancelLabel="No, cancel"
      />
    );

    fireEvent.click(screen.getByText('No, cancel'));
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm Action"
        description="Are you sure?"
        onConfirm={() => {}}
        isLoading={true}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    );

    // When loading, the confirm button shows "Loading..." text
    expect(screen.getByText('Loading...')).toBeTruthy();

    // Cancel button should be disabled
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveProperty('disabled', true);

    // Loading button should be disabled
    const loadingButton = screen.getByText('Loading...');
    expect(loadingButton).toHaveProperty('disabled', true);
  });

  it('applies danger variant styling (destructive)', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Item"
        description="This cannot be undone."
        onConfirm={() => {}}
        variant="danger"
        confirmLabel="Delete"
      />
    );

    const deleteButton = screen.getByText('Delete');
    // The danger variant uses "destructive" button variant which has bg-destructive class
    expect(deleteButton.className).toContain('bg-destructive');
  });
});
