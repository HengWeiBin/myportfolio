import React from 'react';

/**
 * FormTextarea
 * Reusable multiline textarea styled with Tailwind CSS v4 tokens.
 */
const FormTextarea = ({
  label,
  id,
  rows = 4,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  helper,
  disabled = false,
  className = '',
  textareaClassName = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 mb-3.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-terminal-rose ml-1">*</span>}
          </span>
          {helper && <span className="text-slate-500 font-normal lowercase">{helper}</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 bg-cyber-card border rounded text-slate-100 font-mono text-sm placeholder:text-slate-500 focus:outline-none transition-colors duration-150 resize-y disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-terminal-rose focus:border-terminal-rose focus:ring-1 focus:ring-terminal-rose'
            : 'border-cyber-border focus:border-cyan-electric focus:ring-1 focus:ring-cyan-electric'
        } ${textareaClassName}`}
        {...props}
      />
      {error && (
        <span className="text-xs font-mono text-terminal-rose mt-0.5">{error}</span>
      )}
    </div>
  );
};

export default FormTextarea;
