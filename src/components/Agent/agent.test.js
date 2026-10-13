import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFallbackTrace, FALLBACK_TRACES } from './fallbackTraces';
import { useClientActions } from './useClientActions';
import { AgentProvider, useAgent } from './AgentContext';
import HeroTerminal from './HeroTerminal';
import FloatingDock from './FloatingDock';

// Mock framer-motion in jsdom so AnimatePresence doesn't hold exit animations
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('Fallback Traces & Bilingual Grounding', () => {
  it('correctly maps English project query to projects_en trace', () => {
    const trace = getFallbackTrace('Can you tell me about your projects?');
    expect(trace.id).toBe('projects_en');
    expect(trace.lang).toBe('en');
    expect(trace.uiActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'scroll_to', target: 'projects' }),
        expect.objectContaining({ type: 'highlight_project', target: 'CenterFusionDetect3D' })
      ])
    );
  });

  it('correctly maps Traditional Chinese project query to projects_zh trace', () => {
    const trace = getFallbackTrace('可以介紹一下你的核心專案嗎？');
    expect(trace.id).toBe('projects_zh');
    expect(trace.lang).toBe('zh');
    expect(trace.uiActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'scroll_to', target: 'projects' }),
        expect.objectContaining({ type: 'highlight_project', target: 'CenterFusionDetect3D' })
      ])
    );
  });

  it('correctly maps skills query in English and Traditional Chinese', () => {
    const traceEn = getFallbackTrace('What are your skills and tech stack?');
    expect(traceEn.id).toBe('skills_en');
    expect(traceEn.uiActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'scroll_to', target: 'skills' }),
        expect.objectContaining({ type: 'filter_skills', target: 'Deep Learning' })
      ])
    );

    const traceZh = getFallbackTrace('你的核心技術與技能是什麼？');
    expect(traceZh.id).toBe('skills_zh');
    expect(traceZh.uiActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'scroll_to', target: 'skills' }),
        expect.objectContaining({ type: 'filter_skills', target: 'Deep Learning' })
      ])
    );
  });

  it('falls back to default trace for unknown queries', () => {
    const traceEn = getFallbackTrace('Random query XYZ');
    expect(traceEn.id).toBe('default_en');

    const traceZh = getFallbackTrace('隨機未匹配查詢內容');
    expect(traceZh.id).toBe('default_zh');
  });
});

describe('useClientActions Hook', () => {
  function TestActionComponent({ onReady }) {
    const actions = useClientActions();
    React.useEffect(() => {
      onReady(actions);
    }, [actions, onReady]);
    return <div>Action Component</div>;
  }

  it('executes scroll_to and finds elements', () => {
    const mockScrollIntoView = vi.fn();
    const elem = document.createElement('div');
    elem.id = 'projects';
    elem.scrollIntoView = mockScrollIntoView;
    document.body.appendChild(elem);

    let capturedActions;
    render(<TestActionComponent onReady={(acts) => { capturedActions = acts; }} />);

    expect(capturedActions).toBeDefined();
    capturedActions.executeAction('scroll_to', 'projects');
    expect(mockScrollIntoView).toHaveBeenCalled();

    document.body.removeChild(elem);
  });
});

describe('HeroTerminal Component', () => {
  it('renders terminal with command prompt, quick queries, and sends message', () => {
    render(
      <AgentProvider>
        <HeroTerminal />
      </AgentProvider>
    );

    expect(screen.getByTestId('hero-terminal')).toBeInTheDocument();
    expect(screen.getByTestId('hero-terminal-input')).toBeInTheDocument();
    expect(screen.getByTestId('hero-terminal-submit')).toBeInTheDocument();

    const input = screen.getByTestId('hero-terminal-input');
    fireEvent.change(input, { target: { value: 'Show me your projects' } });
    fireEvent.click(screen.getByTestId('hero-terminal-submit'));

    expect(screen.getByText('Show me your projects')).toBeInTheDocument();
  });

  it('allows clicking quick query buttons to trigger prompts', () => {
    render(
      <AgentProvider>
        <HeroTerminal />
      </AgentProvider>
    );

    const quickBtn = screen.getByTestId('suggested-prompt-0');
    expect(quickBtn).toBeInTheDocument();
    fireEvent.click(quickBtn);

    expect(screen.getByTestId('hero-terminal')).toBeInTheDocument();
  });
});

describe('FloatingDock Component & Cmd+K Shortcut', () => {
  function TestDockHarness() {
    const { setIsHeroVisible } = useAgent();
    return (
      <div>
        <button data-testid="scroll-out-btn" onClick={() => setIsHeroVisible(false)}>
          Scroll Out
        </button>
        <FloatingDock />
      </div>
    );
  }

  it('renders floating capsule when hero is scrolled out of view', () => {
    render(
      <AgentProvider>
        <TestDockHarness />
      </AgentProvider>
    );

    // Initially Hero is visible, so capsule is hidden
    expect(screen.queryByTestId('floating-dock-capsule')).not.toBeInTheDocument();

    // Simulate scrolling out of Hero
    fireEvent.click(screen.getByTestId('scroll-out-btn'));
    expect(screen.getByTestId('floating-dock-capsule')).toBeInTheDocument();

    // Clicking capsule opens chat drawer
    fireEvent.click(screen.getByTestId('floating-dock-capsule'));
    expect(screen.getByTestId('floating-dock-drawer')).toBeInTheDocument();

    // Clicking close closes drawer
    fireEvent.click(screen.getByTestId('floating-dock-close'));
    expect(screen.queryByTestId('floating-dock-drawer')).not.toBeInTheDocument();
  });

  it('toggles dock with Cmd+K and Ctrl+K shortcuts', () => {
    render(
      <AgentProvider>
        <FloatingDock />
      </AgentProvider>
    );

    expect(screen.queryByTestId('floating-dock-drawer')).not.toBeInTheDocument();

    // Press Ctrl+K
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('floating-dock-drawer')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('floating-dock-drawer')).not.toBeInTheDocument();
  });
});
