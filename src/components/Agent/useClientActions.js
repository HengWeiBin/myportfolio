import { useCallback } from 'react';

/**
 * Hook providing client-side action dispatchers:
 * - scroll_to: Smoothly scrolls to designated section (home, projects, skills, experience, contact).
 * - highlight_project: Applies neon glow styling and scrolls to matching project card.
 * - filter_skills: Sets active category or skill spotlight in technical arsenal.
 */
export function useClientActions({
  setHighlightedProject = () => {},
  setActiveSkillFilter = () => {},
} = {}) {
  const scrollTo = useCallback((sectionId) => {
    if (typeof window === 'undefined') return false;

    const normalizedId = String(sectionId || '').replace(/^#/, '').toLowerCase();
    
    // Alias mapping for flexible navigation
    const targetId = {
      hero: 'home',
      home: 'home',
      projects: 'projects',
      project: 'projects',
      skills: 'skills',
      skill: 'skills',
      experience: 'experience',
      contact: 'contact',
      credentials: 'certificates',
      certificates: 'certificates',
    }[normalizedId] || normalizedId;

    const element = document.getElementById(targetId);
    if (element) {
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return true;
    }
    return false;
  }, []);

  const highlightProject = useCallback((projectIdentifier) => {
    if (typeof window === 'undefined' || !projectIdentifier) return false;

    setHighlightedProject(projectIdentifier);

    // Attempt to locate matching card in DOM
    const safeTarget = String(projectIdentifier).trim();
    const element =
      document.getElementById(`project-${safeTarget}`) ||
      document.querySelector(`[data-project-title*="${safeTarget}"]`) ||
      document.querySelector(`[data-project-id="${safeTarget}"]`);

    if (element) {
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return true;
    } else {
      // Fallback: scroll to projects section
      scrollTo('projects');
      return true;
    }
  }, [setHighlightedProject, scrollTo]);

  const filterSkills = useCallback((categoryOrSkill) => {
    if (typeof window === 'undefined' || !categoryOrSkill) return false;

    setActiveSkillFilter(categoryOrSkill);
    scrollTo('skills');
    return true;
  }, [setActiveSkillFilter, scrollTo]);

  const openProject = useCallback((projectIdentifier) => {
    if (typeof window === 'undefined' || !projectIdentifier) return false;

    highlightProject(projectIdentifier);

    const safeTarget = String(projectIdentifier).trim();
    const element =
      document.getElementById(`project-${safeTarget}`) ||
      document.querySelector(`[data-project-title*="${safeTarget}"]`) ||
      document.querySelector(`[data-project-id="${safeTarget}"]`);

    const event = new CustomEvent('open-project', {
      bubbles: true,
      detail: { projectIdentifier: safeTarget, element }
    });
    window.dispatchEvent(event);

    if (element) {
      const linkEl = element.tagName === 'A' ? element : element.querySelector('a[href]');
      if (linkEl && linkEl.href && !linkEl.href.startsWith('javascript:')) {
        window.open(linkEl.href, '_blank', 'noopener,noreferrer');
        return true;
      }
      return true;
    }
    return false;
  }, [highlightProject]);

  const executeAction = useCallback((action, targetArg) => {
    let type = '';
    let target = '';

    if (typeof action === 'string') {
      type = action;
      target = targetArg;
    } else if (action && typeof action === 'object') {
      type = action.type;
      target = action.target;
    }

    switch (type) {
      case 'scroll_to':
        return scrollTo(target);
      case 'highlight_project':
        return highlightProject(target);
      case 'filter_skills':
        return filterSkills(target);
      case 'open_project':
      case 'openProject':
        return openProject(target);
      default:
        console.warn(`[useClientActions] Unknown action type: ${type}`);
        return false;
    }
  }, [scrollTo, highlightProject, filterSkills, openProject]);

  return {
    scrollTo,
    highlightProject,
    filterSkills,
    openProject,
    open_project: openProject,
    executeAction,
  };
}
