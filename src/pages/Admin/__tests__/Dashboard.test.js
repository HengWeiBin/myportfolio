import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  addProject: vi.fn(),
  deleteProject: vi.fn(),
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
});
