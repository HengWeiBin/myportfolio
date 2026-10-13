import React, { useMemo } from 'react';
import { AdminButton, TierBadge, NdaBadge, VisibilityBadge } from './Shared';
import { AdminTableSkeleton } from '../../../components/Common/Loading';

/**
 * ProjectsTab
 * Displays project entries with instant tier switching, sort order controls,
 * NDA confidentiality indicators, and CRUD actions. Strictly under 250 LOC.
 */
const ProjectsTab = ({
  data = [],
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onUpdateProject,
}) => {
  const sortedProjects = useMemo(() => {
    return [...data].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  }, [data]);

  const handleTierChange = (project, newTier) => {
    if (onUpdateProject) {
      onUpdateProject(project.id, { ...project, tier: newTier });
    }
  };

  const handleOrderChange = (project, delta) => {
    if (onUpdateProject) {
      const currentOrder = Number(project.sort_order) || 0;
      const nextOrder = Math.max(0, currentOrder + delta);
      onUpdateProject(project.id, { ...project, sort_order: nextOrder });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-cyber-border">
        <div>
          <h2 className="text-lg font-mono font-bold text-cyan-electric tracking-wide flex items-center gap-2">
            <span>Projects Management</span>
            <span className="text-xs font-mono font-normal text-slate-400">({data.length})</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Manage case studies, tiers (featured/foundation/archive), and NDA protections
          </p>
        </div>
        <AdminButton onClick={onAdd} size="sm">
          + New Entry
        </AdminButton>
      </div>

      {loading ? (
        <AdminTableSkeleton />
      ) : sortedProjects.length === 0 ? (
        <div className="p-8 text-center text-slate-400 border border-dashed border-cyber-border rounded-lg font-mono text-sm">
          No data found. Click "+ New Entry" to add some.
        </div>
      ) : (
        <div className="overflow-x-auto border border-cyber-border rounded-lg bg-cyber-dark/40 shadow-xl">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-cyber-border bg-cyber-panel/60 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold text-cyan-electric">Project Title</th>
                <th className="py-3 px-3 font-semibold">Tier (Instant Switch)</th>
                <th className="py-3 px-3 font-semibold text-center w-28">Sort Order</th>
                <th className="py-3 px-3 font-semibold">Status / Visibility</th>
                <th className="py-3 px-4 font-semibold text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {sortedProjects.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100 text-sm">{item.title}</div>
                    <div className="text-slate-400 text-[11px] truncate max-w-xs mt-0.5">
                      {item.link || item.description || 'No URL specified'}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Tier for ${item.title}`}
                        value={item.tier || 'standard'}
                        onChange={(e) => handleTierChange(item, e.target.value)}
                        className="bg-cyber-card border border-cyber-border rounded px-2 py-1 text-xs text-slate-200 font-mono focus:border-cyan-electric focus:outline-none"
                      >
                        <option value="featured">Featured</option>
                        <option value="standard">Standard</option>
                        <option value="foundation">Foundation</option>
                        <option value="archive">Archive</option>
                      </select>
                      <TierBadge tier={item.tier} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 bg-cyber-card px-2 py-1 rounded border border-cyber-border">
                      <button
                        type="button"
                        title="Move Up (Decrease sort_order)"
                        onClick={() => handleOrderChange(item, -1)}
                        className="text-slate-400 hover:text-cyan-electric px-1"
                      >
                        ▲
                      </button>
                      <span className="w-6 text-center font-bold text-slate-200">
                        {item.sort_order ?? 0}
                      </span>
                      <button
                        type="button"
                        title="Move Down (Increase sort_order)"
                        onClick={() => handleOrderChange(item, 1)}
                        className="text-slate-400 hover:text-cyan-electric px-1"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 space-y-1">
                    <div>
                      <NdaBadge isConfidential={Boolean(item.is_confidential)} />
                    </div>
                    <div>
                      <VisibilityBadge visibility={item.repo_visibility} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <AdminButton
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(item)}
                      className="mr-2"
                    >
                      Edit
                    </AdminButton>
                    <AdminButton
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(item.id)}
                    >
                      Delete
                    </AdminButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProjectsTab;
