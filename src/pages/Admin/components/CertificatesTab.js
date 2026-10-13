import React, { useMemo } from 'react';
import { AdminButton, TierBadge } from './Shared';
import { AdminTableSkeleton } from '../../../components/Common/Loading';

/**
 * CertificatesTab
 * Displays certificate entries with instant tier switching, sorting controls,
 * category management, and CRUD actions. Strictly under 250 LOC.
 */
const CertificatesTab = ({
  data = [],
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onUpdateCertificate,
}) => {
  const sortedCertificates = useMemo(() => {
    return [...data].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  }, [data]);

  const handleTierChange = (cert, newTier) => {
    if (onUpdateCertificate) {
      onUpdateCertificate(cert.id, { ...cert, tier: newTier });
    }
  };

  const handleOrderChange = (cert, delta) => {
    if (onUpdateCertificate) {
      const currentOrder = Number(cert.sort_order) || 0;
      const nextOrder = Math.max(0, currentOrder + delta);
      onUpdateCertificate(cert.id, { ...cert, sort_order: nextOrder });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-cyber-border">
        <div>
          <h2 className="text-lg font-mono font-bold text-cyan-electric tracking-wide flex items-center gap-2">
            <span>Certificates Management</span>
            <span className="text-xs font-mono font-normal text-slate-400">({data.length})</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Organize credentials, categories, tier visibility, and priority order
          </p>
        </div>
        <AdminButton onClick={onAdd} size="sm">
          + New Entry
        </AdminButton>
      </div>

      {loading ? (
        <AdminTableSkeleton />
      ) : sortedCertificates.length === 0 ? (
        <div className="p-8 text-center text-slate-400 border border-dashed border-cyber-border rounded-lg font-mono text-sm">
          No data found. Click "+ New Entry" to add some.
        </div>
      ) : (
        <div className="overflow-x-auto border border-cyber-border rounded-lg bg-cyber-dark/40 shadow-xl">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-cyber-border bg-cyber-panel/60 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold text-cyan-electric">Title / Credential</th>
                <th className="py-3 px-3 font-semibold">Issuer / Date</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold">Tier (Instant Switch)</th>
                <th className="py-3 px-3 font-semibold text-center w-28">Sort Order</th>
                <th className="py-3 px-4 font-semibold text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {sortedCertificates.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100 text-sm">{item.title}</div>
                    {item.credential_id && (
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                        ID: {item.credential_id}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <div>{item.issuer || 'N/A'}</div>
                    <div className="text-slate-500 text-[11px]">{item.date || 'No Date'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-cyber-panel text-slate-300 border border-cyber-border">
                      {item.category || 'Certificate'}
                    </span>
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
                        title="Move Up"
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
                        title="Move Down"
                        onClick={() => handleOrderChange(item, 1)}
                        className="text-slate-400 hover:text-cyan-electric px-1"
                      >
                        ▼
                      </button>
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

export default CertificatesTab;
