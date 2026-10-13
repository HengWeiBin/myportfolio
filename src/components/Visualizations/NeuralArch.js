import React from 'react';

// Standardized visualization of an Encoder-Decoder / Transformer Neural Architecture
const NeuralArch = () => {
  return (
    <div className="w-full h-full bg-[#0d1117] flex items-center justify-center relative p-4">
      <svg
        className="w-[90%] h-[90%] drop-shadow-[0_0_12px_rgba(0,240,255,0.25)]"
        viewBox="0 0 400 200"
      >
        {/* Input Layer */}
        <rect x="50" y="50" width="40" height="100" rx="4" fill="transparent" stroke="#30363d" strokeWidth="2" />
        <text x="70" y="170" fill="#8b949e" fontSize="10" textAnchor="middle" fontFamily="monospace">Input</text>

        {/* Hidden Layers / Transformer Blocks */}
        <rect x="120" y="40" width="160" height="120" rx="4" fill="rgba(0, 240, 255, 0.08)" stroke="#00f0ff" strokeWidth="2" />
        <text x="200" y="100" fill="#00f0ff" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">Transformer Blocks</text>

        {/* Attention heads simulation */}
        {[0, 1, 2].map(i => (
          <circle key={i} cx="150" cy={70 + i * 30} r="5" fill="#00f0ff" />
        ))}
        {[0, 1, 2].map(i => (
          <circle key={`out-${i}`} cx="250" cy={70 + i * 30} r="5" fill="#a855f7" />
        ))}

        {/* Internal connections */}
        <path d="M 155 70 L 245 130" stroke="#00f0ff" strokeWidth="1" opacity="0.6" />
        <path d="M 155 130 L 245 70" stroke="#a855f7" strokeWidth="1" opacity="0.6" />

        {/* Output Layer */}
        <rect x="310" y="50" width="40" height="100" rx="4" fill="transparent" stroke="#30363d" strokeWidth="2" />
        <text x="330" y="170" fill="#8b949e" fontSize="10" textAnchor="middle" fontFamily="monospace">Output</text>

        {/* Flow lines */}
        <path d="M 90 100 L 120 100" stroke="#c9d1d9" strokeWidth="2" markerEnd="url(#arrow)" />
        <path d="M 280 100 L 310 100" stroke="#c9d1d9" strokeWidth="2" markerEnd="url(#arrow)" />

        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#c9d1d9" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default NeuralArch;
