import React, { useState, useMemo } from 'react';
import { FormInput, AdminButton } from '../Shared';

const TelemetryTable = ({ conversations = [], onExportDemo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter((c) => {
      const promptMatch = (c.prompt || '').toLowerCase().includes(term);
      const respMatch = (c.response || '').toLowerCase().includes(term);
      const sessMatch = (c.session_id || '').toLowerCase().includes(term);
      const toolsMatch = Array.isArray(c.tool_trace) &&
        c.tool_trace.some((t) => (t.tool || '').toLowerCase().includes(term));
      return promptMatch || respMatch || sessMatch || toolsMatch;
    });
  }, [conversations, searchTerm]);

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
            Anonymized Telemetry Logs
          </h3>
          <p className="text-xs font-mono text-slate-500">
            Showing {filteredConversations.length} of {conversations.length} captured traces
          </p>
        </div>
        <div className="w-full sm:w-72">
          <FormInput
            placeholder="Search prompts, responses, tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="!mb-0"
          />
        </div>
      </div>

      <div className="border border-cyber-border rounded-lg overflow-x-auto bg-cyber-dark/50">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-cyber-surface/80 text-slate-400 border-b border-cyber-border">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Prompt</th>
              <th className="py-2.5 px-3">Response Preview</th>
              <th className="py-2.5 px-3">Tool Calls</th>
              <th className="py-2.5 px-3">Latency</th>
              <th className="py-2.5 px-3">Tokens</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border/40 text-slate-300">
            {filteredConversations.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No conversation telemetry found matching current filter.
                </td>
              </tr>
            ) : (
              filteredConversations.map((item) => {
                const tools = Array.isArray(item.tool_trace) ? item.tool_trace : [];
                const isExpanded = expandedId === item.id;
                const formattedTime = item.created_at
                  ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '--:--:--';

                return (
                  <React.Fragment key={item.id || item.session_id}>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {formattedTime}
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-cyan-electric hover:underline truncate block text-left"
                          title={item.prompt}
                        >
                          {item.prompt || '(empty)'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-400">
                        {item.response || '(empty)'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {tools.length === 0 ? (
                            <span className="text-slate-600 text-[10px]">none</span>
                          ) : (
                            tools.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-500/30 text-[10px]"
                              >
                                {t.tool || 'tool'}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                        {item.latency_ms ? `${item.latency_ms}ms` : '--'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                        {item.tokens_used ? `${item.tokens_used} tok` : '--'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <AdminButton
                          size="sm"
                          variant="secondary"
                          onClick={() => onExportDemo(item)}
                          className="!text-[11px] !py-1 !px-2.5"
                        >
                          Export as Scripted Demo
                        </AdminButton>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-cyber-surface/40">
                        <td colSpan={7} className="p-4 space-y-2.5 text-xs font-mono">
                          <div>
                            <span className="text-cyan-electric font-bold">Session: </span>
                            <span className="text-slate-400">{item.session_id}</span>
                            <span className="text-slate-600 ml-3">IP Hash: {item.ip_hash?.slice(0, 12)}...</span>
                          </div>
                          <div>
                            <span className="text-cyan-electric font-bold">User Prompt:</span>
                            <p className="mt-1 p-2 bg-cyber-dark rounded text-slate-200 whitespace-pre-wrap">
                              {item.prompt}
                            </p>
                          </div>
                          <div>
                            <span className="text-cyan-electric font-bold">Streamed Response:</span>
                            <p className="mt-1 p-2 bg-cyber-dark rounded text-slate-200 whitespace-pre-wrap">
                              {item.response}
                            </p>
                          </div>
                          {tools.length > 0 && (
                            <div>
                              <span className="text-cyan-electric font-bold">Tool Execution Trace:</span>
                              <pre className="mt-1 p-2 bg-cyber-dark rounded text-slate-300 text-[11px] overflow-x-auto">
                                {JSON.stringify(tools, null, 2)}
                              </pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TelemetryTable;
