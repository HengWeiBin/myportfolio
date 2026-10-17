import { useState, useEffect, useCallback } from 'react';

/**
 * useNavigationGuard
 *
 * Encapsulates browser unload confirmation, pending transition orchestration,
 * and interception modal state when staged changes are dirty.
 * Strictly under 250 LOC.
 *
 * @param {Object} options
 * @param {boolean} options.isDirty - True if uncommitted staged changes exist
 * @param {Function} options.onSave - Callback to persist dirty items to server
 * @param {Function} options.onDiscard - Callback to roll back staged changes
 * @returns {Object} Navigation guard handlers and state
 */
export default function useNavigationGuard({
  isDirty = false,
  onSave,
  onDiscard,
}) {
  const [pendingAction, setPendingAction] = useState(null);
  const [isGuardOpen, setIsGuardOpen] = useState(false);

  // 1. Browser beforeunload listener
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Request transition: if dirty, open guard and buffer action; otherwise run immediately
  const requestTransition = useCallback(
    (action) => {
      if (isDirty) {
        setPendingAction(() => action);
        setIsGuardOpen(true);
      } else if (typeof action === 'function') {
        action();
      }
    },
    [isDirty]
  );

  // Handle Save & Proceed: persist changes first, then execute transition
  const handleSaveAndProceed = useCallback(async () => {
    let success = true;
    if (typeof onSave === 'function') {
      const res = await onSave();
      if (res === false) {
        success = false;
      }
    }

    if (success) {
      if (typeof pendingAction === 'function') {
        pendingAction();
      }
      setIsGuardOpen(false);
      setPendingAction(null);
    }
  }, [onSave, pendingAction]);

  // Handle Discard & Proceed: roll back changes, then execute transition
  const handleDiscardAndProceed = useCallback(() => {
    if (typeof onDiscard === 'function') {
      onDiscard();
    }
    if (typeof pendingAction === 'function') {
      pendingAction();
    }
    setIsGuardOpen(false);
    setPendingAction(null);
  }, [onDiscard, pendingAction]);

  // Handle Cancel: abort transition and preserve dirty changes
  const handleCancel = useCallback(() => {
    setIsGuardOpen(false);
    setPendingAction(null);
  }, []);

  return {
    pendingAction,
    isGuardOpen,
    requestTransition,
    handleSaveAndProceed,
    handleDiscardAndProceed,
    handleCancel,
  };
}
