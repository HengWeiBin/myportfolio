import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock canvas 2D and WebGL context for jsdom environment (used by LatentGalaxy visualization)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === '2d') {
      return {
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        createRadialGradient: () => ({
          addColorStop: () => {},
        }),
        canvas: { width: 1024, height: 768 },
      };
    }
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      return {
        canvas: this,
        getExtension: () => null,
        getParameter: () => 16,
        isContextLost: () => false,
      };
    }
    return null;
  };
}

// Mock Three.js WebGLRenderer in jsdom environment to prevent headless GL driver exceptions
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      render: vi.fn(),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      dispose: vi.fn(),
      forceContextLoss: vi.fn(),
      domElement: typeof document !== 'undefined' ? document.createElement('canvas') : {},
    })),
  };
});

// Mock matchMedia in jsdom environment
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock IntersectionObserver in jsdom environment
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Default mock for /api/portfolio in jsdom tests
const defaultPortfolio = {
  profile: {
    id: 1,
    name: 'Wayne Heng',
    title: 'Machine Learning Engineer',
    bio: 'ML Engineer specializing in perception systems.',
    email: 'wayne@example.com'
  },
  skills: [],
  projects: [],
  experience: [],
  certificates: []
};

const originalFetch = global.fetch;
global.fetch = vi.fn(async (url, options) => {
  if (typeof url === 'string' && url.includes('/api/portfolio')) {
    return {
      ok: true,
      status: 200,
      json: async () => defaultPortfolio
    };
  }
  if (typeof url === 'string' && url.includes('/api/auth/session')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ authenticated: false })
    };
  }
  if (originalFetch) {
    return originalFetch(url, options);
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({})
  };
});
