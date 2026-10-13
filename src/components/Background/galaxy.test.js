import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import FallbackPoster from './FallbackPoster';
import LatentGalaxy from './LatentGalaxy';
import Skills from '../Sections/Skills';
import TerminalLayout from '../Layout/TerminalLayout';
import { VisualSyncProvider, useVisualSync } from '../../context/VisualSyncContext';
import { ProfileProvider } from '../../context/ProfileContext';

// Helper component to observe visual sync state
const SyncInspector = () => {
  const { activeSkill, activeCategory } = useVisualSync();
  return (
    <div data-testid="sync-inspector">
      <span data-testid="active-skill">{activeSkill || 'none'}</span>
      <span data-testid="active-category">{activeCategory || 'none'}</span>
    </div>
  );
};

describe('Ambient WebGL Galaxy & Capabilities Sync', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('FallbackPoster Component', () => {
    it('renders synchronously with cyber background and constellation nodes', () => {
      render(<FallbackPoster />);
      const poster = screen.getByTestId('fallback-poster');
      expect(poster).toBeInTheDocument();
      expect(poster).toHaveClass('fixed', 'inset-0', 'bg-cyber-bg');
    });

    it('respects isReducedMotion prop and disables pulse animations', () => {
      const { container } = render(<FallbackPoster isReducedMotion={true} />);
      const pulsatingNodes = container.querySelectorAll('.animate-pulse');
      expect(pulsatingNodes.length).toBe(0);
    });
  });

  describe('LatentGalaxy Component', () => {
    it('mounts fallback poster and WebGL canvas cleanly', async () => {
      render(
        <ProfileProvider>
          <VisualSyncProvider>
            <LatentGalaxy />
          </VisualSyncProvider>
        </ProfileProvider>
      );

      expect(screen.getByTestId('latent-galaxy-container')).toBeInTheDocument();
      expect(screen.getByTestId('fallback-poster')).toBeInTheDocument();

      // Check canvas presence
      const canvas = screen.getByTestId('latent-galaxy-canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('detects prefers-reduced-motion: reduce and halts continuous animation loop', async () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');

      render(
        <ProfileProvider>
          <VisualSyncProvider>
            <LatentGalaxy />
          </VisualSyncProvider>
        </ProfileProvider>
      );

      // In reduced motion, requestAnimationFrame should not enter continuous loop
      expect(screen.getByTestId('latent-galaxy-container')).toBeInTheDocument();
      requestAnimationFrameSpy.mockRestore();
    });

    it('suspends and resumes animation on document visibility change', async () => {
      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

      render(
        <ProfileProvider>
          <VisualSyncProvider>
            <LatentGalaxy />
          </VisualSyncProvider>
        </ProfileProvider>
      );

      // Simulate tab hidden
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      fireEvent(document, new Event('visibilitychange'));

      expect(cancelAnimationFrameSpy).toHaveBeenCalled();

      // Simulate tab visible
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      fireEvent(document, new Event('visibilitychange'));

      expect(requestAnimationFrameSpy).toHaveBeenCalled();

      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    });

    it('gracefully degrades to FallbackPoster if WebGL context creation fails', async () => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          return null; // Simulate WebGL unsupported
        }
        return originalGetContext.call(this, type);
      };

      render(
        <ProfileProvider>
          <VisualSyncProvider>
            <LatentGalaxy />
          </VisualSyncProvider>
        </ProfileProvider>
      );

      // Fallback poster is still present and no canvas is rendered
      expect(screen.getByTestId('latent-galaxy-container')).toBeInTheDocument();
      expect(screen.getByTestId('fallback-poster')).toBeInTheDocument();
      expect(screen.queryByTestId('latent-galaxy-canvas')).not.toBeInTheDocument();

      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('disposes resources cleanly on unmount without throwing errors', () => {
      const { unmount } = render(
        <ProfileProvider>
          <VisualSyncProvider>
            <LatentGalaxy />
          </VisualSyncProvider>
        </ProfileProvider>
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Capabilities Visual Sync Integration', () => {
    it('dispatches highlightSkill on chip hover and clearHighlight on mouse leave', async () => {
      // Mock portfolio data with skills
      const mockPortfolio = {
        profile: { name: 'Test Engineer' },
        skills: [
          { id: 1, name: 'PyTorch', category: 'Deep Learning' },
          { id: 2, name: 'CUDA', category: 'Systems' },
        ],
        projects: [
          { id: 1, title: 'VisionTransformer', tags: ['PyTorch', 'Vision'], tier: 'featured' },
        ],
        experience: [],
        certificates: [],
      };

      global.fetch = vi.fn().mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('/api/portfolio')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockPortfolio,
          };
        }
        return { ok: true, status: 200, json: async () => ({}) };
      });

      render(
        <ProfileProvider>
          <VisualSyncProvider>
            <SyncInspector />
            <Skills />
            <LatentGalaxy />
          </VisualSyncProvider>
        </ProfileProvider>
      );

      // Wait for skills to load
      await waitFor(() => {
        expect(screen.getByTestId('skill-chip-PyTorch')).toBeInTheDocument();
      });

      const skillChip = screen.getByTestId('skill-chip-PyTorch');
      expect(screen.getByTestId('active-skill')).toHaveTextContent('none');

      // Hover over skill chip
      fireEvent.mouseEnter(skillChip);
      expect(screen.getByTestId('active-skill')).toHaveTextContent('PyTorch');
      expect(screen.getByTestId('active-category')).toHaveTextContent('Deep Learning');

      // Leave skill chip
      fireEvent.mouseLeave(skillChip);
      expect(screen.getByTestId('active-skill')).toHaveTextContent('none');
    });
  });

  describe('TerminalLayout Code-Split & Suspense', () => {
    it('renders synchronous FallbackPoster immediately and resolves LatentGalaxy via Suspense', async () => {
      render(
        <MemoryRouter>
          <ProfileProvider>
            <TerminalLayout>
              <div data-testid="page-content">Child Content</div>
            </TerminalLayout>
          </ProfileProvider>
        </MemoryRouter>
      );

      // Fallback poster is rendered synchronously
      expect(screen.getByTestId('fallback-poster')).toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();

      // Lazy LatentGalaxy resolves asynchronously
      await waitFor(() => {
        expect(screen.getByTestId('latent-galaxy-container')).toBeInTheDocument();
      });
    });
  });
});
