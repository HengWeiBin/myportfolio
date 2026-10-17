import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStagedList } from '../useStagedList';

describe('useStagedList', () => {
  const sampleData = [
    { id: '1', title: 'Alpha Project', tier: 'standard', sort_order: 0 },
    { id: '2', title: 'Beta Project', tier: 'featured', sort_order: 1 },
    { id: '3', title: 'Gamma Project', tier: 'foundation', sort_order: 2 },
  ];

  it('initializes with default empty array when no data provided', () => {
    const { result } = renderHook(() => useStagedList());

    expect(result.current.stagedData).toEqual([]);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.dirtyItems).toEqual([]);
    expect(result.current.isItemDirty('1')).toBe(false);
  });

  it('initializes and sorts initialData by sort_order', () => {
    const unarrangedData = [
      { id: '3', title: 'Gamma', sort_order: 2 },
      { id: '1', title: 'Alpha', sort_order: 0 },
      { id: '2', title: 'Beta', sort_order: 1 },
    ];

    const { result } = renderHook(() => useStagedList(unarrangedData));

    expect(result.current.stagedData.map((item) => item.id)).toEqual(['1', '2', '3']);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });

  it('swaps item with preceding neighbor on moveUp and normalizes indices', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.moveUp('2');
    });

    // Item 2 moved up to index 0, item 1 moved to index 1
    expect(result.current.stagedData[0].id).toBe('2');
    expect(result.current.stagedData[0].sort_order).toBe(0);

    expect(result.current.stagedData[1].id).toBe('1');
    expect(result.current.stagedData[1].sort_order).toBe(1);

    expect(result.current.stagedData[2].id).toBe('3');
    expect(result.current.stagedData[2].sort_order).toBe(2);

    // Items 1 and 2 are dirty; item 3 is untouched
    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(2);
    expect(result.current.isItemDirty('2')).toBe(true);
    expect(result.current.isItemDirty('1')).toBe(true);
    expect(result.current.isItemDirty('3')).toBe(false);
  });

  it('swaps item with succeeding neighbor on moveDown and normalizes indices', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.moveDown('1');
    });

    // Item 1 moved down to index 1, item 2 moved to index 0
    expect(result.current.stagedData[0].id).toBe('2');
    expect(result.current.stagedData[0].sort_order).toBe(0);

    expect(result.current.stagedData[1].id).toBe('1');
    expect(result.current.stagedData[1].sort_order).toBe(1);

    expect(result.current.stagedData[2].id).toBe('3');
    expect(result.current.stagedData[2].sort_order).toBe(2);

    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(2);
  });

  it('normalizes arbitrary non-sequential sort orders to contiguous 0, 1, 2, ...', () => {
    const arbitraryOrderData = [
      { id: '10', title: 'Ten', sort_order: 10 },
      { id: '20', title: 'Twenty', sort_order: 25 },
      { id: '30', title: 'Thirty', sort_order: 50 },
    ];

    const { result } = renderHook(() => useStagedList(arbitraryOrderData));

    act(() => {
      result.current.moveUp('20');
    });

    expect(result.current.stagedData.map((item) => ({ id: item.id, sort_order: item.sort_order }))).toEqual([
      { id: '20', sort_order: 0 },
      { id: '10', sort_order: 1 },
      { id: '30', sort_order: 2 },
    ]);
  });

  it('handles boundary conditions: top item moveUp does nothing', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.moveUp('1');
    });

    expect(result.current.stagedData.map((item) => item.id)).toEqual(['1', '2', '3']);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });

  it('handles boundary conditions: bottom item moveDown does nothing', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.moveDown('3');
    });

    expect(result.current.stagedData.map((item) => item.id)).toEqual(['1', '2', '3']);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });

  it('handles non-existent id on moveUp and moveDown safely as no-ops', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.moveUp('non-existent');
      result.current.moveDown('non-existent');
    });

    expect(result.current.stagedData.map((item) => item.id)).toEqual(['1', '2', '3']);
    expect(result.current.isDirty).toBe(false);
  });

  it('updates a specific field with updateField and flags item as dirty', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.updateField('1', 'tier', 'featured');
    });

    expect(result.current.stagedData[0].tier).toBe('featured');
    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(1);
    expect(result.current.dirtyItems).toHaveLength(1);
    expect(result.current.dirtyItems[0].id).toBe('1');
    expect(result.current.isItemDirty('1')).toBe(true);
    expect(result.current.isItemDirty('2')).toBe(false);
  });

  it('clears dirty state if a field is updated back to pristine value', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.updateField('1', 'tier', 'archive');
    });
    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(1);

    act(() => {
      result.current.updateField('1', 'tier', 'standard');
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.dirtyItems).toEqual([]);
    expect(result.current.isItemDirty('1')).toBe(false);
  });

  it('clears dirty state if neighbor swap is undone by reciprocal swap', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.moveDown('1');
    });
    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(2);

    act(() => {
      result.current.moveUp('1');
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.dirtyItems).toEqual([]);
    expect(result.current.isItemDirty('1')).toBe(false);
  });

  it('discards staged changes and reverts back to pristine baseline', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.moveUp('2');
      result.current.updateField('3', 'tier', 'archive');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(3);

    act(() => {
      result.current.discard();
    });

    expect(result.current.stagedData).toEqual(sampleData);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.dirtyItems).toEqual([]);
  });

  it('commits changes without arguments, making stagedData the new pristine baseline', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    act(() => {
      result.current.updateField('1', 'tier', 'featured');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.commit();
    });

    // Pristine baseline is updated, so dirty flags reset
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.stagedData[0].tier).toBe('featured');

    // Future edit now compares to the newly committed baseline
    act(() => {
      result.current.updateField('1', 'tier', 'standard');
    });
    expect(result.current.isDirty).toBe(true);
    expect(result.current.isItemDirty('1')).toBe(true);
  });

  it('commits with a newBaseline argument, replacing both baseline and staged data', () => {
    const { result } = renderHook(() => useStagedList(sampleData));

    const newBaseline = [
      { id: '100', title: 'New Item', tier: 'featured', sort_order: 0 },
    ];

    act(() => {
      result.current.commit(newBaseline);
    });

    expect(result.current.stagedData).toEqual(newBaseline);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });

  it('syncs pristine baseline and stagedData when initialData updates from server', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useStagedList(data),
      { initialProps: { data: sampleData } }
    );

    expect(result.current.stagedData.map((i) => i.id)).toEqual(['1', '2', '3']);

    const serverUpdatedData = [
      { id: '1', title: 'Alpha Updated', tier: 'featured', sort_order: 0 },
      { id: '2', title: 'Beta Project', tier: 'featured', sort_order: 1 },
      { id: '4', title: 'Delta Project', tier: 'standard', sort_order: 2 },
    ];

    rerender({ data: serverUpdatedData });

    expect(result.current.stagedData.map((i) => i.id)).toEqual(['1', '2', '4']);
    expect(result.current.stagedData[0].title).toBe('Alpha Updated');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });
});
