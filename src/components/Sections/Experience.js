import React from 'react';
import ReactMarkdown from 'react-markdown';
import { usePortfolio } from '../../context/ProfileContext';
import { Skeleton } from '../Common/Loading';

const Experience = () => {
  const { experience: experiences = [], loading } = usePortfolio();

  return (
    <section id="experience" className="py-20 border-b border-cyber-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-14">
          <div className="text-xs font-mono text-cyan-electric tracking-widest uppercase mb-1">
            02 // CHRONOLOGICAL LOG
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 flex items-center gap-2">
            <span className="text-emerald-400">&gt;</span>
            <span>System Evolution</span>
            <span className="text-slate-500 font-normal text-lg">// Experience & Research</span>
          </h2>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="pl-6 border-l-2 border-cyber-border space-y-12">
            {[1, 2].map(i => (
              <div key={i} className="space-y-3 relative">
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-cyan-400" />
                <Skeleton width="50%" height="1.5rem" />
                <Skeleton width="30%" height="1rem" />
                <Skeleton width="20%" height="0.8rem" />
                <Skeleton height="4rem" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-cyber-border space-y-12">
            {experiences.map((exp, index) => {
              const techList = exp.tech_stack
                ? (Array.isArray(exp.tech_stack) ? exp.tech_stack : String(exp.tech_stack).split(','))
                : [];

              return (
                <article
                  key={exp.id || index}
                  className="relative group transition-all duration-300"
                >
                  {/* Glowing Timeline Node */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-cyber-bg border-2 border-cyan-electric shadow-[0_0_10px_rgba(0,240,255,0.6)] group-hover:scale-125 transition-transform" />

                  {/* Experience Card */}
                  <div className="bg-cyber-card/60 border border-cyber-border rounded-xl p-6 sm:p-7 hover:border-cyan-500/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                      <h3 className="text-xl font-mono font-bold text-slate-100 group-hover:text-cyan-electric transition-colors">
                        {exp.role}
                      </h3>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-electric/10 px-2.5 py-1 rounded border border-cyan-electric/25 self-start sm:self-auto">
                        {exp.date_range}
                      </span>
                    </div>

                    <h4 className="text-sm font-sans font-medium text-purple-400 mb-4">
                      @ {exp.company}
                    </h4>

                    {/* Tech Stack Chips */}
                    {techList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {techList.map((tech, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyber-surface text-slate-300 border border-cyber-border"
                          >
                            [{String(tech).trim()}]
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Markdown Description */}
                    <div className="text-sm text-slate-300 font-sans leading-relaxed space-y-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-2 [&_code]:bg-cyber-surface [&_code]:text-cyan-electric [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono">
                      <ReactMarkdown>{exp.description}</ReactMarkdown>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Experience;
