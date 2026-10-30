import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg p-4 font-mono text-slate-100">
      <div className="w-full max-w-2xl glass-panel-glow rounded-xl overflow-hidden shadow-2xl border border-cyber-border-bright">
        {/* Terminal Header Bar */}
        <header className="bg-cyber-surface/90 px-4 py-3 border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block" />
            <span className="text-xs font-mono text-slate-400 ml-2">
              mission-control@node-01:~/sys_err
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">STATUS: 404</span>
        </header>

        {/* Content Body */}
        <div className="p-8 sm:p-12 space-y-6">
          <div className="text-xs font-mono tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded inline-block border border-rose-500/30">
            &gt; ANOMALY DETECTED: DESTINATION_UNREACHABLE
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-slate-100 tracking-tight">
            404 <span className="text-rose-500">//</span> ROUTE_NOT_FOUND
          </h1>

          <p className="text-slate-400 font-sans text-base sm:text-lg leading-relaxed">
            The requested trajectory does not exist within the neural lattice. The coordinate link may be severed, classified, or relocated.
          </p>

          <div className="pt-4 border-t border-cyber-border/70 flex flex-wrap gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-sm font-semibold bg-cyan-electric/15 text-cyan-electric border border-cyan-electric/50 hover:bg-cyan-electric/25 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <span>$</span>
              <span>cd /home &amp;&amp; Return to Mission Control</span>
            </Link>
            <Link
              to="/archive"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-sm font-medium bg-slate-800/60 text-slate-300 border border-cyber-border hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <span>$</span>
              <span>ls /archive</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
