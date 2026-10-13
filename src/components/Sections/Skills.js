import React, { useMemo } from 'react';
import { usePortfolio } from '../../context/ProfileContext';
import { Skeleton } from '../Common/Loading';

const Skills = () => {
  const { skills = [], loading } = usePortfolio();

  const skillsData = useMemo(() => {
    const grouped = (skills || []).reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill.name);
      return acc;
    }, {});

    return Object.keys(grouped).map(category => ({
      category,
      items: grouped[category]
    }));
  }, [skills]);

  return (
    <section id="skills" className="py-20 border-b border-cyber-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-14">
          <div className="text-xs font-mono text-cyan-electric tracking-widest uppercase mb-1">
            03 // TECHNICAL ARSENAL
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 flex items-center gap-2">
            <span className="text-amber-400">//</span>
            <span>Capabilities & Stack</span>
            <span className="text-slate-500 font-normal text-lg">_</span>
          </h2>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel p-6 rounded-xl border border-cyber-border space-y-4">
                <Skeleton width="40%" height="1.5rem" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(j => (
                    <Skeleton key={j} width="80px" height="1.5rem" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillsData.map((group) => (
              <div
                key={group.category}
                className="glass-panel p-6 sm:p-7 rounded-xl border border-cyber-border hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 shadow-lg group"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyber-border">
                  <h3 className="font-mono text-base font-bold text-cyan-electric flex items-center gap-2">
                    <span className="text-slate-500">&gt;</span>
                    {group.category}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    {group.items.length} modules
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <span
                      key={skill}
                      className="font-mono text-xs px-2.5 py-1 rounded bg-cyber-card text-slate-300 border border-cyber-border hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-default"
                    >
                      [{skill}]
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Skills;
