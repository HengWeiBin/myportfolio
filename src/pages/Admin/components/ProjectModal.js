import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FormInput, FormSelect, FormTextarea, AdminButton, ImageDropzone } from './Shared';

/**
 * ProjectModal
 * Split-screen Markdown editing with live styling preview and NDA metadata management.
 * Strictly under 250 LOC.
 */
const ProjectModal = ({ isOpen, isEdit, initialData = {}, onClose, onSave, uploading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    date_start: '',
    date_end: '',
    tier: 'standard',
    sort_order: 0,
    visual_type: 'image',
    repo_visibility: 'public',
    is_confidential: false,
    metrics: '{}',
    ...initialData,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData.image_url || null);

  useEffect(() => {
    const metricsStr = typeof initialData.metrics === 'object' && initialData.metrics !== null
      ? JSON.stringify(initialData.metrics, null, 2)
      : (typeof initialData.metrics === 'string' ? initialData.metrics : '{}');
    setFormData({
      id: initialData.id,
      title: initialData.title || '',
      description: initialData.description || '',
      link: initialData.link || '',
      date_start: initialData.date_start || '',
      date_end: initialData.date_end || '',
      tier: (initialData.tier === 'foundation' || initialData.tier === 'archived') ? 'archive' : (initialData.tier || 'standard'),
      sort_order: initialData.sort_order ?? 0,
      visual_type: initialData.visual_type || 'image',
      repo_visibility: initialData.repo_visibility || 'public',
      is_confidential: Boolean(initialData.is_confidential),
      metrics: metricsStr,
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
    let parsedMetrics = {};
    if (typeof formData.metrics === 'string' && formData.metrics.trim()) {
      try {
        parsedMetrics = JSON.parse(formData.metrics);
      } catch {
        parsedMetrics = formData.metrics;
      }
    } else if (typeof formData.metrics === 'object') {
      parsedMetrics = formData.metrics;
    }

    onSave({
      ...formData,
      ...(initialData.id ? { id: initialData.id } : {}),
      sort_order: Number(formData.sort_order) || 0,
      is_confidential: Boolean(formData.is_confidential),
      metrics: parsedMetrics,
      file: selectedFile,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-cyber-dark border border-cyan-electric/40 shadow-[0_0_35px_rgba(0,0,0,0.8)] rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-surface/50">
          <div className="flex items-center gap-2">
            <span className="text-cyan-electric font-mono font-bold">&gt;</span>
            <h3 className="text-base font-mono font-bold uppercase tracking-wider text-cyan-electric">
              {isEdit ? 'Edit' : 'Add'} Projects
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
              label="Title"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <FormInput
              label="Link (URL)"
              placeholder="Link (URL)"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FormInput
              label="Start Date"
              placeholder="Start Date"
              value={formData.date_start}
              onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
            />
            <FormInput
              label="End Date"
              placeholder="End Date"
              value={formData.date_end}
              onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              id="visual_type"
              label="Visual Type"
              value={formData.visual_type}
              onChange={(e) => setFormData({ ...formData, visual_type: e.target.value })}
              options={[
                { value: 'image', label: 'Image (Standard)' },
                { value: 'ResultViz', label: 'ResultViz (Confidence BBox)' },
                { value: 'CodeBlock', label: 'CodeBlock (Interactive Code)' },
                { value: 'NeuralArch', label: 'NeuralArch (Layer Graph)' },
              ]}
            />
            <FormSelect
              label="Repo Visibility"
              value={formData.repo_visibility}
              onChange={(e) => setFormData({ ...formData, repo_visibility: e.target.value })}
              options={[
                { value: 'public', label: 'Public Repository' },
                { value: 'private', label: 'Private / Restricted' },
              ]}
            />
          </div>

          {/* NDA Confidentiality Toggle */}
          <div className="flex items-center gap-3 p-3 bg-cyber-card border border-cyber-border rounded">
            <input
              type="checkbox"
              id="is_confidential"
              checked={Boolean(formData.is_confidential)}
              onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked })}
              className="w-4 h-4 accent-cyan-electric cursor-pointer"
            />
            <label htmlFor="is_confidential" className="text-xs font-mono text-slate-300 cursor-pointer select-none">
              <span className="font-semibold text-rose-400">🔒 Confidential / NDA Case Study</span>{' '}
              <span className="text-slate-400">(Redacts link &amp; metrics in public view)</span>
            </label>
          </div>

          {/* Split-Screen Markdown Editor & Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                Description (Split-Screen Markdown)
              </span>
              <span className="text-[11px] font-mono text-cyan-electric">Live Styling Preview</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[160px]">
              <textarea
                placeholder="Description (Markdown supported)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-40 p-3 bg-cyber-card border border-cyber-border rounded text-slate-100 font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-electric resize-y"
              />
              <div className="h-40 p-3 bg-cyber-panel/60 border border-cyber-border rounded overflow-y-auto text-xs font-mono text-slate-300 prose-invert">
                {formData.description ? (
                  <ReactMarkdown>{formData.description}</ReactMarkdown>
                ) : (
                  <span className="text-slate-500 italic">Live Markdown preview will appear here...</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextarea
              label="Metrics JSON"
              placeholder='Metrics JSON (e.g. { "speedup": "4x", "accuracy": "98.5%" })'
              value={formData.metrics}
              onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
              rows={3}
            />
            <ImageDropzone
              label="Project Image (Visual)"
              previewUrl={imagePreview}
              onFileSelect={handleFileChange}
              onClear={() => { setSelectedFile(null); setImagePreview(null); }}
              uploading={uploading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-cyber-border">
            <AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton>
            <AdminButton type="submit" loading={uploading}>Save Changes</AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
