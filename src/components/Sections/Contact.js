import React from 'react';
import { useProfile } from '../../context/ProfileContext';

const Contact = () => {
  const { profile } = useProfile();

  const handleContactClick = (e) => {
    if (profile?.email) {
      window.location.href = `mailto:${profile.email}?subject=Collaboration%20Inquiry`;
    } else {
      e.preventDefault();
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="contact" className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Header */}
        <div className="mb-8">
          <div className="text-xs font-mono text-cyan-electric tracking-widest uppercase mb-1">
            05 // TRANSMISSION HANDSHAKE
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 flex items-center justify-center gap-2">
            <span className="text-emerald-400">./</span>
            <span>initiate_handshake.sh</span>
          </h2>
        </div>

        {/* Narrative Description */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg font-sans text-slate-300 leading-relaxed mb-10">
          I am actively available for high-impact AI Systems, Knowledge Engineering, and Agentic AI roles.
          Whether you want to discuss novel neural architectures, evaluate production LLM scalability,
          or explore collaboration, my communications channels are open.
        </p>

        {/* Primary Command Button */}
        <div className="mb-12">
          <button
            type="button"
            onClick={handleContactClick}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-mono text-base font-bold bg-cyan-electric/15 text-cyan-electric border border-cyan-electric/50 hover:bg-cyan-electric/25 hover:shadow-[0_0_30px_rgba(0,240,255,0.35)] transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <span>$</span>
            <span>sh ./contact_me.sh</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Direct Channels Grid */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border max-w-xl mx-auto text-left font-mono text-xs sm:text-sm space-y-3">
          <div className="text-slate-500 pb-2 border-b border-cyber-border text-[11px] uppercase tracking-wider">
            &gt; AVAILABLE_COMMUNICATION_CHANNELS
          </div>

          {profile?.email && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">EMAIL:</span>
              <a
                href={`mailto:${profile.email}`}
                className="text-cyan-electric hover:underline"
              >
                {profile.email}
              </a>
            </div>
          )}

          {profile?.github && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">GITHUB:</span>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-electric hover:underline"
              >
                {profile.github.replace('https://github.com/', '@')}
              </a>
            </div>
          )}

          {profile?.linkedin && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">LINKEDIN:</span>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-electric hover:underline"
              >
                [Profile Connect]
              </a>
            </div>
          )}

          {profile?.resume_link && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">RESUME:</span>
              <a
                href={profile.resume_link}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:underline"
              >
                [View Resume PDF]
              </a>
            </div>
          )}
        </div>

        {/* Transmission End Marker */}
        <div className="mt-12 font-mono text-xs text-slate-500">
          &lt;!-- Transmission End // Connection Acknowledged --&gt;
        </div>
      </div>
    </section>
  );
};

export default Contact;
