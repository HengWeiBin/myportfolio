import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExperienceTab from '../ExperienceTab';

describe('ExperienceTab', () => {
  const sampleExperience = [
    { id: 'e1', role: 'Staff ML Engineer', company: 'Tech Corp', sort_order: 0, date_range: '2023 - Present' },
    { id: 'e2', role: 'Senior Research Scientist', company: 'AI Lab', sort_order: 1, date_range: '2021 - 2023' },
  ];

  it('renders experience entries and prioritizes stagedData over data', () => {
    const staged = [
      { id: 'e2', role: 'Senior Research Scientist Reordered', company: 'AI Lab', sort_order: 0 },
      { id: 'e1', role: 'Staff ML Engineer Reordered', company: 'Tech Corp', sort_order: 1 },
    ];

    render(
      <ExperienceTab
        data={sampleExperience}
        stagedData={staged}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('Senior Research Scientist Reordered');
    expect(rows[2]).toHaveTextContent('Staff ML Engineer Reordered');
  });

  it('renders dirty indicator and styles when isItemDirty returns true', () => {
    const isItemDirty = vi.fn((id) => id === 'e1');

    render(
      <ExperienceTab
        data={sampleExperience}
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
    expect(rows[2]).not.toHaveAttribute('data-dirty');
  });

  it('calls onMoveUp and onMoveDown callbacks with item id', () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <ExperienceTab
        data={sampleExperience}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const moveUpButtons = screen.getAllByRole('button', { name: '▲' });
    fireEvent.click(moveUpButtons[1]);
    expect(onMoveUp).toHaveBeenCalledWith('e2');

    const moveDownButtons = screen.getAllByRole('button', { name: '▼' });
    fireEvent.click(moveDownButtons[0]);
    expect(onMoveDown).toHaveBeenCalledWith('e1');
  });
});
