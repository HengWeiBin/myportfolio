import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  beforeEach(() => {
    vi.clearAllMocks();
    api.getProjects.mockResolvedValue([...mockProjects]);
    api.getCertificates.mockResolvedValue([]);
    api.getExperience.mockResolvedValue([]);
    api.getSkills.mockResolvedValue([]);
    api.getProfile.mockResolvedValue({});
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
  });

  it('commits changes and hides floating action bar when Save Changes is clicked', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Radar Fusion')).toBeInTheDocument();
    });

    // Change tier on first item
    const tierSelect = screen.getByLabelText('Tier for Radar Fusion');
    fireEvent.change(tierSelect, { target: { value: 'featured' } });

    const bar = screen.getByTestId('floating-action-bar');
    expect(bar).toHaveClass('opacity-100');
    expect(screen.getByText(/\(1 item modified\)/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('dirty-indicator')).toHaveLength(1);

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(bar).toHaveClass('opacity-0', 'invisible');
      expect(screen.queryAllByTestId('dirty-indicator')).toHaveLength(0);
    });
  });
});
