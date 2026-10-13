import '@testing-library/jest-dom/vitest';

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
