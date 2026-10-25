import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';

const NAV_ITEMS = [
  { label: '[Home]', id: 'home', path: '/' },
  { label: '[Featured Work]', id: 'projects', path: '/#projects' },
  { label: '[Evolution]', id: 'experience', path: '/#experience' },
  { label: '[Capabilities]', id: 'skills', path: '/#skills' },
  { label: '[Credentials & Contact]', id: 'contact', path: '/#contact' },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const isHome = location.pathname === '/';
  const isArchive = location.pathname === '/archive';
  const promptName = profile?.name ? profile.name.toLowerCase().replace(/\s/g, '') : 'hengweibin';

  // Smooth scroll handler
  const handleNavClick = (e, item) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (item.id === 'home') {
      if (isHome) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveSection('home');
      } else {
        navigate('/');
      }
      return;
    }

    if (!isHome) {
      navigate(`/#${item.id}`);
      return;
    }

    const element = document.getElementById(item.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(item.id);
    }
  };

  // Close mobile drawer on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update active section based on scroll position on home page
  useEffect(() => {
    if (!isHome) return;
    if (typeof window === 'undefined' || !window.IntersectionObserver) return;

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = ['home', 'projects', 'experience', 'skills', 'contact']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    sections.forEach(sec => {
      observer.observe(sec);
    });

    return () => {
      sections.forEach(sec => {
        observer.unobserve(sec);
      });
    };
  }, [isHome]);

  return (
    <header className="sticky top-0 z-50 w-full bg-cyber-bg/90 backdrop-blur-md border-b border-cyber-border font-mono transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Terminal Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            onClick={() => isHome && window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-emerald-400 font-bold text-sm sm:text-base hover:text-cyan-electric transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded px-1"
            aria-label="Portfolio Home"
          >
            &gt; root@{promptName}:~$
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = isHome && activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`/#${item.id}`}
                onClick={(e) => handleNavClick(e, item)}
                className={`text-xs xl:text-sm px-2.5 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  isActive
                    ? 'text-cyan-electric font-semibold bg-cyan-electric/10 border-b border-cyan-electric'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                {item.label}
              </a>
            );
          })}

          {/* Dedicated /archive Route Link */}
          <Link
            to="/archive"
            className={`text-xs xl:text-sm px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-purple-400 ${
              isArchive
                ? 'text-purple-400 font-semibold bg-purple-500/10 border-b border-purple-400'
                : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/5 border border-purple-500/20'
            }`}
          >
            [Archive]
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/archive"
            className="text-xs px-2 py-1 rounded text-purple-300 border border-purple-500/30 bg-purple-500/10"
          >
            [Archive]
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-cyber-surface border border-cyber-border focus:outline-none focus:ring-2 focus:ring-cyan-400"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t border-cyber-border bg-cyber-card/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-4 duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyber-border text-xs text-slate-400 font-mono">
            <span>&gt; NAVIGATION</span>
          </div>

          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`/#${item.id}`}
                onClick={(e) => handleNavClick(e, item)}
                className={`text-sm px-3 py-2 rounded font-mono transition-colors ${
                  isHome && activeSection === item.id
                    ? 'text-cyan-electric bg-cyan-electric/10 font-bold border-l-2 border-cyan-electric'
                    : 'text-slate-300 hover:text-white hover:bg-cyber-surface'
                }`}
              >
                {item.label}
              </a>
            ))}

            <Link
              to="/archive"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm px-3 py-2 rounded font-mono transition-colors mt-2 ${
                isArchive
                  ? 'text-purple-400 bg-purple-500/10 font-bold border-l-2 border-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-500/10 border border-purple-500/30'
              }`}
            >
              [Archive Repository]
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
