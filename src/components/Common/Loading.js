import React from 'react';

export const Skeleton = ({ width = '100%', height = '1rem', mb = '0.5rem', className = '', style = {} }) => {
  return (
    <div
      className={`animate-pulse bg-slate-800/80 rounded border border-slate-700/30 ${className}`}
      style={{
        width,
        height,
        marginBottom: mb,
        ...style
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonCard = ({ children, className = '', style = {} }) => {
  return (
    <div
      className={`border border-cyber-border bg-cyber-card/40 rounded-lg p-5 mb-8 animate-pulse ${className}`}
      style={style}
      aria-hidden="true"
    >
      {children}
    </div>
  );
};

export const AdminTableSkeleton = () => (
  <div className="w-full border border-cyber-border rounded overflow-hidden">
    <div className="p-3 border-b border-cyber-border bg-white/[0.02]">
      <Skeleton height="1.5rem" width="30%" mb="0" />
    </div>
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex gap-4 p-4 border-b border-cyber-border items-center">
        <div className="flex-1"><Skeleton height="1.2rem" width="80%" mb="0" /></div>
        <div className="flex-[2]"><Skeleton height="1.2rem" width="60%" mb="0" /></div>
        <div className="w-24"><Skeleton height="2rem" width="100%" mb="0" /></div>
      </div>
    ))}
  </div>
);

export default Skeleton;
