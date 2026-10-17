import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UnsavedChangesModal
 * Cyberpunk-styled confirmation modal prompting admin to resolve uncommitted staged items
 * when attempting tab transitions or modal actions.
 * Strictly under 250 LOC.
 *
 * @param {boolean} isOpen - Whether the modal dialog is rendered
 * @param {string} title - Dialog header title
 * @param {string} message - Explanatory message
 * @param {function} onSaveAndProceed - Commit changes then execute pending transition
 * @param {function} onDiscardAndProceed - Revert changes then execute pending transition
 * @param {function} onCancel - Abort transition and keep dirty changes intact
 * @param {boolean} isSaving - Loading state during batch save
 */
const UnsavedChangesModal = ({
  isOpen = false,
  title = 'Unsaved Changes',
  message = 'You have uncommitted changes in your staging area. If you proceed without saving, these adjustments will be lost. How would you like to proceed?',
  onSaveAndProceed,
  onDiscardAndProceed,
  onCancel,
  isSaving = false,
}) => {
  const modalRef = useRef(null);
  const saveBtnRef = useRef(null);

  // Focus trap and keyboard handling (ESC & Tab)
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      saveBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!isSaving && onCancel) onCancel();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex="0"]'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSaving, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-changes-title"
          aria-describedby="unsaved-changes-message"
          data-testid="unsaved-changes-modal"
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex justify-center items-center z-[9999] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSaving && onCancel) onCancel();
          }}
        >
          <motion.div
            ref={modalRef}
            className="bg-cyber-dark border border-cyan-electric/40 w-full max-w-lg shadow-[0_0_30px_rgba(0,240,255,0.15)] rounded-lg overflow-hidden font-mono"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#161b22] px-4 py-3 border-b border-cyber-border flex justify-between items-center">
              <h3
                id="unsaved-changes-title"
                className="m-0 text-xs sm:text-sm font-mono font-bold text-cyan-electric uppercase tracking-wider flex items-center gap-2"
              >
                <span className="text-terminal-rose animate-pulse">⚠</span>
                <span>{title}</span>
              </h3>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
            </div>

            {/* Body */}
            <div className="p-6 text-slate-200">
              <p
                id="unsaved-changes-message"
                className="mb-6 leading-relaxed font-sans text-sm text-slate-300"
              >
                {message}
              </p>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="px-4 py-2 border border-cyber-border text-slate-300 hover:text-white hover:border-slate-500 hover:bg-white/5 transition-colors rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDiscardAndProceed}
                  disabled={isSaving}
                  className="px-4 py-2 bg-terminal-rose/15 text-terminal-rose border border-terminal-rose/50 hover:bg-terminal-rose hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  Discard & Proceed
                </button>
                <button
                  ref={saveBtnRef}
                  type="button"
                  onClick={onSaveAndProceed}
                  disabled={isSaving}
                  className="px-4 py-2 bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/60 hover:bg-cyan-electric hover:text-cyber-black shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all rounded font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-center"
                >
                  {isSaving && (
                    <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Save & Proceed</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnsavedChangesModal;
