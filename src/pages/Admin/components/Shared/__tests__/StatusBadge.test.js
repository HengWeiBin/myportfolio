import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '../StatusBadge';

describe('TierBadge', () => {
  it('renders featured tier with appropriate styling and text', () => {
    render(<TierBadge tier="featured" />);
    const badge = screen.getByText('featured');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-cyan-electric');
  });

  it('renders standard tier with appropriate styling and text', () => {
    render(<TierBadge tier="standard" />);
    const badge = screen.getByText('standard');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-blue-400');
  });

  it('renders archive tier with appropriate styling and text', () => {
    render(<TierBadge tier="archive" />);
    const badge = screen.getByText('archive');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-slate-400');
  });

  it('normalizes legacy foundation tier to archive styling and text', () => {
    render(<TierBadge tier="foundation" />);
    const badge = screen.getByText('archive');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-slate-400');
  });

  it('normalizes legacy archived tier to archive styling and text', () => {
    render(<TierBadge tier="archived" />);
    const badge = screen.getByText('archive');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-slate-400');
  });
});
