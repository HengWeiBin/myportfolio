import React, { useState, useEffect } from 'react';
import { FormInput, FormSelect, AdminButton, ImageDropzone } from './Shared';

/**
 * CertificateModal
 * Modal for creating and editing certificates with category, tier, and sort order.
 * Strictly under 250 LOC.
 */
const CertificateModal = ({
  isOpen,
  isEdit,
  initialData = {},
  onClose,
  onSave,
  uploading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    date: '',
    credential_id: '',
    category: 'Certificate',
    tier: 'standard',
    sort_order: 0,
    ...initialData,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData.image_url || null);

  useEffect(() => {
    setFormData({
      id: initialData.id,
      title: initialData.title || '',
      issuer: initialData.issuer || '',
      date: initialData.date || '',
      credential_id: initialData.credential_id || '',
      category: initialData.category || 'Certificate',
      tier: (initialData.tier === 'foundation' || initialData.tier === 'archived') ? 'archive' : (initialData.tier || 'standard'),
      sort_order: initialData.sort_order ?? 0,
    });
    setImagePreview(initialData.image_url || null);
    setSelectedFile(null);
  }, [initialData]);

  if (!isOpen) return null;

  const handleFileChange = (file) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      ...(initialData.id ? { id: initialData.id } : {}),
      sort_order: Number(formData.sort_order) || 0,
      file: selectedFile,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-cyber-dark border border-cyan-electric/40 shadow-[0_0_35px_rgba(0,0,0,0.8)] rounded-lg w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-surface/50">
          <div className="flex items-center gap-2">
            <span className="text-cyan-electric font-mono font-bold">&gt;</span>
            <h3 className="text-base font-mono font-bold uppercase tracking-wider text-cyan-electric">
              {isEdit ? 'Edit' : 'Add'} Certificates
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
          <FormInput
            label="Certificate Title"
            placeholder="Certificate Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Issuer"
              placeholder="Issuer"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
            />
            <FormInput
              label="Date"
              placeholder="Date (YYYY-MM-DD)"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <FormInput
            label="Credential ID"
            placeholder="Credential ID"
            value={formData.credential_id}
            onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'Certificate', label: 'Certificate' },
                { value: 'Paper', label: 'Research Paper' },
                { value: 'Competition', label: 'Competition / Award' },
                { value: 'License', label: 'Professional License' },
              ]}
            />
            <FormSelect
              label="Tier"
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              options={[
                { value: 'featured', label: 'Featured' },
                { value: 'standard', label: 'Standard' },
                { value: 'archive', label: 'Archive' },
              ]}
            />
            <FormInput
              type="number"
              label="Sort Order"
              placeholder="Sort Order (e.g. 0)"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
            />
          </div>

          <ImageDropzone
            label="Certificate Image / Proof"
            previewUrl={imagePreview}
            onFileSelect={handleFileChange}
            onClear={() => { setSelectedFile(null); setImagePreview(null); }}
            uploading={uploading}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-cyber-border">
            <AdminButton variant="secondary" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={uploading}>
              Save Changes
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CertificateModal;
