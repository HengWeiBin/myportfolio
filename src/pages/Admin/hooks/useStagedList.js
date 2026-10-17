import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Deep or shallow cloning and sorting helper.
 * Normalizes sort_order comparison and maintains a safe clone.
 */
const sortItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({ ...item }))
    .sort((a, b) => {
      const orderA = a.sort_order !== undefined && a.sort_order !== null ? Number(a.sort_order) : 0;
      const orderB = b.sort_order !== undefined && b.sort_order !== null ? Number(b.sort_order) : 0;
      return orderA - orderB;
    });
};

/**
 * Compares two items to determine if any properties differ.
 */
const isItemModified = (item, pristine) => {
  if (!pristine) return true;
  const allKeys = new Set([...Object.keys(item), ...Object.keys(pristine)]);
  for (const key of allKeys) {
    if (key === 'sort_order') {
      const a = item.sort_order !== undefined && item.sort_order !== null ? Number(item.sort_order) : 0;
      const b = pristine.sort_order !== undefined && pristine.sort_order !== null ? Number(pristine.sort_order) : 0;
      if (a !== b) return true;
    } else {
      const valA = item[key];
      const valB = pristine[key];
      if (Array.isArray(valA) && Array.isArray(valB)) {
        if (valA.length !== valB.length || !valA.every((v, i) => v === valB[i])) {
          return true;
        }
      } else if (valA !== valB) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Compares two arrays of objects for content equality.
 */
const areDatasetsEqual = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((itemA, i) => {
    const itemB = b[i];
    if (itemA === itemB) return true;
    if (!itemA || !itemB) return false;
    return !isItemModified(itemA, itemB);
  });
};

/**
 * useStagedList
 *
 * Client-side staging state management hook that isolates uncommitted changes
 * from pristine baseline data. Provides instant updates, neighbor-swap reordering
 * with sequential index normalization, diff tracking, and rollback.
 *
 * @param {Array} initialData - Incoming server data
 * @returns {Object} Staging controls, data, and dirty indicators
 */
export function useStagedList(initialData = []) {
  const [pristineData, setPristineData] = useState(() => sortItems(initialData));
  const [stagedData, setStagedData] = useState(() => sortItems(initialData));
  const prevInitialDataRef = useRef(initialData);

  // Sync baseline and staged data when initialData changes from server
  useEffect(() => {
    if (!areDatasetsEqual(prevInitialDataRef.current, initialData)) {
      prevInitialDataRef.current = initialData;
      const normalized = sortItems(initialData);
      setPristineData(normalized);
      setStagedData(normalized);
    }
  }, [initialData]);

  // Lookup map for fast pristine comparison by ID
  const pristineMap = useMemo(() => {
    const map = new Map();
    pristineData.forEach((item) => {
      map.set(String(item.id), item);
    });
    return map;
  }, [pristineData]);

  // Calculate dirty items relative to pristine baseline
  const dirtyItems = useMemo(() => {
    return stagedData.filter((item) => {
      const pristine = pristineMap.get(String(item.id));
      return isItemModified(item, pristine);
    });
  }, [stagedData, pristineMap]);

  const dirtyCount = dirtyItems.length;
  const isDirty = dirtyCount > 0 || stagedData.length !== pristineData.length;

  // Check if a specific item by ID is dirty
  const isItemDirty = useCallback(
    (id) => {
      const item = stagedData.find((i) => String(i.id) === String(id));
      if (!item) return false;
      const pristine = pristineMap.get(String(id));
      return isItemModified(item, pristine);
    },
    [stagedData, pristineMap]
  );

  // Move item up: swap with preceding neighbor and sequentially normalize sort_order
  const moveUp = useCallback((id) => {
    setStagedData((prev) => {
      const index = prev.findIndex((item) => String(item.id) === String(id));
      if (index <= 0) return prev; // At top or not found -> no-op

      const next = [...prev];
      const prevIndex = index - 1;
      const temp = next[index];
      next[index] = next[prevIndex];
      next[prevIndex] = temp;

      return next.map((item, idx) => ({
        ...item,
        sort_order: idx,
      }));
    });
  }, []);

  // Move item down: swap with succeeding neighbor and sequentially normalize sort_order
  const moveDown = useCallback((id) => {
    setStagedData((prev) => {
      const index = prev.findIndex((item) => String(item.id) === String(id));
      if (index === -1 || index >= prev.length - 1) return prev; // At bottom or not found -> no-op

      const next = [...prev];
      const nextIndex = index + 1;
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;

      return next.map((item, idx) => ({
        ...item,
        sort_order: idx,
      }));
    });
  }, []);

  // Update specific field on item
  const updateField = useCallback((id, field, value) => {
    setStagedData((prev) => {
      const index = prev.findIndex((item) => String(item.id) === String(id));
      if (index === -1) return prev;
      if (prev[index][field] === value) return prev;

      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };

      if (field === 'sort_order') {
        return sortItems(next);
      }
      return next;
    });
  }, []);

  // Discard all staged changes, resetting stagedData to pristine baseline
  const discard = useCallback(() => {
    setStagedData(pristineData.map((item) => ({ ...item })));
  }, [pristineData]);

  // Commit current or provided baseline, resetting dirty flags
  const commit = useCallback(
    (newBaseline) => {
      if (newBaseline !== undefined && newBaseline !== null) {
        const next = sortItems(newBaseline);
        setPristineData(next);
        setStagedData(next);
        prevInitialDataRef.current = next;
      } else {
        const next = stagedData.map((item) => ({ ...item }));
        setPristineData(next);
        prevInitialDataRef.current = next;
      }
    },
    [stagedData]
  );

  return {
    stagedData,
    isDirty,
    dirtyCount,
    dirtyItems,
    isItemDirty,
    discard,
    commit,
    moveUp,
    moveDown,
    updateField,
  };
}

export default useStagedList;
