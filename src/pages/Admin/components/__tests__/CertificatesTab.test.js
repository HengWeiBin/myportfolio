import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CertificatesTab from '../CertificatesTab';

describe('CertificatesTab', () => {
  const sampleCertificates = [
    { id: '10', title: 'Deep Learning Specialization', issuer: 'Coursera', date: '2024-01-01', tier: 'standard', sort_order: 0 },
    { id: '20', title: 'AWS Machine Learning', issuer: 'Amazon', date: '2024-02-01', tier: 'featured', sort_order: 1 },
  ];

  it('renders certificates prioritizing stagedData over data', () => {
    const staged = [
      { id: '20', title: 'AWS Machine Learning Reordered', issuer: 'Amazon', date: '2024-02-01', tier: 'featured', sort_order: 0 },
      { id: '10', title: 'Deep Learning Specialization Reordered', issuer: 'Coursera', date: '2024-01-01', tier: 'standard', sort_order: 1 },
    ];

    render(
      <CertificatesTab
        data={sampleCertificates}
        stagedData={staged}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('AWS Machine Learning Reordered');
    expect(rows[2]).toHaveTextContent('Deep Learning Specialization Reordered');
  });

  it('renders dirty indicator dot and styling when isItemDirty returns true', () => {
    const isItemDirty = vi.fn((id) => id === '10');

    render(
      <CertificatesTab
        data={sampleCertificates}
        isItemDirty={isItemDirty}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const dirtyIndicators = screen.getAllByTestId('dirty-indicator');
    expect(dirtyIndicators).toHaveLength(1);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('data-dirty', 'true');
    expect(rows[1].className).toContain('border-l-cyan-electric');
    expect(rows[2]).not.toHaveAttribute('data-dirty');
  });

  it('calls onMoveUp and onMoveDown callbacks with certificate id', () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <CertificatesTab
        data={sampleCertificates}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const moveUpButtons = screen.getAllByRole('button', { name: '▲' });
    fireEvent.click(moveUpButtons[1]);
    expect(onMoveUp).toHaveBeenCalledWith('20');

    const moveDownButtons = screen.getAllByRole('button', { name: '▼' });
    fireEvent.click(moveDownButtons[0]);
    expect(onMoveDown).toHaveBeenCalledWith('10');
  });

  it('calls onUpdateField when changing tier via dropdown', () => {
    const onUpdateField = vi.fn();

    render(
      <CertificatesTab
        data={sampleCertificates}
        onUpdateField={onUpdateField}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Tier for Deep Learning Specialization');
    fireEvent.change(select, { target: { value: 'featured' } });

    expect(onUpdateField).toHaveBeenCalledWith('10', 'tier', 'featured');
  });

  it('renders only 3 canonical tier options (featured, standard, archive) and no foundation', () => {
    render(
      <CertificatesTab
        data={sampleCertificates}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Tier for Deep Learning Specialization');
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toEqual(['featured', 'standard', 'archive']);
    expect(options).not.toContain('foundation');
  });

  it('normalizes legacy foundation tier to archive in select value', () => {
    const legacyCerts = [
      { id: '99', title: 'Legacy Foundation Cert', tier: 'foundation', sort_order: 0 },
    ];

    render(
      <CertificatesTab
        data={legacyCerts}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Tier for Legacy Foundation Cert');
    expect(select.value).toBe('archive');
  });
});
