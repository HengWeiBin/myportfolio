export const SITE_URL = 'https://waynemyportfolio.netlify.app';

export const ROUTE_SEO_METADATA = {
  '/': {
    title: '王偉斌 (Wayne) | AI Systems & Knowledge Engineer',
    description:
      '王偉斌 (Wayne / Heng Wei Bin) — AI Systems & Knowledge Engineer. Specializing in Agentic RAG architectures, LLM deployment, and ontology engineering to bridge complex domain knowledge with reliable AI solutions.',
    canonical: `${SITE_URL}/`,
    ogTitle: '王偉斌 (Wayne) | AI Systems & Knowledge Engineer',
    ogDescription:
      '王偉斌 (Wayne / Heng Wei Bin) — AI Systems & Knowledge Engineer. Specializing in Agentic RAG architectures, LLM deployment, and ontology engineering to bridge complex domain knowledge with reliable AI solutions.',
    ogUrl: `${SITE_URL}/`,
    robots: 'index, follow',
  },
  '/archive': {
    title: 'Artifacts Archive | 王偉斌 (Wayne) — AI Systems & Knowledge Engineer',
    description:
      'Explore the engineering archive of Wayne (王偉斌), featuring Agentic RAG architectures, LLM deployment, ontology engineering, and AI systems artifacts.',
    canonical: `${SITE_URL}/archive`,
    ogTitle: 'Artifacts Archive | 王偉斌 (Wayne) — AI Systems & Knowledge Engineer',
    ogDescription:
      'Explore the engineering archive of Wayne (王偉斌), featuring Agentic RAG architectures, LLM deployment, ontology engineering, and AI systems artifacts.',
    ogUrl: `${SITE_URL}/archive`,
    twitterTitle: 'Artifacts Archive | 王偉斌 (Wayne) — AI Systems & Knowledge Engineer',
    twitterDescription:
      'Explore the engineering archive of Wayne (王偉斌), featuring Agentic RAG architectures, LLM deployment, ontology engineering, and AI systems artifacts.',
    robots: 'index, follow',
  },
  admin: {
    title: "Admin Console | Wayne's Portfolio",
    robots: 'noindex, nofollow',
    canonical: null,
  },
  notFound: {
    title: '404 Not Found | 王偉斌 (Wayne)',
    robots: 'noindex, nofollow',
    canonical: null,
  },
};

/**
 * Returns the SEO metadata config object for a given route pathname.
 * @param {string} pathname
 */
export function getRouteMetadata(pathname) {
  if (pathname === '/') return ROUTE_SEO_METADATA['/'];
  if (pathname === '/archive') return ROUTE_SEO_METADATA['/archive'];
  if (pathname.startsWith('/admin')) return ROUTE_SEO_METADATA.admin;
  return ROUTE_SEO_METADATA.notFound;
}

export default ROUTE_SEO_METADATA;
