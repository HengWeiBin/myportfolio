import React from 'react';
import TrainingLog from '../Hero/TrainingLog';
import { useProfile } from '../../context/ProfileContext';

const Hero = () => {
  const { profile } = useProfile();

  const title = profile?.title || "Machine Learning Engineer \n& AI Researcher.";
  const subtitle = profile?.bio || "Translating data into intelligence. Specializing in LLMs, Computer Vision, and scalable MLOps pipelines.";

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-[85vh] flex items-center justify-center relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Terminal Window Frame */}
        <div className="glass-panel-glow rounded-xl overflow-hidden shadow-2xl border border-cyber-border-bright transition-all">
          {/* Terminal Window Header Bar */}
          <header className="bg-cyber-surface/90 px-4 py-3 border-b border-cyber-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block" />
              <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                mission-control@node-01:~/workspace
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STATUS: READY
              </span>
              <span className="hidden md:inline text-slate-500">bash -- 80x24</span>
            </div>
          </header>

          {/* Terminal Window Content Body */}
          <div className="p-6 sm:p-10 font-mono">
            {/* Interactive Simulated ML Training Stream */}
            <TrainingLog />

            <div className="mt-8 space-y-4">
              <div className="inline-block text-xs font-mono tracking-wider text-cyan-electric bg-cyan-electric/10 px-3 py-1 rounded border border-cyan-electric/30">
                &gt; FOCUS: DEEP LEARNING // COMPUTER VISION // DISTRIBUTED MLOPS
              </div>

              {/* Title with Cyberpunk Gradient */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-mono tracking-tight text-slate-100 leading-tight">
                {title.split('\n').map((line, idx) => (
                  <span key={idx} className="block">
                    {idx === 0 ? (
                      line
                    ) : (
                      <span className="text-gradient-cyber">{line}</span>
                    )}
                  </span>
                ))}
              </h1>

              {/* Bio / Subtitle */}
              <p className="text-base sm:text-lg font-sans text-slate-400 max-w-2xl leading-relaxed pt-2">
                {subtitle}
              </p>

              {/* Mission Control Action CTAs */}
              <div className="flex flex-wrap gap-4 pt-6">
                <a
                  href="#projects"
                  onClick={(e) => scrollToSection(e, 'projects')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-semibold bg-cyan-electric/15 text-cyan-electric border border-cyan-electric/50 hover:bg-cyan-electric/25 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  $ view_projects.sh
                </a>

                <a
                  href={profile?.resume_link || "/104.pdf"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-medium bg-slate-800/60 text-slate-300 border border-cyber-border hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  $ cat resume.txt
                </a>

                <a
                  href="#contact"
                  onClick={(e) => scrollToSection(e, 'contact')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 hover:text-purple-200 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  $ initiate_handshake.sh
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
