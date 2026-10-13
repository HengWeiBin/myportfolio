import React, { useRef, useState } from 'react';

/**
 * ImageDropzone
 * Reusable drag & drop image uploader with preview and file selection
 * styled with Tailwind CSS v4 cyber tokens.
 */
const ImageDropzone = ({
  label = 'Asset Image',
  previewUrl,
  onFileSelect,
  onClear,
  uploading = false,
  className = '',
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && onFileSelect) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 mb-3.5 ${className}`}>
      {label && (
        <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
          {label}
        </span>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-cyan-electric bg-cyan-electric/10'
            : 'border-cyber-border hover:border-cyan-electric/50 bg-cyber-card/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative group max-w-xs mx-auto">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-32 object-cover rounded border border-cyber-border"
            />
            <div className="absolute inset-0 bg-cyber-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
              <span className="text-xs font-mono text-cyan-electric">Click to Change</span>
              {onClear && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-2 py-1 bg-terminal-rose/20 text-terminal-rose border border-terminal-rose/40 rounded text-xs font-mono hover:bg-terminal-rose hover:text-white"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-cyber-panel flex items-center justify-center text-slate-400 group-hover:text-cyan-electric">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-xs font-mono text-slate-300">
              Drop image here, or <span className="text-cyan-electric">browse</span>
            </p>
            <p className="text-[11px] font-mono text-slate-500">PNG, JPG, WebP up to 10MB</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-cyber-black/80 flex items-center justify-center rounded-lg">
            <span className="text-xs font-mono text-cyan-electric animate-pulse">Uploading to R2...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDropzone;
