import React, { useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { VisualSyncProvider } from '../../context/VisualSyncContext';
import FallbackPoster from '../Background/FallbackPoster';
import Navbar from './Navbar';

const LatentGalaxy = React.lazy(() => import('../Background/LatentGalaxy'));

const Footer = () => {
  const { profile } = useProfile();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-cyber-border bg-cyber-dark/80 backdrop-blur-md py-8 mt-16 font-mono text-xs sm:text-sm text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="text-emerald-400">
          $ echo "Transmission ended. Awaiting next directive."
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-slate-300">
          {profile?.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-electric transition-colors underline decoration-slate-600 hover:decoration-cyan-electric"
            >
              [GitHub]
            </a>
          )}
          {profile?.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-electric transition-colors underline decoration-slate-600 hover:decoration-cyan-electric"
            >
              [LinkedIn]
            </a>
          )}
          {profile?.email && (
            <a
              href={`mailto:${profile.email}`}
              className="hover:text-cyan-electric transition-colors underline decoration-slate-600 hover:decoration-cyan-electric"
            >
              [Email: {profile.email}]
            </a>
          )}
          {profile?.resume_link && (
            <a
              href={profile.resume_link}
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-400 transition-colors underline decoration-slate-600 hover:decoration-purple-400"
            >
              [Resume PDF]
            </a>
          )}
        </div>

        <div className="text-slate-500 text-xs pt-2">
          Built with React 19 & Tailwind CSS v4. © {year} {profile?.name || 'Heng Wei Bin'}.
        </div>
      </div>
    </footer>
  );
};

export const TerminalLayout = ({ children }) => {
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.name) {
      document.title = `${profile.name} | Mission Control`;
    }
  }, [profile]);

  return (
    <VisualSyncProvider>
      <div className="flex flex-col min-h-screen bg-cyber-bg text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300 relative">
        <FallbackPoster />
        <React.Suspense fallback={null}>
          <LatentGalaxy />
        </React.Suspense>
        <Navbar />
        <main className="flex-1 w-full" id="main-content">
          {children}
        </main>
        <Footer />
      </div>
    </VisualSyncProvider>
  );
};

export default TerminalLayout;
