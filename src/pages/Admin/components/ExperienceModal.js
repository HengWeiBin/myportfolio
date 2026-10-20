import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FormInput, AdminButton } from './Shared';

/**
 * ExperienceModal
 * Modal for creating and editing career experience with split-screen Markdown editor.
 * Strictly under 250 LOC.
 */
const ExperienceModal = ({
  isOpen,
  isEdit,
  initialData = {},
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    date_range: '',
    sort_order: 0,
    description: '',
    ...initialData,
  });

  useEffect(() => {
    setFormData({
      id: initialData.id,
      role: initialData.role || '',
      company: initialData.company || '',
      date_range: initialData.date_range || '',
      sort_order: initialData.sort_order ?? 0,
      description: initialData.description || '',
    });
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      ...(initialData.id ? { id: initialData.id } : {}),
      sort_order: Number(formData.sort_order) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-cyber-dark border border-cyan-electric/40 shadow-[0_0_35px_rgba(0,0,0,0.8)] rounded-lg w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-surface/50">
          <div className="flex items-center gap-2">
            <span className="text-cyan-electric font-mono font-bold">&gt;</span>
            <h3 className="text-base font-mono font-bold uppercase tracking-wider text-cyan-electric">
              {isEdit ? 'Edit' : 'Add'} Experience
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-electric font-mono text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Role / Position"
              placeholder="Role / Position"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            />
            <FormInput
              label="Company"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Date Range"
              placeholder="Date Range (e.g. 2021 - Present)"
              value={formData.date_range}
              onChange={(e) => setFormData({ ...formData, date_range: e.target.value })}
            />
            <FormInput
              type="number"
              label="Sort Order"
              placeholder="Sort Order (e.g. 0)"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
            />
          </div>

          {/* Split-Screen Markdown Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                Description (Markdown supported)
              </span>
              <span className="text-[11px] font-mono text-cyan-electric">Live Preview</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[160px]">
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-44 p-3 bg-cyber-card border border-cyber-border rounded text-slate-100 font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-electric resize-y"
              />
              <div className="h-44 p-3 bg-cyber-panel/60 border border-cyber-border rounded overflow-y-auto text-xs font-mono text-slate-300 prose-invert">
                {formData.description ? (
                  <ReactMarkdown>{formData.description}</ReactMarkdown>
                ) : (
                  <span className="text-slate-500 italic">Live Markdown preview will appear here...</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-cyber-border">
            <AdminButton variant="secondary" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit">
              Save Changes
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperienceModal;
