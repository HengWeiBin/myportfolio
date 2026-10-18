import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Archive from '../Archive';
import * as ProfileContext from '../../context/ProfileContext';

vi.mock('../../context/ProfileContext', async () => {
  const actual = await vi.importActual('../../context/ProfileContext');
  return {
    ...actual,
    usePortfolio: vi.fn(),
    useProfile: vi.fn().mockReturnValue({ profile: {}, loading: false }),
  };
});

describe('Archive Page Tier Filtering', () => {
  const mockProjects = [
    { id: 'p1', title: 'Featured Project', tier: 'featured', date_start: '2023-01' },
    { id: 'p2', title: 'Standard Project', tier: 'standard', date_start: '2023-02' },
    { id: 'p3', title: 'Legacy Foundation Project', tier: 'foundation', date_start: '2022-01' },
  ];

  const mockCertificates = [
    { id: 'c1', title: 'Featured Credential', tier: 'featured', category: 'Paper', date: '2024-01' },
    { id: 'c2', title: 'Standard Credential', tier: 'standard', category: 'Certificate', date: '2023-05' },
    { id: 'c3', title: 'Legacy Archived Credential', tier: 'archived', category: 'Competition', date: '2021-01' },
    { id: 'c4', title: 'Explicit Archive Credential', tier: 'archive', category: 'Certificate', date: '2020-01' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    ProfileContext.usePortfolio.mockReturnValue({
      projects: mockProjects,
      certificates: mockCertificates,
      loading: false,
    });
  });

  const renderArchive = () => {
    return render(
      <MemoryRouter>
        <Archive />
      </MemoryRouter>
    );
  };

  it('renders canonical tier filter buttons: All Tiers, Featured, Standard, Archive', () => {
    renderArchive();

    expect(screen.getByRole('button', { name: 'All Tiers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Featured' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Standard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Foundation' })).not.toBeInTheDocument();
  });

  it('displays all 7 items when "All Tiers" is active', () => {
    renderArchive();

    expect(screen.getByText('Featured Project')).toBeInTheDocument();
    expect(screen.getByText('Standard Project')).toBeInTheDocument();
    expect(screen.getByText('Legacy Foundation Project')).toBeInTheDocument();
    expect(screen.getByText('Featured Credential')).toBeInTheDocument();
    expect(screen.getByText('Standard Credential')).toBeInTheDocument();
    expect(screen.getByText('Legacy Archived Credential')).toBeInTheDocument();
    expect(screen.getByText('Explicit Archive Credential')).toBeInTheDocument();
  });

  it('filters items correctly when "Featured" tier is selected', () => {
    renderArchive();

    fireEvent.click(screen.getByRole('button', { name: 'Featured' }));

    expect(screen.getByText('Featured Project')).toBeInTheDocument();
    expect(screen.getByText('Featured Credential')).toBeInTheDocument();
    expect(screen.queryByText('Standard Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy Foundation Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Explicit Archive Credential')).not.toBeInTheDocument();
  });

  it('filters items correctly when "Standard" tier is selected', () => {
    renderArchive();

    fireEvent.click(screen.getByRole('button', { name: 'Standard' }));

    expect(screen.getByText('Standard Project')).toBeInTheDocument();
    expect(screen.getByText('Standard Credential')).toBeInTheDocument();
    expect(screen.queryByText('Featured Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy Foundation Project')).not.toBeInTheDocument();
  });

  it('filters items when "Archive" tier is selected, normalizing legacy foundation and archived items', () => {
    renderArchive();

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

    expect(screen.getByText('Legacy Foundation Project')).toBeInTheDocument();
    expect(screen.getByText('Legacy Archived Credential')).toBeInTheDocument();
    expect(screen.getByText('Explicit Archive Credential')).toBeInTheDocument();
    expect(screen.queryByText('Featured Project')).not.toBeInTheDocument();
    expect(screen.queryByText('Standard Project')).not.toBeInTheDocument();
  });

  it('combines Type and Tier filters correctly', () => {
    renderArchive();

    // Select Projects type and Archive tier
    fireEvent.click(screen.getByRole('button', { name: 'Projects' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

    expect(screen.getByText('Legacy Foundation Project')).toBeInTheDocument();
    expect(screen.queryByText('Legacy Archived Credential')).not.toBeInTheDocument();
    expect(screen.queryByText('Explicit Archive Credential')).not.toBeInTheDocument();
  });
});
