import React, { useMemo } from 'react';
import { usePortfolio } from '../../context/ProfileContext';
import { useVisualSync } from '../../context/VisualSyncContext';
import { useAgent } from '../Agent/AgentContext';
import { Skeleton } from '../Common/Loading';

const Skills = () => {
  const { skills = [], loading } = usePortfolio();
  const { highlightSkill, clearHighlight } = useVisualSync();
  const { activeSkillFilter, clearHighlights } = useAgent();

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
        <div className="mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-electric tracking-widest uppercase mb-1">
              03 // TECHNICAL ARSENAL
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 flex items-center gap-2">
              <span className="text-amber-400">//</span>
              <span>Capabilities & Stack</span>
              <span className="text-slate-500 font-normal text-lg">_</span>
            </h2>
          </div>

          {activeSkillFilter && (
            <div
              data-testid="skills-active-filter-badge"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-electric/15 border border-cyan-electric/50 text-cyan-electric font-mono text-xs shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <span>Spotlight: [{activeSkillFilter}]</span>
              <button
                onClick={clearHighlights}
                className="text-slate-400 hover:text-white ml-1 font-bold transition-colors"
                title="Clear Spotlight"
              >
                ✕
              </button>
            </div>
          )}
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
            {skillsData.map((group) => {
              const isCategorySelected = Boolean(
                activeSkillFilter &&
                (
                  group.category.toLowerCase().includes(activeSkillFilter.toLowerCase()) ||
                  activeSkillFilter.toLowerCase().includes(group.category.toLowerCase()) ||
                  group.items.some(s => s.toLowerCase().includes(activeSkillFilter.toLowerCase()))
                )
              );

              return (
                <div
                  key={group.category}
                  data-testid={`skill-group-${group.category}`}
                  data-active={isCategorySelected ? 'true' : 'false'}
                  className={`glass-panel p-6 sm:p-7 rounded-xl border transition-all duration-300 shadow-lg group ${
                    isCategorySelected
                      ? 'border-cyan-electric ring-2 ring-cyan-electric/70 shadow-[0_0_30px_rgba(0,240,255,0.4)] scale-[1.01]'
                      : 'border-cyber-border hover:border-cyan-500/40 hover:-translate-y-1'
                  }`}
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
                    {group.items.map((skill) => {
                      const isSkillSelected = Boolean(
                        activeSkillFilter &&
                        (
                          skill.toLowerCase().includes(activeSkillFilter.toLowerCase()) ||
                          activeSkillFilter.toLowerCase().includes(skill.toLowerCase()) ||
                          isCategorySelected
                        )
                      );

                      return (
                        <span
                          key={skill}
                          data-testid={`skill-chip-${skill}`}
                          data-skill={skill}
                          data-active={isSkillSelected ? 'true' : 'false'}
                          onMouseEnter={() => highlightSkill(skill, group.category)}
                          onMouseLeave={clearHighlight}
                          className={`font-mono text-xs px-2.5 py-1 rounded border transition-all cursor-pointer select-none ${
                            isSkillSelected
                              ? 'bg-cyan-electric/25 text-cyan-electric border-cyan-400 font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                              : 'bg-cyber-card text-slate-300 border-cyber-border hover:text-cyan-electric hover:border-cyan-400/50 hover:bg-cyan-500/10'
                          }`}
                        >
                          [{skill}]
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Skills;
