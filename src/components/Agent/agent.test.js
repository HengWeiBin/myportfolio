import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFallbackTrace, FALLBACK_TRACES } from './fallbackTraces';
import { useClientActions } from './useClientActions';
import AgentContext, { AgentProvider, useAgent } from './AgentContext';
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

afterEach(() => {
  vi.clearAllTimers();
});

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

  it('correctly maps specific Chinese queries (你是誰, 你的經歷是什麼, 你會什麼技術, 證照)', () => {
    const profileTrace = getFallbackTrace('你是誰？可以介紹一下自己嗎？');
    expect(profileTrace.id).toBe('profile_zh');
    expect(profileTrace.lang).toBe('zh');

    const expTrace = getFallbackTrace('你的經歷是什麼？');
    expect(expTrace.id).toBe('experience_zh');
    expect(expTrace.lang).toBe('zh');

    const skillTrace = getFallbackTrace('你會什麼技術？');
    expect(skillTrace.id).toBe('skills_zh');
    expect(skillTrace.lang).toBe('zh');

    const certTrace = getFallbackTrace('工程師有哪些證照與證書？');
    expect(certTrace.id).toBe('certificates_zh');
    expect(certTrace.lang).toBe('zh');
  });

  it('falls back to default trace for unknown queries', () => {
    const traceEn = getFallbackTrace('Random query XYZ');
    expect(traceEn.id).toBe('default_en');

    const traceZh = getFallbackTrace('隨機未匹配查詢內容');
    expect(traceZh.id).toBe('default_zh');
  });
});

function TestActionComponent({ onReady }) {
  const actions = useClientActions();
  React.useEffect(() => {
    onReady(actions);
  }, [actions, onReady]);
  return <div>Action Component</div>;
}

