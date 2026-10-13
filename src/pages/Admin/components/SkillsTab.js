import React from 'react';
import { AdminButton } from './Shared';
import { AdminTableSkeleton } from '../../../components/Common/Loading';

/**
 * SkillsTab
 * Displays categorized skill entries and CRUD management.
 * Strictly under 250 LOC.
 */
const SkillsTab = ({
  data = [],
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-cyber-border">
        <div>
          <h2 className="text-lg font-mono font-bold text-cyan-electric tracking-wide flex items-center gap-2">
            <span>Skills Management</span>
            <span className="text-xs font-mono font-normal text-slate-400">({data.length})</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Manage technical proficiencies and capabilities categories
          </p>
        </div>
        <AdminButton onClick={onAdd} size="sm">
          + New Entry
        </AdminButton>
      </div>

      {loading ? (
        <AdminTableSkeleton />
      ) : data.length === 0 ? (
        <div className="p-8 text-center text-slate-400 border border-dashed border-cyber-border rounded-lg font-mono text-sm">
          No data found. Click "+ New Entry" to add some.
        </div>
      ) : (
        <div className="overflow-x-auto border border-cyber-border rounded-lg bg-cyber-dark/40 shadow-xl">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-cyber-border bg-cyber-panel/60 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold text-cyan-electric">Skill Name</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100 text-sm">{item.name}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyber-panel text-cyan-electric/80 border border-cyber-border">
                      {item.category}
                    </span>
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

export default SkillsTab;
