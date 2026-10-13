import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex justify-center items-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="bg-cyber-dark border border-cyber-border w-[90%] max-w-[500px] shadow-2xl overflow-hidden font-mono"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1f2428] px-4 py-2.5 border-b border-cyber-border flex justify-between items-center">
              <h3 className="m-0 text-xs font-mono text-slate-400 uppercase tracking-wider">
                {title || 'System Warning'}
              </h3>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
            </div>
            <div className="p-6 text-slate-200">
              <p className="mb-6 leading-relaxed font-sans text-sm text-slate-300">
                {message}
              </p>
              <div className="flex justify-end gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-cyber-border text-slate-300 hover:text-white hover:border-slate-500 hover:bg-white/5 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="px-4 py-2 bg-rose-600 border border-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
