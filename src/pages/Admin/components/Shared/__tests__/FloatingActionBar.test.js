import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FloatingActionBar from '../FloatingActionBar';

describe('FloatingActionBar', () => {
  it('is hidden when isVisible is false', () => {
    render(
      <FloatingActionBar
        isVisible={false}
        dirtyCount={0}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    );

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-0');
    expect(bar).toHaveClass('invisible');
    expect(bar).toHaveClass('pointer-events-none');
    expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders count, Discard button, and Save Changes button when isVisible is true', () => {
    const { rerender } = render(
      <FloatingActionBar
        isVisible={true}
        dirtyCount={1}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    );

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-100');
    expect(bar).toHaveClass('pointer-events-auto');
    expect(bar).toHaveAttribute('aria-hidden', 'false');

    // Singular form
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    expect(screen.getByText(/\(1 item modified\)/i)).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    // Plural form
    rerender(
      <FloatingActionBar
        isVisible={true}
        dirtyCount={3}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    );
    expect(screen.getByText(/\(3 items modified\)/i)).toBeInTheDocument();
  });

  it('calls onDiscard when Discard button is clicked', () => {
    const onDiscard = vi.fn();
    render(
      <FloatingActionBar
        isVisible={true}
        dirtyCount={2}
        onSave={vi.fn()}
        onDiscard={onDiscard}
      />
    );

    const discardBtn = screen.getByRole('button', { name: /discard/i });
    fireEvent.click(discardBtn);

    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when Save Changes button is clicked', () => {
    const onSave = vi.fn();
    render(
      <FloatingActionBar
        isVisible={true}
        dirtyCount={2}
        onSave={onSave}
        onDiscard={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('handles loading state on Save button and disables buttons when isSaving is true', () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();

    render(
      <FloatingActionBar
        isVisible={true}
        dirtyCount={2}
        onSave={onSave}
        onDiscard={onDiscard}
        isSaving={true}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    const discardBtn = screen.getByRole('button', { name: /discard/i });

    expect(saveBtn).toBeDisabled();
    expect(discardBtn).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    fireEvent.click(saveBtn);
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(discardBtn);
    expect(onDiscard).not.toHaveBeenCalled();
  });
});