describe('useClientActions Hook', () => {

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

  it('executes open_project action and dispatches open-project custom event', () => {
    const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => {});
    const projectElem = document.createElement('div');
    projectElem.id = 'project-SuperModel';
    projectElem.setAttribute('data-project-id', '123');
    const link = document.createElement('a');
    link.href = 'https://example.com/supermodel';
    projectElem.appendChild(link);
    document.body.appendChild(projectElem);

    let eventDispatched = false;
    const listener = (e) => {
      eventDispatched = true;
      expect(e.detail.projectIdentifier).toBe('SuperModel');
    };
    window.addEventListener('open-project', listener);

    let capturedActions;
    render(<TestActionComponent onReady={(acts) => { capturedActions = acts; }} />);

    capturedActions.executeAction('open_project', 'SuperModel');
    expect(eventDispatched).toBe(true);
    expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com/supermodel', '_blank', 'noopener,noreferrer');

    window.removeEventListener('open-project', listener);
    document.body.removeChild(projectElem);
    mockWindowOpen.mockRestore();
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

  it('renders telemetry reasoning trace and tool calls without STATUS 200 OK label', () => {
    const mockContextValue = {
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Here are the skills.',
          thought: 'User asked for skills. Filtering view.',
          toolCalls: [{ tool: 'filter_skills', args: { category: 'Deep Learning' } }],
          isStreaming: false,
          isFallback: false,
          timestamp: Date.now(),
        },
      ],
      isStreaming: false,
      sendMessage: vi.fn(),
      suggestedPrompts: [],
      rateLimitReached: false,
      rateLimitNotice: null,
      resetChat: vi.fn(),
    };

    render(
      <AgentContext.Provider value={mockContextValue}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    const toggle = screen.getByTestId('telemetry-drawer-toggle');
    fireEvent.click(toggle);

    expect(screen.getByTestId('telemetry-thought')).toHaveTextContent('User asked for skills');
    const toolCallElem = screen.getByTestId('telemetry-tool');
    expect(toolCallElem).toBeInTheDocument();
    expect(toolCallElem).toHaveTextContent('TOOL CALL:');
    expect(toolCallElem).toHaveTextContent('filter_skills()');
    expect(screen.queryByText(/\[STATUS: 200 OK\]/)).not.toBeInTheDocument();
  });

  it('renders green LED Connected tooltip when healthy and amber LED with reasons when degraded', () => {
    // 1. Healthy connected state
    const { unmount } = render(
      <AgentContext.Provider value={{
        messages: [],
        isStreaming: false,
        sendMessage: vi.fn(),
        suggestedPrompts: [],
        rateLimitReached: false,
        fallbackReason: null,
        resetChat: vi.fn(),
      }}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    const greenLed = screen.getByTitle('Connected');
    expect(greenLed).toBeInTheDocument();
    expect(greenLed).toHaveAttribute('aria-label', 'Connected');
    expect(screen.queryByTestId('rate-limit-badge')).not.toBeInTheDocument();
    unmount();

    // 2. Degraded state with no API key
    const { unmount: unmount2 } = render(
      <AgentContext.Provider value={{
        messages: [],
        isStreaming: false,
        sendMessage: vi.fn(),
        suggestedPrompts: [],
        rateLimitReached: true,
        fallbackReason: 'no API key',
        resetChat: vi.fn(),
      }}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    const amberLed1 = screen.getByTestId('rate-limit-badge');
    expect(amberLed1).toHaveAttribute('title', 'Fallback Mode: no API key');
    expect(amberLed1).toHaveAttribute('aria-label', 'Fallback Mode: no API key');
    unmount2();

    // 3. Degraded state with rate limit
    render(
      <AgentContext.Provider value={{
        messages: [],
        isStreaming: false,
        sendMessage: vi.fn(),
        suggestedPrompts: [],
        rateLimitReached: true,
        fallbackReason: 'rate limit',
        resetChat: vi.fn(),
      }}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    const amberLed2 = screen.getByTestId('rate-limit-badge');
    expect(amberLed2).toHaveAttribute('title', 'Fallback Mode: rate limit');
    expect(amberLed2).toHaveAttribute('aria-label', 'Fallback Mode: rate limit');
  });

  it('switches to fallback mode and shows scripted badge on done event with source "fallback"', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: token\ndata: {"token":"This is fallback"}\n\n'));
        controller.enqueue(encoder.encode('event: done\ndata: {"tokens_used":4,"source":"fallback","reason":"no_key"}\n\n'));
        controller.close();
      }
    });

    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: stream,
    });

    render(
      <AgentProvider>
        <HeroTerminal />
      </AgentProvider>
    );

    const input = screen.getByTestId('hero-terminal-input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(screen.getByTestId('hero-terminal-submit'));
    });

    const amberBadge = await screen.findByTestId('rate-limit-badge');
    expect(amberBadge).toBeInTheDocument();
    expect(amberBadge).toHaveAttribute('title', 'Fallback Mode: no API key');
    expect(amberBadge).toHaveAttribute('aria-label', 'Fallback Mode: no API key');
    expect(await screen.findByText('scripted')).toBeInTheDocument();

    mockFetch.mockRestore();
  });

  it('scrolls terminal into view with block nearest on handleSubmit and handlePromptClick', () => {
    const mockScrollIntoView = vi.fn();
    const mockSendMessage = vi.fn();

    render(
      <AgentContext.Provider value={{
        messages: [],
        isStreaming: false,
        sendMessage: mockSendMessage,
        suggestedPrompts: [{ label: 'Test Prompt', query: 'Test Query' }],
        rateLimitReached: false,
        fallbackReason: null,
        resetChat: vi.fn(),
      }}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    const terminalElem = screen.getByTestId('hero-terminal');
    terminalElem.scrollIntoView = mockScrollIntoView;

    // Test handleSubmit
    const input = screen.getByTestId('hero-terminal-input');
    fireEvent.change(input, { target: { value: 'User question' } });
    fireEvent.click(screen.getByTestId('hero-terminal-submit'));

    expect(mockSendMessage).toHaveBeenCalledWith('User question');
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });

    mockScrollIntoView.mockClear();

    // Test handlePromptClick
    const promptBtn = screen.getByTestId('suggested-prompt-0');
    fireEvent.click(promptBtn);

    expect(mockSendMessage).toHaveBeenCalledWith('Test Query');
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
  });

  it('auto-scrolls internal container on message update or streaming without calling scrollIntoView', () => {
    const mockScrollIntoView = vi.fn();
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    const mockScrollTo = vi.fn();
    const originalScrollTo = window.HTMLElement.prototype.scrollTo;
    window.HTMLElement.prototype.scrollTo = mockScrollTo;

    const { rerender } = render(
      <AgentContext.Provider value={{
        messages: [{ id: '1', role: 'user', content: 'Hi' }],
        isStreaming: false,
        sendMessage: vi.fn(),
        suggestedPrompts: [],
        rateLimitReached: false,
        fallbackReason: null,
        resetChat: vi.fn(),
      }}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    expect(mockScrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );

    mockScrollIntoView.mockClear();
    mockScrollTo.mockClear();

    rerender(
      <AgentContext.Provider value={{
        messages: [
          { id: '1', role: 'user', content: 'Hi' },
          { id: '2', role: 'assistant', content: 'Hello there', isStreaming: true }
        ],
        isStreaming: true,
        sendMessage: vi.fn(),
        suggestedPrompts: [],
        rateLimitReached: false,
        fallbackReason: null,
        resetChat: vi.fn(),
      }}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    expect(mockScrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.HTMLElement.prototype.scrollTo = originalScrollTo;
  });
});

function TestDockHarness() {
  const { setIsHeroVisible } = useAgent();
  return (
    <div>
      <button type="button" data-testid="scroll-out-btn" onClick={() => setIsHeroVisible(false)}>
        Scroll Out
      </button>
      <FloatingDock />
    </div>
  );
}

describe('FloatingDock Component & Cmd+K Shortcut', () => {

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

  it('auto-scrolls internal container when open without calling scrollIntoView', () => {
    const mockScrollIntoView = vi.fn();
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    const mockScrollTo = vi.fn();
    const originalScrollTo = window.HTMLElement.prototype.scrollTo;
    window.HTMLElement.prototype.scrollTo = mockScrollTo;

    const { rerender } = render(
      <AgentContext.Provider value={{
        messages: [{ id: '1', role: 'user', content: 'Hi' }],
        isStreaming: false,
        sendMessage: vi.fn(),
        isHeroVisible: false,
        isDockOpen: true,
        openDock: vi.fn(),
        closeDock: vi.fn(),
        toggleDock: vi.fn(),
        suggestedPrompts: [],
        rateLimitReached: false,
        rateLimitNotice: null,
        resetChat: vi.fn(),
      }}>
        <FloatingDock />
      </AgentContext.Provider>
    );

    expect(mockScrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    mockScrollTo.mockClear();
    mockScrollIntoView.mockClear();

    rerender(
      <AgentContext.Provider value={{
        messages: [
          { id: '1', role: 'user', content: 'Hi' },
          { id: '2', role: 'assistant', content: 'Streaming reply...', isStreaming: true }
        ],
        isStreaming: true,
        sendMessage: vi.fn(),
        isHeroVisible: false,
        isDockOpen: true,
        openDock: vi.fn(),
        closeDock: vi.fn(),
        toggleDock: vi.fn(),
        suggestedPrompts: [],
        rateLimitReached: false,
        rateLimitNotice: null,
        resetChat: vi.fn(),
      }}>
        <FloatingDock />
      </AgentContext.Provider>
    );

    expect(mockScrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.HTMLElement.prototype.scrollTo = originalScrollTo;
  });
});

describe('Agent Markdown Rendering (react-markdown + remark-gfm)', () => {
  it('renders markdown formatting (bold, lists, code, links, tables) in assistant replies', () => {
    const markdownContent = `
# Perception System

Here is **bold text** and \`inline code\`.

- Feature 1: Radar
- Feature 2: Camera

[Portfolio Link](https://example.com/portfolio)

| Architecture | Accuracy |
| :--- | :--- |
| CenterFusion | 98% |

\`\`\`python
def evaluate():
    return True
\`\`\`
`;

    const mockContextValue = {
      messages: [
        {
          id: 'assistant-md-1',
          role: 'assistant',
          content: markdownContent,
          isStreaming: false,
          isFallback: false,
          timestamp: Date.now(),
        },
      ],
      isStreaming: false,
      sendMessage: vi.fn(),
      suggestedPrompts: [],
      rateLimitReached: false,
      fallbackReason: null,
      resetChat: vi.fn(),
    };

    render(
      <AgentContext.Provider value={mockContextValue}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    const responseContainer = screen.getByTestId('agent-response-content');
    expect(responseContainer).toBeInTheDocument();

    // Bold text rendered as <strong>
    const strongElem = responseContainer.querySelector('strong');
    expect(strongElem).toBeInTheDocument();
    expect(strongElem.textContent).toBe('bold text');

    // Lists rendered as <ul> and <li>
    const listItems = responseContainer.querySelectorAll('li');
    expect(listItems.length).toBeGreaterThanOrEqual(2);
    expect(listItems[0].textContent).toContain('Feature 1: Radar');

    // Code rendered as <code>
    const codeElems = responseContainer.querySelectorAll('code');
    expect(codeElems.length).toBeGreaterThanOrEqual(2);
    expect(Array.from(codeElems).some(el => el.textContent.includes('inline code'))).toBe(true);

    // Pre block rendered for code block
    const preElem = responseContainer.querySelector('pre');
    expect(preElem).toBeInTheDocument();
    expect(preElem.textContent).toContain('def evaluate():');

    // Link rendered with target="_blank" and rel="noopener noreferrer"
    const linkElem = responseContainer.querySelector('a');
    expect(linkElem).toBeInTheDocument();
    expect(linkElem.textContent).toBe('Portfolio Link');
    expect(linkElem).toHaveAttribute('href', 'https://example.com/portfolio');
    expect(linkElem).toHaveAttribute('target', '_blank');
    expect(linkElem).toHaveAttribute('rel', 'noopener noreferrer');

    // GFM Table rendered
    const tableElem = responseContainer.querySelector('table');
    expect(tableElem).toBeInTheDocument();
    const thElems = responseContainer.querySelectorAll('th');
    expect(thElems.length).toBe(2);
    expect(thElems[0].textContent).toBe('Architecture');
    const tdElems = responseContainer.querySelectorAll('td');
    expect(tdElems[0].textContent).toBe('CenterFusion');
  });

  it('does NOT render raw HTML tags like <script> or <img onerror> as elements', () => {
    const rawHtmlContent = 'Security test: <img src="x" onerror="window.hacked=true" /> and <script>alert(1)</script>';

    const mockContextValue = {
      messages: [
        {
          id: 'assistant-xss-1',
          role: 'assistant',
          content: rawHtmlContent,
          isStreaming: false,
          isFallback: false,
          timestamp: Date.now(),
        },
      ],
      isStreaming: false,
      sendMessage: vi.fn(),
      suggestedPrompts: [],
      rateLimitReached: false,
      fallbackReason: null,
      resetChat: vi.fn(),
    };

    render(
      <AgentContext.Provider value={mockContextValue}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    const responseContainer = screen.getByTestId('agent-response-content');
    // Ensure no <img> or <script> element is in the document
    expect(responseContainer.querySelector('img')).toBeNull();
    expect(responseContainer.querySelector('script')).toBeNull();
  });

  it('renders typewriter cursor during streaming with markdown content', () => {
    const mockContextValue = {
      messages: [
        {
          id: 'assistant-stream-1',
          role: 'assistant',
          content: 'Streaming **markdown** partial...',
          isStreaming: true,
          isFallback: false,
          timestamp: Date.now(),
        },
      ],
      isStreaming: true,
      sendMessage: vi.fn(),
      suggestedPrompts: [],
      rateLimitReached: false,
      fallbackReason: null,
      resetChat: vi.fn(),
    };

    render(
      <AgentContext.Provider value={mockContextValue}>
        <HeroTerminal />
      </AgentContext.Provider>
    );

    expect(screen.getByTestId('typewriter-cursor')).toBeInTheDocument();
    const responseContainer = screen.getByTestId('agent-response-content');
    expect(responseContainer.querySelector('strong')).toBeInTheDocument();
  });
});
