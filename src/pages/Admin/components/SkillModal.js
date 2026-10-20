import React, { useState, useEffect } from 'react';
import { FormInput, AdminButton } from './Shared';

/**
 * SkillModal
 * Modal for adding and editing categorized skills.
 * Strictly under 250 LOC.
 */
const SkillModal = ({
  isOpen,
  isEdit,
  initialData = {},
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    ...initialData,
  });

  useEffect(() => {
    setFormData({
      id: initialData.id,
      name: initialData.name || '',
      category: initialData.category || '',
    });
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      ...(initialData.id ? { id: initialData.id } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-cyber-dark border border-cyan-electric/40 shadow-[0_0_35px_rgba(0,0,0,0.8)] rounded-lg w-full max-w-md flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-surface/50">
          <div className="flex items-center gap-2">
            <span className="text-cyan-electric font-mono font-bold">&gt;</span>
            <h3 className="text-base font-mono font-bold uppercase tracking-wider text-cyan-electric">
              {isEdit ? 'Edit' : 'Add'} Skills
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormInput
            label="Skill Name"
            placeholder="Skill Name (e.g. PyTorch, Docker)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <FormInput
            label="Category"
            placeholder="Category (e.g. DL Frameworks, Core & Math)"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />

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

export default SkillModal;
