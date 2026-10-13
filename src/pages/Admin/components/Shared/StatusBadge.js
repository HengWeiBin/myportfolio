import React from 'react';

/**
 * StatusBadge
 * Visual indicators for tier levels, NDA confidentiality, and repo visibility
 * using Tailwind CSS v4 design tokens.
 */
export const TierBadge = ({ tier = 'standard', className = '' }) => {
  const normalized = (tier || 'standard').toLowerCase();

  const styles = {
    featured: 'bg-cyan-electric/15 text-cyan-electric border-cyan-electric/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]',
    foundation: 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
    standard: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    archive: 'bg-slate-700/25 text-slate-400 border-slate-700',
  }[normalized] || 'bg-slate-700/25 text-slate-400 border-slate-700';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider border ${styles} ${className}`}
    >
      {normalized}
    </span>
  );
};

export const NdaBadge = ({ isConfidential = false, className = '' }) => {
  if (isConfidential) {
    return (
      <span
        title="Confidential NDA Case Study"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold text-terminal-rose bg-terminal-rose/15 border border-terminal-rose/30 shadow-[0_0_8px_rgba(244,63,94,0.2)] ${className}`}
      >
        <span>🔒</span>
        <span>NDA Protected</span>
      </span>
    );
  }

  return (
    <span
      title="Public Case Study"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 ${className}`}
    >
      <span>🌐</span>
      <span>Public</span>
    </span>
  );
};

export const VisibilityBadge = ({ visibility = 'public', className = '' }) => {
  const isPrivate = (visibility || '').toLowerCase() === 'private';
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono border ${
        isPrivate
          ? 'text-purple-300 bg-purple-500/15 border-purple-500/30'
          : 'text-slate-400 bg-slate-800/40 border-slate-700'
      } ${className}`}
    >
      {isPrivate ? 'private repo' : 'public repo'}
    </span>
  );
};

export default {
  TierBadge,
  NdaBadge,
  VisibilityBadge,
};
