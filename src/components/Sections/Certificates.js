import React, { useState } from 'react';
import { usePortfolio } from '../../context/ProfileContext';
import { Skeleton, SkeletonCard } from '../Common/Loading';

const Certificates = () => {
  const { certificates: achievements = [], loading } = usePortfolio();
  const [selectedImage, setSelectedImage] = useState(null);

  const getCategory = (item) => {
    if (item.category) return item.category;
    const lowerTitle = (item.title || '').toLowerCase();
    if (lowerTitle.includes('paper') || lowerTitle.includes('conference') || lowerTitle.includes('journal')) return 'Paper';
    if (lowerTitle.includes('competition') || lowerTitle.includes('hackathon') || lowerTitle.includes('award')) return 'Competition';
    return 'Certificate';
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'Paper':
        return {
          bg: 'bg-cyan-electric/15 text-cyan-electric border-cyan-electric/30',
          label: 'PUBLICATION',
          icon: '📄'
        };
      case 'Competition':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          label: 'AWARD',
          icon: '🏆'
        };
      default:
        return {
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          label: 'CERTIFICATION',
          icon: '📜'
        };
    }
  };

  const normalizeTier = (tier) => {
    const t = (tier || 'standard').toLowerCase();
    if (t === 'foundation' || t === 'archived') return 'archive';
    return t;
  };

  const visibleCertificates = achievements.filter(
    (item) => normalizeTier(item.tier) !== 'archive'
  );

  const hasFeatured = visibleCertificates.some(
    (item) => normalizeTier(item.tier) === 'featured'
  );

  const sortedAchievements = [...visibleCertificates].sort((a, b) => {
    const score = (type) => {
      if (type === 'Paper') return 3;
      if (type === 'Competition') return 2;
      return 1;
    };

    if (hasFeatured) {
      const tierRank = (item) => (normalizeTier(item.tier) === 'featured' ? 1 : 0);
      const tierDiff = tierRank(b) - tierRank(a);
      if (tierDiff !== 0) return tierDiff;
    }

    return score(getCategory(b)) - score(getCategory(a));
  });

  return (
    <section id="certificates" className="py-20 border-b border-cyber-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-14">
          <div className="text-xs font-mono text-cyan-electric tracking-widest uppercase mb-1">
            04 // PEER RECOGNITION
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 flex items-center gap-2">
            <span className="text-emerald-400">$ ls</span>
            <span>/var/log/credentials/</span>
          </h2>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i}>
                <Skeleton width="40%" height="1.2rem" />
                <Skeleton width="80%" height="1.5rem" />
                <Skeleton width="60%" height="1rem" />
                <Skeleton width="30%" height="2rem" />
              </SkeletonCard>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAchievements.map((item) => {
              const category = getCategory(item);
              const styles = getTypeStyles(category);
              const isHighlight = category === 'Paper' || category === 'Competition';

              return (
                <div
                  key={item.id || item.title}
                  className={`glass-panel p-6 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                    isHighlight
                      ? 'border-cyan-500/40 bg-cyan-electric/[0.03] hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                      : 'border-cyber-border hover:border-slate-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${styles.bg}`}>
                        {styles.label}
                      </span>
                      <span className="text-base" role="img" aria-label={styles.label}>
                        {styles.icon}
                      </span>
                    </div>

                    <h3 className="font-mono text-base font-bold text-slate-100 leading-snug mb-2 hover:text-cyan-electric transition-colors">
                      {item.title}
                    </h3>

                    <div className="text-xs font-mono text-slate-400 space-y-1 mb-4">
                      {item.date && <div>date: {item.date}</div>}
                      {item.issuer && <div>issuer: {item.issuer}</div>}
                    </div>
                  </div>

                  {item.image_url && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(item.image_url)}
                      className="mt-4 w-full text-left font-mono text-xs text-slate-400 hover:text-cyan-electric border border-dashed border-cyber-border hover:border-cyan-400/50 hover:bg-cyan-electric/5 px-3 py-2 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    >
                      &gt; view_proof.jpg
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proof Modal Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Credential Proof Modal"
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-cyber-card border border-cyan-electric/50 rounded-xl overflow-hidden shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 bg-cyber-surface border-b border-cyber-border">
              <span className="font-mono text-xs text-slate-300">proof_viewer.exe</span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-white font-mono text-sm px-2 py-0.5 rounded hover:bg-rose-500/20"
                aria-label="Close proof preview"
              >
                [X]
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh]">
              <img
                src={selectedImage}
                alt="Credential Proof Preview"
                className="max-w-full max-h-[75vh] object-contain mx-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Certificates;
