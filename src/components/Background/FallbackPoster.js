import React from 'react';

/**
 * FallbackPoster
 * Lightweight synchronous CSS gradient + starlight backdrop.
 * Renders immediately during initial paint to avoid layout shift (CLS: 0),
 * and serves as the primary visual on devices with prefers-reduced-motion or unsupported WebGL.
 */
const FallbackPoster = ({ className = '', isReducedMotion = false }) => {
  return (
    <div
      data-testid="fallback-poster"
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-cyber-bg select-none ${className}`}
      aria-hidden="true"
    >
      {/* Ambient gradient meshes */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 25%, rgba(0, 240, 255, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 80% 75%, rgba(168, 85, 247, 0.07) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.03) 0%, transparent 60%),
            radial-gradient(circle at 70% 20%, rgba(245, 158, 11, 0.03) 0%, transparent 35%),
            #07090e
          `
        }}
      />

      {/* Cyber Constellation Grid / Noise overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="fallback-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(30, 41, 59, 0.4)"
              strokeWidth="0.5"
            />
            {/* Subtle cluster nodes in grid intersections */}
            <circle cx="0" cy="0" r="1" fill="rgba(0, 240, 255, 0.3)" />
            <circle cx="60" cy="60" r="0.75" fill="rgba(168, 85, 247, 0.2)" />
          </pattern>
          <radialGradient id="center-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
          </radialGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#fallback-grid)"
          mask="url(#fade-mask)"
        />
      </svg>

      {/* Static constellation nodes for reduced-motion / fallback */}
      <div className="absolute inset-0">
        {[
          { top: '18%', left: '22%', size: '3px', color: '#00f0ff', opacity: 0.7 },
          { top: '24%', left: '78%', size: '2.5px', color: '#a855f7', opacity: 0.6 },
          { top: '65%', left: '15%', size: '2px', color: '#10b981', opacity: 0.5 },
          { top: '72%', left: '85%', size: '3px', color: '#00f0ff', opacity: 0.65 },
          { top: '42%', left: '60%', size: '2px', color: '#f59e0b', opacity: 0.5 },
          { top: '80%', left: '40%', size: '2.5px', color: '#38bdf8', opacity: 0.55 },
          { top: '33%', left: '45%', size: '4px', color: '#00f0ff', opacity: 0.8 },
        ].map((node, idx) => (
          <div
            key={idx}
            className={`absolute rounded-full pointer-events-none ${isReducedMotion ? '' : 'animate-pulse'}`}
            style={{
              top: node.top,
              left: node.left,
              width: node.size,
              height: node.size,
              backgroundColor: node.color,
              boxShadow: `0 0 10px ${node.color}`,
              opacity: node.opacity,
              animationDuration: `${3 + idx}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FallbackPoster;
