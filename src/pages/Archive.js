import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { usePortfolio } from '../context/ProfileContext';
import TerminalLayout from '../components/Layout/TerminalLayout';
import { Skeleton } from '../components/Common/Loading';

const Archive = () => {
  const { projects = [], certificates = [], loading } = usePortfolio();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'projects' | 'certificates'
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 'featured' | 'standard' | 'archive'
  const [selectedProof, setSelectedProof] = useState(null);

  // Normalize items for unified search & filtering
  const allItems = useMemo(() => {
    const pItems = projects.map(p => ({
      ...p,
      itemType: 'project',
      category: p.tags ? (Array.isArray(p.tags) ? p.tags.join(', ') : String(p.tags)) : 'Engineering',
      sortDate: p.date_end || p.date_start || '1970-01'
    }));

    const cItems = certificates.map(c => ({
      ...c,
      itemType: 'certificate',
      category: c.category || 'Certificate',
      sortDate: c.date || '1970-01'
    }));

    return [...pItems, ...cItems].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  }, [projects, certificates]);

  // Filter items based on active criteria
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // 1. Type filter
      if (typeFilter === 'projects' && item.itemType !== 'project') return false;
      if (typeFilter === 'certificates' && item.itemType !== 'certificate') return false;

      // 2. Tier filter
      if (tierFilter !== 'all') {
        const itemTier = (item.tier || 'standard').toLowerCase();
        const normalizedTier = (itemTier === 'foundation' || itemTier === 'archived') ? 'archive' : itemTier;
        if (normalizedTier !== tierFilter.toLowerCase()) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const categoryMatch = (item.category || '').toLowerCase().includes(query);
        const issuerMatch = (item.issuer || '').toLowerCase().includes(query);
        const techMatch = (item.tech_stack ? String(item.tech_stack) : '').toLowerCase().includes(query);
        return titleMatch || descMatch || categoryMatch || issuerMatch || techMatch;
      }

      return true;
    });
  }, [allItems, typeFilter, tierFilter, searchQuery]);

  return (
    <TerminalLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation & Header */}
        <div className="mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm text-cyan-electric hover:text-cyan-300 transition-colors mb-4 focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded px-1"
          >
            <span>&larr;</span>
            <span>Return to Mission Control</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cyber-border pb-6">
            <div>
              <div className="text-xs font-mono text-purple-400 tracking-wider uppercase mb-1">
                SYSTEM REPOSITORY // HISTORICAL INDEX
              </div>
              <h1 className="text-3xl sm:text-4xl font-mono font-bold text-slate-100 flex items-center gap-3">
                <span className="text-slate-500">/</span>
                <span>Archive</span>
                <span className="text-purple-400 text-xl font-normal">[all_artifacts]</span>
              </h1>
              <p className="text-sm font-sans text-slate-400 mt-2 max-w-2xl">
                Comprehensive directory of machine learning projects, production models, foundational prototypes, academic publications, and industry credentials.
              </p>
            </div>

            <div className="font-mono text-xs text-slate-400 bg-cyber-card border border-cyber-border px-3 py-2 rounded-lg self-start md:self-auto">
              <span>Displaying </span>
              <span className="text-cyan-electric font-bold">{filteredItems.length}</span>
              <span> of </span>
              <span className="text-slate-200 font-bold">{allItems.length}</span>
              <span> items</span>
            </div>
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="glass-panel p-5 sm:p-6 rounded-xl border border-cyber-border mb-10 space-y-4 shadow-xl">
          {/* Search Input Field */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-sm">
              &gt;
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, algorithms, technologies, or issuer..."
              className="w-full pl-9 pr-10 py-3 bg-cyber-bg/90 border border-cyber-border rounded-lg text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-electric focus:ring-1 focus:ring-cyan-electric transition-colors"
              aria-label="Search archive items"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white font-mono text-xs"
                aria-label="Clear search"
              >
                [clear]
              </button>
            )}
          </div>

          {/* Filter Chips Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {/* Type Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-500 mr-1">TYPE:</span>
              {[
                { id: 'all', label: 'All Types' },
                { id: 'projects', label: 'Projects' },
                { id: 'certificates', label: 'Credentials' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-md transition-all focus:outline-none ${
                    typeFilter === t.id
                      ? 'bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/50 font-bold'
                      : 'bg-cyber-surface text-slate-400 border border-cyber-border hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tier Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-500 mr-1">TIER:</span>
              {[
                { id: 'all', label: 'All Tiers' },
                { id: 'featured', label: 'Featured' },
                { id: 'standard', label: 'Standard' },
                { id: 'archive', label: 'Archive' },
              ].map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setTierFilter(tier.id)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-md transition-all focus:outline-none ${
                    tierFilter === tier.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold'
                      : 'bg-cyber-surface text-slate-400 border border-cyber-border hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Grid / List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-panel p-5 rounded-lg border border-cyber-border flex flex-col md:flex-row gap-4 animate-pulse">
                <Skeleton width="120px" height="1.5rem" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" height="1.5rem" />
                  <Skeleton width="90%" height="1rem" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-xl border border-cyber-border">
            <div className="font-mono text-emerald-400 text-lg mb-2">&gt; query_result: 0_matches_found</div>
            <p className="font-sans text-sm text-slate-400 mb-6">
              No matching archive records match the criteria "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setTierFilter('all');
              }}
              className="px-4 py-2 font-mono text-xs rounded bg-cyan-electric/15 text-cyan-electric border border-cyan-electric/40 hover:bg-cyan-electric/25"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, idx) => {
              const isProject = item.itemType === 'project';
              const isConfidential = Boolean(item.is_confidential);

              return (
                <div
                  key={`${item.itemType}-${item.id || idx}`}
                  className="glass-panel p-5 sm:p-6 rounded-xl border border-cyber-border hover:border-cyan-500/40 transition-all duration-200 hover:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left Column: Metadata & Badges */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        isProject
                          ? 'bg-cyan-electric/10 text-cyan-electric border-cyan-electric/30'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      }`}>
                        {isProject ? 'PROJECT' : 'CREDENTIAL'}
                      </span>

                      {item.tier && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-panel text-slate-400 border border-cyber-border">
                          {((item.tier || '').toLowerCase() === 'foundation' || (item.tier || '').toLowerCase() === 'archived') ? 'archive' : item.tier}
                        </span>
                      )}

                      <span className="text-slate-500">
                        {isProject
                          ? `[${item.date_start || ''} - ${item.date_end || 'PRESENT'}]`
                          : `[${item.date || ''}]`}
                      </span>

                      {item.issuer && (
                        <span className="text-slate-400">
                          // {item.issuer}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-mono font-bold text-slate-100 group-hover:text-cyan-electric transition-colors">
                      {item.title}
                    </h2>

                    {/* Metric Chips */}
                    {item.metrics && typeof item.metrics === 'object' && Object.keys(item.metrics).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(item.metrics).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-electric/10 text-cyan-electric border border-cyan-electric/25"
                          >
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description excerpt */}
                    {item.description && (
                      <div className="text-xs sm:text-sm font-sans text-slate-400 line-clamp-2 max-w-3xl leading-relaxed pt-1">
                        <ReactMarkdown>{item.description}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions & Proofs */}
                  <div className="md:text-right font-mono text-xs flex-shrink-0 self-start md:self-center">
                    {isConfidential ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold">
                        <span>🔒</span>
                        <span>[NDA Protected]</span>
                      </span>
                    ) : isProject && item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-electric/10 border border-cyan-electric/30 text-cyan-electric hover:bg-cyan-electric/20 font-semibold transition-colors"
                      >
                        <span>[Source / Demo]</span>
                        <span>&rarr;</span>
                      </a>
                    ) : !isProject && item.image_url ? (
                      <button
                        type="button"
                        onClick={() => setSelectedProof(item.image_url)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 font-semibold transition-colors"
                      >
                        <span>[View Certificate Proof]</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proof Modal */}
      {selectedProof && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedProof(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Archive Proof Preview"
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-cyber-card border border-purple-500/50 rounded-xl overflow-hidden shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 bg-cyber-surface border-b border-cyber-border">
              <span className="font-mono text-xs text-slate-300">proof_inspect.exe</span>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="text-slate-400 hover:text-white font-mono text-sm px-2 py-0.5 rounded hover:bg-rose-500/20"
              >
                [X]
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh]">
              <img
                src={selectedProof}
                alt="Credential Proof"
                className="max-w-full max-h-[75vh] object-contain mx-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </TerminalLayout>
  );
};

export default Archive;
