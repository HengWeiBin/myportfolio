import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectsTab from '../ProjectsTab';

describe('ProjectsTab', () => {
  const sampleProjects = [
    { id: '1', title: 'Alpha Project', tier: 'standard', sort_order: 0, description: 'Test 1' },
    { id: '2', title: 'Beta Project', tier: 'featured', sort_order: 1, description: 'Test 2' },
  ];

  it('renders projects and prioritizes stagedData over data', () => {
    const staged = [
      { id: '2', title: 'Beta Project Reordered', tier: 'featured', sort_order: 0 },
      { id: '1', title: 'Alpha Project Reordered', tier: 'standard', sort_order: 1 },
    ];

    render(
      <ProjectsTab
        data={sampleProjects}
        stagedData={staged}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const rows = screen.getAllByRole('row');
    // Header row + 2 data rows
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('Beta Project Reordered');
    expect(rows[2]).toHaveTextContent('Alpha Project Reordered');
  });

  it('renders dirty highlight indicator and dot when isItemDirty returns true', () => {
    const isItemDirty = vi.fn((id) => id === '2');

    render(
      <ProjectsTab
        data={sampleProjects}
        isItemDirty={isItemDirty}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const dirtyIndicators = screen.getAllByTestId('dirty-indicator');
    expect(dirtyIndicators).toHaveLength(1);

    const rows = screen.getAllByRole('row');
    // Row 1 is header. Row 2 is project 1 (clean). Row 3 is project 2 (dirty).
    expect(rows[1]).not.toHaveAttribute('data-dirty');
    expect(rows[2]).toHaveAttribute('data-dirty', 'true');
    expect(rows[2].className).toContain('border-l-cyan-electric');
    expect(rows[2].className).toContain('bg-cyan-950/25');
  });

  it('calls onMoveUp with item id when ▲ button is clicked', () => {
    const onMoveUp = vi.fn();

    render(
      <ProjectsTab
        data={sampleProjects}
        onMoveUp={onMoveUp}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const moveUpButtons = screen.getAllByRole('button', { name: '▲' });
    fireEvent.click(moveUpButtons[1]); // Click for item 2

    expect(onMoveUp).toHaveBeenCalledWith('2');
  });

  it('calls onMoveDown with item id when ▼ button is clicked', () => {
    const onMoveDown = vi.fn();

    render(
      <ProjectsTab
        data={sampleProjects}
        onMoveDown={onMoveDown}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const moveDownButtons = screen.getAllByRole('button', { name: '▼' });
    fireEvent.click(moveDownButtons[0]); // Click for item 1

    expect(onMoveDown).toHaveBeenCalledWith('1');
  });

  it('calls onUpdateField with item id, tier, and new value when tier is changed', () => {
    const onUpdateField = vi.fn();

    render(
      <ProjectsTab
        data={sampleProjects}
        onUpdateField={onUpdateField}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Tier for Alpha Project');
    fireEvent.change(select, { target: { value: 'featured' } });

    expect(onUpdateField).toHaveBeenCalledWith('1', 'tier', 'featured');
  });
});
