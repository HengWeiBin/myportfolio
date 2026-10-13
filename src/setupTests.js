import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock canvas 2D context for jsdom environment (used by LatentSpace visualization)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    canvas: { width: 1024, height: 768 },
  });
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
