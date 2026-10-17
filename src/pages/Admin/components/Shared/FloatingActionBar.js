import React from 'react';
import AdminButton from './AdminButton';

/**
 * FloatingActionBar
 * Sticky floating action bar that slides into view at the bottom of the viewport
 * when staged changes are pending. Styled with Tailwind CSS & Cyberpunk tokens.
 * Strictly under 250 LOC.
 *
 * @param {boolean} isVisible - Whether the bar is visible
 * @param {number} dirtyCount - Number of modified items
 * @param {function} onSave - Callback to save staged changes
 * @param {function} onDiscard - Callback to discard staged changes
 * @param {boolean} isSaving - Loading state during batch persistence
 */
const FloatingActionBar = ({
  isVisible = false,
  dirtyCount = 0,
  onSave,
  onDiscard,
  isSaving = false,
}) => {
  const itemText = dirtyCount === 1 ? 'item' : 'items';

  return (
    <div
      role="region"
      aria-label="Floating Action Bar"
      aria-hidden={!isVisible}
      data-testid="floating-action-bar"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[90%] sm:w-auto transition-all duration-300 ease-in-out ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
          : 'opacity-0 translate-y-10 pointer-events-none invisible scale-95'
      }`}
    >
      <div className="bg-cyber-dark/95 border border-cyan-electric/40 shadow-[0_0_25px_rgba(0,240,255,0.2)] backdrop-blur-md rounded-lg px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 font-mono">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-electric opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-electric" />
          </span>
          <span className="text-xs sm:text-sm text-slate-200 font-medium whitespace-nowrap">
            Unsaved Changes{' '}
            <span className="text-cyan-electric font-semibold">
              ({dirtyCount} {itemText} modified)
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={onDiscard}
            disabled={isSaving}
            aria-label="Discard changes"
            className="hover:border-terminal-rose/50 hover:text-terminal-rose transition-colors"
          >
            <span className="mr-1">↺</span>
            <span>Discard</span>
          </AdminButton>

          <AdminButton
            variant="primary"
            size="sm"
            onClick={onSave}
            loading={isSaving}
            disabled={isSaving}
            aria-label="Save Changes"
            className="shadow-[0_0_12px_rgba(0,240,255,0.25)]"
          >
            Save Changes
          </AdminButton>
        </div>
      </div>
    </div>
  );
};

export default FloatingActionBar;
