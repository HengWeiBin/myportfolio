import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Mission Control UI & 5-Section Layout', () => {
  test('renders terminal portfolio navigation with all 5 sections and archive link', async () => {
    render(<App />);

    expect(screen.getByText(/\[Home\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Featured Work\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Evolution\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Capabilities\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Credentials & Contact\]/i)).toBeInTheDocument();

    const archiveLinks = screen.getAllByRole('link', { name: /\[Archive\]/i });
    expect(archiveLinks.length).toBeGreaterThan(0);
  });

  test('renders all 5 narrative sections on the homepage', async () => {
    render(<App />);

    // 1. Hero Section
    expect(screen.getByText(/\$ view_projects\.sh/i)).toBeInTheDocument();
    expect(screen.getByText(/\$ cat resume\.txt/i)).toBeInTheDocument();

    // 2. Featured Work Section
    expect(screen.getByText(/Featured Projects/i)).toBeInTheDocument();

    // 3. System Evolution Section
    expect(screen.getByText(/System Evolution/i)).toBeInTheDocument();

    // 4. Capabilities & Stack Section
    expect(screen.getByText(/Capabilities & Stack/i)).toBeInTheDocument();

    // 5. Credentials & Contact Handshake
    expect(screen.getAllByText(/initiate_handshake\.sh/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/sh \.\/contact_me\.sh/i)).toBeInTheDocument();
  });

  test('navigates to /archive route and renders search and filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    const archiveLinks = screen.getAllByRole('link', { name: /\[Archive\]/i });
    await user.click(archiveLinks[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by keywords, algorithms/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /All Types/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Projects/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Credentials/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All Tiers/i })).toBeInTheDocument();
    expect(screen.getByText(/Return to Mission Control/i)).toBeInTheDocument();
  });
});

describe('Route Metadata & 404 Not Found (Seam 1)', () => {
  beforeEach(() => {
    // Reset document head elements before each test
    document.title = '';
    const metas = document.querySelectorAll('meta[name="description"], meta[name="robots"], meta[property="og:url"], meta[property="og:title"]');
    for (const m of metas) {
      m.remove();
    }
    const canonicals = document.querySelectorAll('link[rel="canonical"]');
    for (const c of canonicals) {
      c.remove();
    }
  });

  test('synchronizes document head metadata on homepage /', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(document.title).toBe('王偉斌 (Wayne) | AI Systems & Knowledge Engineer');
    });

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute('content')).toBe(
      '王偉斌 (Wayne / Heng Wei Bin) — AI Systems & Knowledge Engineer. Specializing in Agentic RAG architectures, LLM deployment, and ontology engineering to bridge complex domain knowledge with reliable AI solutions.'
    );

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink?.getAttribute('href')).toBe('https://waynemyportfolio.netlify.app/');

    const ogUrlMeta = document.querySelector('meta[property="og:url"]');
    expect(ogUrlMeta?.getAttribute('content')).toBe('https://waynemyportfolio.netlify.app/');

    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    expect(ogTitleMeta?.getAttribute('content')).toBe('王偉斌 (Wayne) | AI Systems & Knowledge Engineer');

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta?.getAttribute('content')).toBe('index, follow');
  });

  test('synchronizes document head metadata on /archive route', async () => {
    window.history.pushState({}, '', '/archive');
    render(<App />);

    await waitFor(() => {
      expect(document.title).toBe('Artifacts Archive | 王偉斌 (Wayne) — AI Systems & Knowledge Engineer');
    });

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute('content')).toBe(
      'Explore the engineering archive of Wayne (王偉斌), featuring Agentic RAG architectures, LLM deployment, ontology engineering, and AI systems artifacts.'
    );

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink?.getAttribute('href')).toBe('https://waynemyportfolio.netlify.app/archive');

    const ogUrlMeta = document.querySelector('meta[property="og:url"]');
    expect(ogUrlMeta?.getAttribute('content')).toBe('https://waynemyportfolio.netlify.app/archive');

    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    expect(ogTitleMeta?.getAttribute('content')).toBe('Artifacts Archive | 王偉斌 (Wayne) — AI Systems & Knowledge Engineer');

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta?.getAttribute('content')).toBe('index, follow');
  });

  test('sets noindex, nofollow and removes canonical tag on /admin routes', async () => {
    const existingCanonical = document.createElement('link');
    existingCanonical.setAttribute('rel', 'canonical');
    existingCanonical.setAttribute('href', 'https://waynemyportfolio.netlify.app/');
    document.head.appendChild(existingCanonical);

    window.history.pushState({}, '', '/admin/login');
    render(<App />);

    await waitFor(() => {
      expect(document.title).toBe("Admin Console | Wayne's Portfolio");
    });

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta?.getAttribute('content')).toBe('noindex, nofollow');

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink).toBeNull();
  });

  test('renders 404 Not Found view and removes canonical tag on unknown route', async () => {
    const existingCanonical = document.createElement('link');
    existingCanonical.setAttribute('rel', 'canonical');
    existingCanonical.setAttribute('href', 'https://waynemyportfolio.netlify.app/');
    document.head.appendChild(existingCanonical);

    window.history.pushState({}, '', '/non-existent-page-xyz123');
    render(<App />);

    await waitFor(() => {
      expect(document.title).toBe('404 Not Found | 王偉斌 (Wayne)');
    });

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta?.getAttribute('content')).toBe('noindex, nofollow');

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink).toBeNull();

    expect(screen.getByRole('heading', { level: 1, name: /404/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Mission Control/i })).toBeInTheDocument();
  });
});

