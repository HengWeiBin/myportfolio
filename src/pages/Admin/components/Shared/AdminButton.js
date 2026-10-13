import React from 'react';

/**
 * AdminButton
 * Reusable button styled with Tailwind CSS v4 cyber tokens.
 * Supports primary, danger, secondary, and ghost variants.
 */
const AdminButton = ({
  children,
  variant = 'primary',
  danger = false,
  $danger = false,
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  const isDanger = danger || $danger || variant === 'danger';

  const baseStyles = 'inline-flex items-center justify-center font-mono font-medium rounded transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }[size] || 'text-sm px-3.5 py-2 gap-2';

  let variantStyles = 'bg-cyan-electric/15 text-cyan-electric border border-cyan-electric/50 hover:bg-cyan-electric hover:text-cyber-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]';

  if (isDanger) {
    variantStyles = 'bg-terminal-rose/15 text-terminal-rose border border-terminal-rose/50 hover:bg-terminal-rose hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]';
  } else if (variant === 'secondary') {
    variantStyles = 'bg-cyber-surface text-slate-300 border border-cyber-border hover:bg-cyber-panel hover:text-white hover:border-slate-500';
  } else if (variant === 'ghost') {
    variantStyles = 'bg-transparent text-slate-400 hover:text-cyan-electric hover:bg-white/5 border border-transparent';
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : children}
    </button>
  );
};

export default AdminButton;
