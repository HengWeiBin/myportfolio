import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Certificates from '../Certificates';
import * as ProfileContext from '../../../context/ProfileContext';

vi.mock('../../../context/ProfileContext', async () => {
  const actual = await vi.importActual('../../../context/ProfileContext');
  return {
    ...actual,
    usePortfolio: vi.fn(),
  };
});

describe('Homepage Certificates Section (Issue #21)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('excludes certificates whose normalized tier is archive (archive, foundation, archived)', () => {
    ProfileContext.usePortfolio.mockReturnValue({
      certificates: [
        { id: 'c1', title: 'Standard AWS Cert', category: 'Certificate', tier: 'standard' },
        { id: 'c2', title: 'Archived Legacy 1', category: 'Certificate', tier: 'archive' },
        { id: 'c3', title: 'Archived Legacy 2', category: 'Paper', tier: 'foundation' },
        { id: 'c4', title: 'Archived Legacy 3', category: 'Competition', tier: 'archived' },
      ],
      loading: false,
    });

    render(<Certificates />);

    expect(screen.getByText('Standard AWS Cert')).toBeInTheDocument();
    expect(screen.queryByText('Archived Legacy 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Archived Legacy 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Archived Legacy 3')).not.toBeInTheDocument();
  });

  it('prioritizes featured certificates first, then standard certificates, preserving category sorting within tiers', () => {
    ProfileContext.usePortfolio.mockReturnValue({
      certificates: [
        // Standard items
        { id: 's1', title: 'Standard Paper', category: 'Paper', tier: 'standard' },
        { id: 's2', title: 'Standard Certificate', category: 'Certificate', tier: 'standard' },
        // Featured items
        { id: 'f1', title: 'Featured Certificate', category: 'Certificate', tier: 'featured' },
        { id: 'f2', title: 'Featured Paper', category: 'Paper', tier: 'featured' },
        { id: 'f3', title: 'Featured Competition', category: 'Competition', tier: 'featured' },
        // Archive item (should be excluded)
        { id: 'a1', title: 'Archived Paper', category: 'Paper', tier: 'archive' },
      ],
      loading: false,
    });

    const { container } = render(<Certificates />);

    // Query card titles in DOM render order
    const cardTitles = Array.from(container.querySelectorAll('h3')).map(h3 => h3.textContent);

    expect(cardTitles).toEqual([
      // Featured tier (Paper > Competition > Certificate)
      'Featured Paper',
      'Featured Competition',
      'Featured Certificate',
      // Standard tier (Paper > Certificate)
      'Standard Paper',
      'Standard Certificate',
    ]);
    expect(screen.queryByText('Archived Paper')).not.toBeInTheDocument();
  });

  it('sorts solely by category weight (Paper > Competition > Certificate) when no featured certificates exist', () => {
    ProfileContext.usePortfolio.mockReturnValue({
      certificates: [
        { id: 's1', title: 'Regular Cert', category: 'Certificate', tier: 'standard' },
        { id: 's2', title: 'Regular Paper', category: 'Paper', tier: 'standard' },
        { id: 's3', title: 'Regular Award', category: 'Competition', tier: 'standard' },
        { id: 'a1', title: 'Old Project', category: 'Paper', tier: 'foundation' },
      ],
      loading: false,
    });

    const { container } = render(<Certificates />);

    const cardTitles = Array.from(container.querySelectorAll('h3')).map(h3 => h3.textContent);

    expect(cardTitles).toEqual([
      'Regular Paper',
      'Regular Award',
      'Regular Cert',
    ]);
    expect(screen.queryByText('Old Project')).not.toBeInTheDocument();
  });
});
