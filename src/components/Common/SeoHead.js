import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteMetadata } from '../../data/seoMetadata';

function updateMetaTag(attr, key, content) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function updateCanonical(url) {
  if (typeof document === 'undefined') return;
  const canonicals = document.querySelectorAll('link[rel="canonical"]');
  if (url) {
    if (canonicals.length === 0) {
      const el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      el.setAttribute('href', url);
      document.head.appendChild(el);
    } else {
      canonicals[0].setAttribute('href', url);
      for (let i = 1; i < canonicals.length; i++) {
        canonicals[i].remove();
      }
    }
  } else {
    for (const el of canonicals) {
      el.remove();
    }
  }
}

export const SeoHead = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const config = getRouteMetadata(location.pathname);
    if (!config) return;

    if (config.title) {
      document.title = config.title;
    }
    if (config.description) {
      updateMetaTag('name', 'description', config.description);
    }
    if (config.ogTitle) {
      updateMetaTag('property', 'og:title', config.ogTitle);
    }
    if (config.ogDescription) {
      updateMetaTag('property', 'og:description', config.ogDescription);
    }
    if (config.ogUrl) {
      updateMetaTag('property', 'og:url', config.ogUrl);
    }
    if (config.robots) {
      updateMetaTag('name', 'robots', config.robots);
    }
    updateCanonical(config.canonical);
  }, [location.pathname]);

  return null;
};

export default SeoHead;
