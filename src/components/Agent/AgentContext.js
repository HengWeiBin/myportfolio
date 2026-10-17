import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { getFallbackTrace } from './fallbackTraces';
import { useClientActions } from './useClientActions';

const AgentContext = createContext(null);

export const SUGGESTED_PROMPTS = [
  { label: '🎯 Core Projects', query: 'Tell me about your core machine learning and perception projects.' },
  { label: '⚡ Technical Stack', query: 'What are your primary technical skills and deep learning frameworks?' },
  { label: '💼 Experience', query: 'What is your professional background and previous ML roles?' },
  { label: '🇹🇼 核心專案介紹', query: '介紹一下你的感測器融合與機器學習核心專案。' },
];

const INITIAL_MESSAGE = {
  id: 'init-msg-0',
  role: 'assistant',
  content: "Mission Control Standby. I am Wayne's AI Portfolio Assistant. Ask me about his machine learning research, 3D perception architectures, technical arsenal, or career timeline.",
  thought: 'Agent initialized in Mission Control environment. Ready for directive.',
  toolCalls: [],
  isStreaming: false,
  isFallback: false,
  timestamp: Date.now()
};

export const AgentProvider = ({ children }) => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [highlightedProject, setHighlightedProject] = useState(null);
  const [activeSkillFilter, setActiveSkillFilter] = useState(null);
  const [rateLimitReached, setRateLimitReached] = useState(false);
  const [rateLimitNotice, setRateLimitNotice] = useState(null);

  const activeTimerRef = useRef(null);
  const playbackTimerRef = activeTimerRef;
  const isMountedRef = useRef(true);

  // Clean up streaming timers on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
        clearInterval(activeTimerRef.current);
        activeTimerRef.current = null;
      }
    };
  }, []);

  // Client actions hook
  const { scrollTo, highlightProject, filterSkills, openProject, executeAction } = useClientActions({
    setHighlightedProject,
    setActiveSkillFilter,
  });

  // Clear highlight timer
  useEffect(() => {
    if (highlightedProject) {
      const timer = setTimeout(() => {
        setHighlightedProject(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [highlightedProject]);

  const clearHighlights = useCallback(() => {
    setHighlightedProject(null);
    setActiveSkillFilter(null);
  }, []);

  const openDock = useCallback(() => setIsDockOpen(true), []);
  const closeDock = useCallback(() => setIsDockOpen(false), []);
  const toggleDock = useCallback(() => setIsDockOpen(prev => !prev), []);

  /**
   * Gracefully streams scripted playback tokens into the active message.
   */
  const runScriptedPlayback = useCallback((promptText, assistantId) => {
    const trace = getFallbackTrace(promptText);

    // Update assistant message with initial thought and tool traces
    setMessages(prev => prev.map(msg => {
      if (msg.id === assistantId) {
        return {
          ...msg,
          isFallback: true,
          thought: trace.thought,
          toolCalls: trace.toolCalls || [],
          content: ''
        };
      }
      return msg;
    }));

    // Trigger associated UI actions
    if (Array.isArray(trace.uiActions)) {
      trace.uiActions.forEach(action => {
        executeAction(action.type, action.target);
      });
    }

    // Split response into word tokens for typewriter effect
    const words = (trace.response || '').split(' ');
    let currentIndex = 0;

    if (activeTimerRef.current) {
      clearTimeout(activeTimerRef.current);
      clearInterval(activeTimerRef.current);
      activeTimerRef.current = null;
    }

    activeTimerRef.current = setInterval(() => {
      if (typeof window === 'undefined' || !isMountedRef.current) {
        if (activeTimerRef.current) {
          clearTimeout(activeTimerRef.current);
          clearInterval(activeTimerRef.current);
          activeTimerRef.current = null;
        }
        return;
      }

      if (currentIndex < words.length) {
        const nextChunk = (currentIndex === 0 ? '' : ' ') + words[currentIndex];
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantId) {
            return {
              ...msg,
              content: msg.content + nextChunk
            };
          }
          return msg;
        }));
        currentIndex++;
      } else {
        if (activeTimerRef.current) {
          clearTimeout(activeTimerRef.current);
          clearInterval(activeTimerRef.current);
          activeTimerRef.current = null;
        }
        if (typeof window === 'undefined' || !isMountedRef.current) return;
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantId) {
            return { ...msg, isStreaming: false };
          }
          return msg;
        }));
        setIsStreaming(false);
      }
    }, 28);
  }, [executeAction]);

  /**
   * Sends user message to serverless LLM endpoint or streams fallback playback
   */
  const sendMessage = useCallback(async (promptText) => {
    const trimmed = (promptText || '').trim();
    if (!trimmed || isStreaming) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `agent-${Date.now() + 1}`;

    const userMsg = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now()
    };

    const assistantMsg = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      thought: 'Receiving transmission... Processing prompt embeddings.',
      toolCalls: [],
      isStreaming: true,
      isFallback: rateLimitReached,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // If rate limit has already been hit, immediately run scripted fallback
    if (rateLimitReached) {
      runScriptedPlayback(trimmed, assistantMessageId);
      return;
    }

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed })
      });

      if (!response.ok) {
        setRateLimitReached(true);
        if (response.status === 429) {
          setRateLimitNotice('Daily limit of 5 requests reached. Switched gracefully to scripted playback.');
        } else {
          setRateLimitNotice('AI service offline / local mode. Switched gracefully to demo playback.');
        }
        runScriptedPlayback(trimmed, assistantMessageId);
        return;
      }

      // Read SSE stream
      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let isDone = false;

        while (!isDone) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';

          for (const frame of frames) {
            if (!frame.trim()) continue;

            const lines = frame.split('\n');
            let event = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                event = line.replace(/^event:\s*/, '').trim();
              } else if (line.startsWith('data:')) {
                dataStr = line.replace(/^data:\s*/, '').trim();
              }
            }

            let dataObj = null;
            try {
              dataObj = JSON.parse(dataStr);
            } catch {
              dataObj = dataStr;
            }

            if (event === 'error') {
              setRateLimitReached(true);
              setRateLimitNotice(
                typeof dataObj === 'object' && dataObj?.message
                  ? dataObj.message
                  : 'Daily rate limit reached. Reverting to scripted playback.'
              );
              runScriptedPlayback(trimmed, assistantMessageId);
              return;
            } else if (event === 'tool_call') {
              const toolName = dataObj?.tool;
              const toolParams = dataObj?.params || {};

              setMessages(prev => prev.map(msg => {
                if (msg.id === assistantMessageId) {
                  return {
                    ...msg,
                    thought: `Invoking portfolio tool: ${toolName}()`,
                    toolCalls: [...(msg.toolCalls || []), { tool: toolName, params: toolParams }]
                  };
                }
                return msg;
              }));

              // Dispatch automatic front-end navigation
              if (toolName === 'list_projects') {
                executeAction('scroll_to', 'projects');
              } else if (toolName === 'list_skills') {
                executeAction('scroll_to', 'skills');
              } else if (toolName === 'get_experience') {
                executeAction('scroll_to', 'experience');
              } else if (toolName === 'list_certificates') {
                executeAction('scroll_to', 'certificates');
              }
            } else if (event === 'token') {
              const tokenChunk = typeof dataObj === 'object' ? (dataObj.token || '') : String(dataObj || '');
              setMessages(prev => prev.map(msg => {
                if (msg.id === assistantMessageId) {
                  return {
                    ...msg,
                    content: msg.content + tokenChunk
                  };
                }
                return msg;
              }));
            } else if (event === 'done') {
              isDone = true;
              setMessages(prev => prev.map(msg => {
                if (msg.id === assistantMessageId) {
                  return { ...msg, isStreaming: false };
                }
                return msg;
              }));
              setIsStreaming(false);
            }
          }
        }
      } else {
        // Fallback for environments where body.getReader is unavailable
        const text = await response.text();
        if (text.includes('RATE_LIMIT_EXCEEDED')) {
          setRateLimitReached(true);
          setRateLimitNotice('Daily limit of 5 requests hit. Switched gracefully to scripted playback.');
          runScriptedPlayback(trimmed, assistantMessageId);
        } else {
          runScriptedPlayback(trimmed, assistantMessageId);
        }
      }
    } catch (err) {
      console.warn('[AgentContext] Chat request failed, initiating scripted fallback:', err.message);
      setRateLimitReached(true);
      setRateLimitNotice('AI service offline / local mode. Switched gracefully to demo playback.');
      runScriptedPlayback(trimmed, assistantMessageId);
    }
  }, [isStreaming, rateLimitReached, runScriptedPlayback, executeAction]);

  const resetChat = useCallback(() => {
    if (activeTimerRef.current) {
      clearTimeout(activeTimerRef.current);
      clearInterval(activeTimerRef.current);
      activeTimerRef.current = null;
    }
    setMessages([INITIAL_MESSAGE]);
    setIsStreaming(false);
    clearHighlights();
  }, [clearHighlights]);

  const value = {
    messages,
    isStreaming,
    isHeroVisible,
    setIsHeroVisible,
    isDockOpen,
    openDock,
    closeDock,
    toggleDock,
    highlightedProject,
    setHighlightedProject,
    activeSkillFilter,
    setActiveSkillFilter,
    clearHighlights,
    rateLimitReached,
    setRateLimitReached,
    rateLimitNotice,
    suggestedPrompts: SUGGESTED_PROMPTS,
    sendMessage,
    resetChat,
    scrollTo,
    highlightProject,
    filterSkills,
    openProject,
    executeAction,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  return context || {
    messages: [],
    isStreaming: false,
    isHeroVisible: true,
    setIsHeroVisible: () => {},
    isDockOpen: false,
    openDock: () => {},
    closeDock: () => {},
    toggleDock: () => {},
    highlightedProject: null,
    setHighlightedProject: () => {},
    activeSkillFilter: null,
    setActiveSkillFilter: () => {},
    clearHighlights: () => {},
    rateLimitReached: false,
    setRateLimitReached: () => {},
    rateLimitNotice: null,
    suggestedPrompts: SUGGESTED_PROMPTS,
    sendMessage: () => {},
    resetChat: () => {},
    scrollTo: () => {},
    highlightProject: () => {},
    filterSkills: () => {},
    openProject: () => {},
    executeAction: () => {},
  };
};

export default AgentContext;
