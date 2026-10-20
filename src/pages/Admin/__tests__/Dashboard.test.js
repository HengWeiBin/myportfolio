import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { toast } from 'react-toastify';
import Dashboard from '../Dashboard';
import * as api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  getProjects: vi.fn(),
  getCertificates: vi.fn(),
  getExperience: vi.fn(),
  getSkills: vi.fn(),
  getProfile: vi.fn(),
  updateProject: vi.fn(),
  updateCertificate: vi.fn(),
  updateExperience: vi.fn(),
  updateSkill: vi.fn(),
  updateProfile: vi.fn(),
  addProject: vi.fn(),
  addCertificate: vi.fn(),
  addExperience: vi.fn(),
  addSkill: vi.fn(),
  deleteProject: vi.fn(),
  deleteCertificate: vi.fn(),
  deleteExperience: vi.fn(),
  deleteSkill: vi.fn(),
}));

vi.mock('../../../services/upload', () => ({
  uploadImageToR2: vi.fn(),
  deleteImageFromR2: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Dashboard Batch Save & Staging Integration', () => {
  const mockProjects = [
    { id: '1', title: 'Radar Fusion', tier: 'standard', sort_order: 0 },
    { id: '2', title: 'LiDAR Odometry', tier: 'featured', sort_order: 1 },
    { id: '3', title: 'Vision Tracker', tier: 'foundation', sort_order: 2 },
  ];

  const mockCerts = [
    { id: 'c1', title: 'AWS ML Specialty', tier: 'standard', sort_order: 0 },
    { id: 'c2', title: 'TensorFlow Developer', tier: 'foundation', sort_order: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.getProjects.mockResolvedValue([...mockProjects]);
    api.getCertificates.mockResolvedValue([...mockCerts]);
    api.getExperience.mockResolvedValue([]);
    api.getSkills.mockResolvedValue([]);
    api.getProfile.mockResolvedValue({});
    api.updateProject.mockResolvedValue({ success: true });
    api.updateCertificate.mockResolvedValue({ success: true });
    api.updateExperience.mockResolvedValue({ success: true });
  });

  it('initially hides the floating action bar when dataset is pristine', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
    });

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-0', 'invisible');
    expect(screen.queryAllByTestId('dirty-indicator')).toHaveLength(0);
  });

  it('shows floating action bar and row dirty indicators upon reordering items', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
    });

    // Move first item down
    const moveDownButtons = screen.getAllByRole('button', { name: '▼' });
    fireEvent.click(moveDownButtons[0]);

    // Bar becomes visible with dirty count
    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-100', 'pointer-events-auto');
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    expect(screen.getByText(/\(2 items modified\)/i)).toBeInTheDocument();

    // Dirty row indicators appear for the 2 swapped items
    const dirtyIndicators = screen.getAllByTestId('dirty-indicator');
    expect(dirtyIndicators).toHaveLength(2);
  });

  it('reverts modifications and hides floating action bar when Discard is clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
    });

    // Move item down
    const moveDownButtons = screen.getAllByRole('button', { name: '▼' });
    fireEvent.click(moveDownButtons[0]);

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-100');

    // Click Discard
    const discardBtn = screen.getByRole('button', { name: /discard/i });
    fireEvent.click(discardBtn);

    // Bar hides and dirty indicators disappear
    expect(bar).toHaveClass('opacity-0', 'invisible');
    expect(screen.queryAllByTestId('dirty-indicator')).toHaveLength(0);
    expect(api.updateProject).not.toHaveBeenCalled();
  });

  it('submits diff-only parallel updates for single modified item, clears dirty state, and shows success toast', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
    });

    // Change tier on first item only
    const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
    fireEvent.change(tierSelect, { target: { value: 'featured' } });

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-100');
    expect(screen.getByText(/\(1 item modified\)/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('dirty-indicator')).toHaveLength(1);

    // Initial getProjects call count
    const initialGetCallCount = api.getProjects.mock.calls.length;

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateProject).toHaveBeenCalledTimes(1);
    });

    // Verify only the modified item was sent to updateProject
    expect(api.updateProject).toHaveBeenCalledWith('1', expect.objectContaining({
      id: '1',
      title: 'Radar Fusion',
      tier: 'featured',
    }));

    // Verify success toast was displayed
    expect(toast.success).toHaveBeenCalledWith('Changes saved successfully');

    // Bar and dirty indicators hide without full-page re-fetch
    await waitFor(() => {
      expect(bar).toHaveClass('opacity-0', 'invisible');
      expect(screen.queryAllByTestId('dirty-indicator')).toHaveLength(0);
    });
    expect(api.getProjects.mock.calls.length).toBe(initialGetCallCount);
  });

  it('submits parallel updates for multiple dirty items when reordered', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
    });

    // Swap item 1 and item 2
    const moveDownButtons = screen.getAllByRole('button', { name: '▼' });
    fireEvent.click(moveDownButtons[0]);

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-100');
    expect(screen.getByText(/\(2 items modified\)/i)).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateProject).toHaveBeenCalledTimes(2);
    });

    expect(api.updateProject).toHaveBeenCalledWith('1', expect.objectContaining({ id: '1', sort_order: 1 }));
    expect(api.updateProject).toHaveBeenCalledWith('2', expect.objectContaining({ id: '2', sort_order: 0 }));

    await waitFor(() => {
      expect(bar).toHaveClass('opacity-0', 'invisible');
    });
  });

  it('preserves dirty state and displays error toast if batch update fails', async () => {
    api.updateProject.mockRejectedValueOnce(new Error('Database network timeout'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
    });

    // Modify item
    const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
    fireEvent.change(tierSelect, { target: { value: 'featured' } });

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-100');

    // Attempt save
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save changes: Database network timeout');
    });

    // Dirty state and floating action bar must remain active so user can retry
    expect(bar).toHaveClass('opacity-100');
    expect(screen.getAllByTestId('dirty-indicator')).toHaveLength(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('correctly persists dirty items when certificates tab is active', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
    });

    // Switch to Certificates tab
    const certsTabButton = screen.getByRole('button', { name: /certificates/i });
    fireEvent.click(certsTabButton);

    await waitFor(() => {
      expect(screen.getByText('AWS ML Specialty')).toBeInTheDocument();
    });

    // Move first certificate down
    const moveDownButtons = screen.getAllByRole('button', { name: '▼' });
    fireEvent.click(moveDownButtons[0]);

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-100');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateCertificate).toHaveBeenCalledTimes(2);
    });

    expect(api.updateCertificate).toHaveBeenCalledWith('c1', expect.objectContaining({ id: 'c1', sort_order: 1 }));
    expect(api.updateCertificate).toHaveBeenCalledWith('c2', expect.objectContaining({ id: 'c2', sort_order: 0 }));
    expect(toast.success).toHaveBeenCalledWith('Changes saved successfully');

    await waitFor(() => {
      expect(bar).toHaveClass('opacity-0', 'invisible');
    });
  });

  describe('Safety & Navigation Guards', () => {
    it('intercepts tab switching when dirty and aborts transition if Cancel is chosen', async () => {
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
      });

      // Modify item
      const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
      fireEvent.change(tierSelect, { target: { value: 'featured' } });

      // Click Certificates tab
      const certsTabButton = screen.getByRole('button', { name: /certificates/i });
      fireEvent.click(certsTabButton);

      // Unsaved changes modal should appear
      const guardModal = screen.getByTestId('unsaved-changes-modal');
      expect(guardModal).toBeInTheDocument();

      // Click Cancel
      const cancelBtn = within(guardModal).getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      // Dialog should close, and user remains on Projects tab with dirty indicators still present
      await waitFor(() => {
        expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
      expect(screen.getAllByTestId('dirty-indicator')).toHaveLength(1);
    });

    it('intercepts tab switching when dirty and switches tab after Discard & Proceed', async () => {
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
      });

      // Modify item
      const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
      fireEvent.change(tierSelect, { target: { value: 'featured' } });

      // Click Certificates tab
      const certsTabButton = screen.getByRole('button', { name: /certificates/i });
      fireEvent.click(certsTabButton);

      // Modal appears
      const guardModal = screen.getByTestId('unsaved-changes-modal');
      expect(guardModal).toBeInTheDocument();

      // Click Discard & Proceed
      const discardProceedBtn = within(guardModal).getByRole('button', { name: /discard & proceed/i });
      fireEvent.click(discardProceedBtn);

      // Transitions to Certificates tab
      await waitFor(() => {
        expect(screen.getByText('AWS ML Specialty')).toBeInTheDocument();
      });
      expect(api.updateProject).not.toHaveBeenCalled();
    });

    it('intercepts tab switching when dirty and saves changes before switching on Save & Proceed', async () => {
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
      });

      // Modify item
      const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
      fireEvent.change(tierSelect, { target: { value: 'featured' } });

      // Click Certificates tab
      const certsTabButton = screen.getByRole('button', { name: /certificates/i });
      fireEvent.click(certsTabButton);

      // Modal appears
      const guardModal = screen.getByTestId('unsaved-changes-modal');
      expect(guardModal).toBeInTheDocument();

      // Click Save & Proceed
      const saveProceedBtn = within(guardModal).getByRole('button', { name: /save & proceed/i });
      fireEvent.click(saveProceedBtn);

      await waitFor(() => {
        expect(api.updateProject).toHaveBeenCalledTimes(1);
        expect(screen.getByText('AWS ML Specialty')).toBeInTheDocument();
      });
      expect(toast.success).toHaveBeenCalledWith('Changes saved successfully');
    });

    it('attaches window beforeunload event listener when dirty and removes it when discarded', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
      });

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

      // Make dirty
      const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
      fireEvent.change(tierSelect, { target: { value: 'featured' } });

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

      // Dispatch beforeunload event to verify preventDefault is invoked
      const event = new Event('beforeunload', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();

      // Click Discard on floating action bar
      const discardBtn = screen.getByRole('button', { name: /discard/i });
      fireEvent.click(discardBtn);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('intercepts + New Entry, Edit, and Delete actions when dirty', async () => {
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
      });

      // Make dirty
      const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
      fireEvent.change(tierSelect, { target: { value: 'featured' } });

      // 1. Click "+ New Entry"
      const addBtn = screen.getByRole('button', { name: /\+ new entry/i });
      fireEvent.click(addBtn);

      let guardModal = screen.getByTestId('unsaved-changes-modal');
      expect(guardModal).toBeInTheDocument();

      // Cancel keeps user on table
      fireEvent.click(within(guardModal).getByRole('button', { name: /cancel/i }));
      await waitFor(() => {
        expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
      });

      // 2. Click "Edit"
      const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
      fireEvent.click(editButtons[0]);

      guardModal = screen.getByTestId('unsaved-changes-modal');
      expect(guardModal).toBeInTheDocument();

      // Click Discard & Proceed -> opens Edit modal with pristine baseline data
      fireEvent.click(within(guardModal).getByRole('button', { name: /discard & proceed/i }));
      await waitFor(() => {
        expect(screen.getByText(/edit projects/i)).toBeInTheDocument();
      });
      const editModal = screen.getByText(/edit projects/i).closest('.fixed');
      expect(within(editModal).getByDisplayValue('Standard')).toBeInTheDocument();

      // Close modal
      const closeBtn = within(editModal).getByRole('button', { name: /cancel/i });
      fireEvent.click(closeBtn);

      // 3. Make dirty again and click Delete
      const moveDownButtons = screen.getAllByRole('button', { name: '▼' });
      fireEvent.click(moveDownButtons[0]);

      const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
      fireEvent.click(deleteButtons[0]);

      guardModal = screen.getByTestId('unsaved-changes-modal');
      expect(guardModal).toBeInTheDocument();

      // Discard & Proceed -> opens ConfirmModal for Delete
      fireEvent.click(within(guardModal).getByRole('button', { name: /discard & proceed/i }));
      await waitFor(() => {
        expect(screen.getByText(/delete item/i)).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete this item\?/i)).toBeInTheDocument();
      });
    });

    it('invokes refreshPortfolio callback when batch save succeeds', async () => {
      const refreshPortfolio = vi.fn();
      render(<Dashboard refreshPortfolio={refreshPortfolio} />);

      await waitFor(() => {
        expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
      });

      const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
      fireEvent.change(tierSelect, { target: { value: 'featured' } });

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(refreshPortfolio).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Modal Editing & ID Preservation', () => {
    it('opens project edit modal, updates visual_type, preserves id and calls api.updateProject', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
      });

      // Click Edit for the first project
      const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
      fireEvent.click(editButtons[0]);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText(/edit projects/i)).toBeInTheDocument();
      });

      const modal = screen.getByText(/edit projects/i).closest('.fixed');
      expect(modal).toBeInTheDocument();

      // Change Visual Type to NeuralArch
      const visualTypeSelect = screen.getByLabelText(/visual type/i);
      fireEvent.change(visualTypeSelect, { target: { value: 'NeuralArch' } });

      // Submit form in modal
      const form = modal.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(api.updateProject).toHaveBeenCalledTimes(1);
      });

      expect(api.updateProject).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          id: '1',
          visual_type: 'NeuralArch',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Updated successfully');
    });
  });
});
