import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const buildDir = path.join(rootDir, 'build');

describe('Static Crawlability & Deployment Contracts (Seam 2 - Slice 1 & 2)', () => {
  it('ensures resume.pdf is present and legacy 104.pdf is removed', () => {
    const resumePath = path.join(publicDir, 'resume.pdf');
    const legacyPath = path.join(publicDir, '104.pdf');

    expect(fs.existsSync(resumePath), 'public/resume.pdf must exist').toBe(true);
    expect(fs.statSync(resumePath).size).toBeGreaterThan(1000);
    expect(fs.existsSync(legacyPath), 'public/104.pdf must be removed').toBe(false);
  });

  it('ensures public/sitemap.xml is valid and indexes canonical routes', () => {
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    expect(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist').toBe(true);

    const content = fs.readFileSync(sitemapPath, 'utf8');
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<loc>https://waynemyportfolio.netlify.app/</loc>');
    expect(content).toContain('<loc>https://waynemyportfolio.netlify.app/archive</loc>');
  });

  it('ensures public/robots.txt allows root and blocks admin and api endpoints', () => {
    const robotsPath = path.join(publicDir, 'robots.txt');
    expect(fs.existsSync(robotsPath), 'public/robots.txt must exist').toBe(true);

    const content = fs.readFileSync(robotsPath, 'utf8');
    expect(content).toMatch(/Allow:\s+\//);
    expect(content).toMatch(/Disallow:\s+\/admin/);
    expect(content).toMatch(/Disallow:\s+\/api\//);
    expect(content).toContain('Sitemap: https://waynemyportfolio.netlify.app/sitemap.xml');
  });

  it('ensures public/_headers defines caching for assets and noindex for admin', () => {
    const headersPath = path.join(publicDir, '_headers');
    expect(fs.existsSync(headersPath), 'public/_headers must exist').toBe(true);

    const content = fs.readFileSync(headersPath, 'utf8');
    expect(content).toContain('/assets/*');
    expect(content).toContain('Cache-Control: public, max-age=31536000, immutable');
    expect(content).toContain('/admin/*');
    expect(content).toContain('X-Robots-Tag: noindex, nofollow');
  });

  it('ensures netlify.toml configures matching headers and 301 resume redirect', () => {
    const tomlPath = path.join(rootDir, 'netlify.toml');
    const content = fs.readFileSync(tomlPath, 'utf8');

    expect(content).toContain('from = "/104.pdf"');
    expect(content).toContain('to = "/resume.pdf"');
    expect(content).toContain('status = 301');

    expect(content).toContain('for = "/assets/*"');
    expect(content).toContain('Cache-Control = "public, max-age=31536000, immutable"');
    expect(content).toContain('for = "/admin/*"');
    expect(content).toContain('X-Robots-Tag = "noindex, nofollow"');
  });

  it('ensures public/_redirects redirects 104.pdf, eliminates wildcard rewrite, and preserves /admin/* and /api/*', () => {
    const redirectsPath = path.join(publicDir, '_redirects');
    expect(fs.existsSync(redirectsPath), 'public/_redirects must exist').toBe(true);

    const content = fs.readFileSync(redirectsPath, 'utf8');
    expect(content).toMatch(/\/104\.pdf\s+\/resume\.pdf\s+301/);
    expect(content).toMatch(/\/admin\/\*\s+\/index\.html\s+200/);
    expect(content).toMatch(/\/api\/\*\s+\/\.netlify\/functions\/:splat\s+200/);

    // Wildcard catch-all rewrite /* /index.html 200 must be removed to prevent soft-404s
    const lines = content.split('\n').map(l => l.trim());
    const hasSoft404CatchAll = lines.some(line => line.startsWith('/*') && line.includes('/index.html') && line.includes('200'));
    expect(hasSoft404CatchAll, 'Catch-all /* /index.html 200 must be removed to eliminate soft-404s').toBe(false);
  });

  it('ensures index.html template satisfies metadata, font, and JSON-LD contracts', () => {
    const htmlPath = path.join(rootDir, 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    // Language and single viewport
    expect(content).toContain('<html lang="zh-TW">');
    const viewportMatches = content.match(/<meta[^>]*name=["']viewport["'][^>]*>/gi) || [];
    expect(viewportMatches.length).toBe(1);
    expect(viewportMatches[0]).toContain('width=device-width, initial-scale=1.0');

    // Title and Meta tags
    expect(content).toMatch(/<title>王偉斌 \(Wayne\) \| AI Systems &(amp;)? Knowledge Engineer<\/title>/);
    expect(content).toContain('name="description"');
    expect(content).toContain('name="robots" content="index, follow"');
    expect(content).toContain('rel="canonical" href="https://waynemyportfolio.netlify.app/"');

    // Open Graph & Twitter
    expect(content).toContain('property="og:type" content="profile"');
    expect(content).toContain('property="og:url" content="https://waynemyportfolio.netlify.app/"');
    expect(content).toContain('property="og:image" content="https://waynemyportfolio.netlify.app/img/websiteThumbnail.jpg"');
    expect(content).toContain('property="og:image:width" content="1200"');
    expect(content).toContain('property="og:image:height" content="627"');
    expect(content).toContain('name="twitter:card" content="summary_large_image"');

    // Fonts: Fira Code & Inter present, unused removed
    expect(content).toContain('family=Fira+Code');
    expect(content).toContain('family=Inter');
    expect(content).not.toContain('family=Amiri');
    expect(content).not.toContain('family=Noto+Sans+TC');
    expect(content).not.toContain('family=Playfair+Display');

    // JSON-LD Schema
    expect(content).toContain('application/ld+json');
    expect(content).toContain('https://schema.org');
    expect(content).toContain('"@type": "WebSite"');
    expect(content).toContain('"@type": "ProfilePage"');
    expect(content).toContain('"@type": "Person"');
    expect(content).toContain('"name": "王偉斌"');
    expect(content).toContain('"jobTitle": "AI Systems & Knowledge Engineer"');
    expect(content).toContain('"worksFor"');
    expect(content).toContain('"ASE Global"');
    expect(content).toContain('"alumniOf"');
    expect(content).toContain('國立臺北科技大學');

    // Initial semantic static fallback inside <div id="root">
    const rootBlock = content.match(/<div id="root">([\s\S]*?)<\/div>/i);
    expect(rootBlock, '#root container must exist in index.html').toBeTruthy();
    expect(rootBlock[1].trim().length).toBeGreaterThan(50);
    expect(rootBlock[1]).toContain('王偉斌 (Wayne)');
    expect(rootBlock[1]).toContain('/archive');
    expect(rootBlock[1]).toContain('/resume.pdf');
  });
});

describe('Static Prerendering Artifacts Contract (Seam 2 - Slice 3)', () => {
  it('verifies prerendered build/index.html, build/archive/index.html, and build/404.html', () => {
    // Only verify if build directory exists
    if (!fs.existsSync(buildDir)) {
      return;
    }

    const homeHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
    expect(homeHtml).toMatch(/<title>王偉斌 \(Wayne\) \| AI Systems &(amp;)? Knowledge Engineer<\/title>/);
    expect(homeHtml).toContain('rel="canonical" href="https://waynemyportfolio.netlify.app/"');
    expect(homeHtml).toContain('id="root"');
    expect(homeHtml).toContain('王偉斌 (Wayne)');

    const archiveHtml = fs.readFileSync(path.join(buildDir, 'archive', 'index.html'), 'utf8');
    expect(archiveHtml).toMatch(/<title>Artifacts Archive \| 王偉斌 \(Wayne\) — AI Systems &(amp;)? Knowledge Engineer<\/title>/);
    expect(archiveHtml).toContain('rel="canonical" href="https://waynemyportfolio.netlify.app/archive"');
    expect(archiveHtml).toContain('id="root"');
    expect(archiveHtml).toContain('Artifacts Archive');

    const notFoundHtml = fs.readFileSync(path.join(buildDir, '404.html'), 'utf8');
    expect(notFoundHtml).toMatch(/<title>404 Not Found \| 王偉斌 \(Wayne\)<\/title>/);
    expect(notFoundHtml).toContain('name="robots" content="noindex, nofollow"');
    expect(notFoundHtml).not.toContain('rel="canonical"');
    expect(notFoundHtml).toContain('404');
    expect(notFoundHtml).toContain('id="root"');
  });
});
