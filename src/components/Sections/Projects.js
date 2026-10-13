import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../../context/ProfileContext';
import NeuralArch from '../Visualizations/NeuralArch';
import CodeBlock from '../Visualizations/CodeBlock';
import ResultViz from '../Visualizations/ResultViz';
import { Skeleton } from '../Common/Loading';

const PROJECT_VISUALS = {
  'CenterFusionDetect3D': 'ResultViz',
  'StudentsRegistrationSystem': 'CodeBlock',
  'RadarCameraFusion': 'NeuralArch',
};

const Projects = () => {
  const { projects = [], loading } = usePortfolio();

  // Highlight featured projects first, followed by others, excluding archived items if featured exist
  const featuredProjects = React.useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    const featured = projects.filter(p => (p.tier || '').toLowerCase() === 'featured');
    if (featured.length > 0) {
      // If we have explicit featured items, show featured plus standard, prioritized
      const standard = projects.filter(p => (p.tier || '').toLowerCase() === 'standard');
      return [...featured, ...standard];
    }
    // Fallback: show all projects
    return projects;
  }, [projects]);

  const renderVisual = (project) => {
    const visualType = project.visual_type && project.visual_type !== 'image'
      ? project.visual_type
      : (PROJECT_VISUALS[project.title] || Object.keys(PROJECT_VISUALS).find(k => project.title?.includes(k)) ? PROJECT_VISUALS[Object.keys(PROJECT_VISUALS).find(k => project.title?.includes(k))] : null);

    if (visualType === 'NeuralArch') return <NeuralArch />;
    if (visualType === 'CodeBlock') {
      return (
        <CodeBlock
          code={`# Core Algorithm: Sensor Fusion\ndef fuse_sensors(radar, camera):\n    """\n    Fuse radar point clouds with\n    camera image features.\n    """\n    return kalman_filter(radar, camera)`}
          language="python"
        />
      );
    }
    if (visualType === 'ResultViz') {
      return <ResultViz label="Pedestrian" confidence="0.92" image={project.image_url} />;
    }

    if (project.image_url) {
      return (
        <img
          src={project.image_url}
          alt={project.title}
          loading="lazy"
          className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity duration-300"
        />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0d1117] p-2">
        <CodeBlock
          language="bash"
          code={`> locating_assets...\n> status: ok\n> architecture: multi-head attention`}
        />
      </div>
    );
  };

  return (
    <section id="projects" className="py-20 border-b border-cyber-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-electric tracking-widest uppercase mb-1">
              01 // MISSION ARTIFACTS
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 flex items-center gap-2">
              <span className="text-slate-500">/*</span>
              <span>Featured Projects</span>
              <span className="text-slate-500">*/</span>
            </h2>
          </div>

          <Link
            to="/archive"
            className="text-xs sm:text-sm font-mono text-cyan-electric hover:text-cyan-300 flex items-center gap-1.5 border border-cyan-electric/30 bg-cyan-electric/10 px-3 py-1.5 rounded transition-all hover:bg-cyan-electric/20"
          >
            <span>View All Archives & Foundation</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-12">
            {[1, 2].map(i => (
              <div
                key={i}
                className="flex flex-col md:flex-row bg-cyber-card/60 border border-cyber-border rounded-lg overflow-hidden min-h-[380px]"
              >
                <div className="flex-1 bg-cyber-surface/60 min-h-[250px] animate-pulse" />
                <div className="flex-1 p-6 sm:p-8 space-y-4">
                  <Skeleton width="60%" height="2rem" />
                  <Skeleton width="35%" height="1rem" />
                  <Skeleton height="5rem" />
                  <Skeleton width="40%" height="1.5rem" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {featuredProjects.map((project) => {
              const isFeaturedTier = (project.tier || '').toLowerCase() === 'featured';

              return (
                <article
                  key={project.id || project.title}
                  className={`flex flex-col md:flex-row bg-cyber-card/70 border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.12)] ${
                    isFeaturedTier
                      ? 'border-cyan-500/40 hover:border-cyan-electric'
                      : 'border-cyber-border hover:border-slate-500'
                  }`}
                >
                  {/* Left: Interactive Visual Simulation Area */}
                  <div className="flex-1 md:w-5/12 bg-black min-h-[260px] md:min-h-[380px] relative overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-cyber-border">
                    {renderVisual(project)}
                  </div>

                  {/* Right: Technical Specifications & Narrative */}
                  <div className="flex-1 md:w-7/12 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      {/* Tier Badge & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          {isFeaturedTier && (
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/40">
                              ★ FEATURED
                            </span>
                          )}
                          <span className="text-xs font-mono text-amber-400">
                            [{project.date_start || '2021'} - {project.date_end || 'PRESENT'}]
                          </span>
                        </div>

                        {project.repo_visibility && (
                          <span className="text-[11px] font-mono text-slate-500">
                            visibility: {project.repo_visibility}
                          </span>
                        )}
                      </div>

                      {/* Project Title */}
                      <h3 className="text-xl sm:text-2xl font-mono font-bold text-slate-100 mb-3 hover:text-cyan-electric transition-colors">
                        {project.title}
                      </h3>

                      {/* Metric Chips */}
                      {project.metrics && typeof project.metrics === 'object' && Object.keys(project.metrics).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Object.entries(project.metrics).map(([key, val]) => (
                            <span
                              key={key}
                              className="font-mono text-xs px-2.5 py-1 rounded-md bg-cyan-electric/10 border border-cyan-electric/30 text-cyan-electric flex items-center gap-1.5"
                            >
                              <span className="text-slate-400 uppercase text-[10px]">{key}:</span>
                              <span className="font-bold">{String(val)}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tags / Tech Chips */}
                      {project.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(Array.isArray(project.tags) ? project.tags : String(project.tags).split(',')).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyber-panel text-slate-300 border border-cyber-border"
                            >
                              #{String(tag).trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Markdown Narrative */}
                      <div className="text-sm font-sans text-slate-300 leading-relaxed mb-6 space-y-2 max-h-48 overflow-y-auto pr-2">
                        <ReactMarkdown>{project.description}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Action Links & NDA Safeguards */}
                    <div className="pt-4 border-t border-cyber-border/60 flex items-center justify-between font-mono text-sm">
                      {project.is_confidential ? (
                        <div className="flex items-center gap-2 text-rose-400 text-xs sm:text-sm bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded">
                          <span>🔒</span>
                          <span className="font-semibold">[NDA Protected / Client Confidential]</span>
                        </div>
                      ) : (
                        project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-cyan-electric hover:text-cyan-300 hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          >
                            <span>[View Source / Demo]</span>
                            <span>&rarr;</span>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom Call to Action for Archive */}
        <div className="mt-16 text-center">
          <Link
            to="/archive"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-sm font-semibold bg-cyber-card border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-600/20 hover:border-purple-400 transition-all shadow-lg"
          >
            <span>&gt; browse_complete_archive.exe ({projects.length} artifacts)</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Projects;
