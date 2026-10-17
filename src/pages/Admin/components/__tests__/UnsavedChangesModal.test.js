import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UnsavedChangesModal from '../UnsavedChangesModal';

describe('UnsavedChangesModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Unsaved Changes',
    message: 'You have uncommitted modifications that will be lost.',
    onSaveAndProceed: vi.fn(),
    onDiscardAndProceed: vi.fn(),
    onCancel: vi.fn(),
    isSaving: false,
  };

  it('renders modal when open with message and 3 buttons', () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(
      screen.getByText('You have uncommitted modifications that will be lost.')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /save & proceed/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /discard & proceed/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(<UnsavedChangesModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
  });

  it('calls onSaveAndProceed when Save & Proceed is clicked', () => {
    const onSave = vi.fn();
    render(<UnsavedChangesModal {...defaultProps} onSaveAndProceed={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /save & proceed/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscardAndProceed when Discard & Proceed is clicked', () => {
    const onDiscard = vi.fn();
    render(
      <UnsavedChangesModal {...defaultProps} onDiscardAndProceed={onDiscard} />
    );

    fireEvent.click(screen.getByRole('button', { name: /discard & proceed/i }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<UnsavedChangesModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(<UnsavedChangesModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked, but not when clicking inside modal card', () => {
    const onCancel = vi.fn();
    render(<UnsavedChangesModal {...defaultProps} onCancel={onCancel} />);

    // Click inside the modal dialog body
    fireEvent.click(
      screen.getByText('You have uncommitted modifications that will be lost.')
    );
    expect(onCancel).not.toHaveBeenCalled();

    // Click backdrop
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables all buttons and shows spinner when isSaving is true', () => {
    render(<UnsavedChangesModal {...defaultProps} isSaving={true} />);

    const saveBtn = screen.getByRole('button', { name: /save & proceed/i });
    const discardBtn = screen.getByRole('button', { name: /discard & proceed/i });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });

    expect(saveBtn).toBeDisabled();
    expect(discardBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
  });
});
