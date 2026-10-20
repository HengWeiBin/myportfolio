import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from './AgentContext';
import AgentMarkdown from './AgentMarkdown';

const FloatingDock = () => {
  const {
    messages,
    isStreaming,
    sendMessage,
    isHeroVisible,
    isDockOpen,
    openDock,
    closeDock,
    toggleDock,
    suggestedPrompts,
    rateLimitReached,
    rateLimitNotice,
    resetChat
  } = useAgent();

  const [inputVal, setInputVal] = useState('');
  const [showTelemetry, setShowTelemetry] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleDock();
      } else if (e.key === 'Escape' && isDockOpen) {
        closeDock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDock, closeDock, isDockOpen]);

  // Focus input on dock expansion
  useEffect(() => {
    if (isDockOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isDockOpen]);

  // Auto-scroll chat drawer strictly inside conversation container
  useEffect(() => {
    if (isDockOpen && containerRef.current) {
      try {
        if (typeof containerRef.current.scrollTo === 'function') {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } catch {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [messages, isStreaming, isDockOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isStreaming) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  const handlePromptClick = (query) => {
    if (isStreaming) return;
    sendMessage(query);
  };

  // Determine visibility: shown if Hero is scrolled out of view OR if manually opened via Cmd+K
  const shouldRenderCapsule = !isHeroVisible && !isDockOpen;
  const shouldRenderDrawer = isDockOpen;

  return (
    <div className="font-mono">
      {/* 1. Floating Collapsed Capsule Dock */}
      <AnimatePresence>
        {shouldRenderCapsule && (
          <motion.div
            data-testid="floating-dock-capsule"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={openDock}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
          >
            <div className="glass-panel-glow bg-cyber-dark/95 border border-cyan-500/40 hover:border-cyan-electric/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 flex items-center gap-3 shadow-[0_0_25px_rgba(0,240,255,0.2)] hover:shadow-[0_0_35px_rgba(0,240,255,0.4)] transition-all group">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-cyan-electric flex items-center gap-1.5 transition-colors">
                <span>🤖 PORTFOLIO ASSISTANT</span>
              </span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-cyber-card text-slate-400 border border-cyber-border rounded font-mono shadow-inner">
                ⌘K / Ctrl+K
              </kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Expanded Floating Mini Chat Drawer */}
      <AnimatePresence>
        {shouldRenderDrawer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-end justify-center pointer-events-none p-4 sm:pb-8">
            {/* Backdrop overlay for focus */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDock}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs pointer-events-auto"
            />

            {/* Chat Drawer Window */}
            <motion.div
              data-testid="floating-dock-drawer"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-lg glass-panel-glow bg-cyber-dark/95 border border-cyan-500/50 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col max-h-[82vh] overflow-hidden pointer-events-auto relative z-10"
            >
              {/* Terminal Window Header Bar */}
              <div className="bg-cyber-surface/90 px-4 py-3 border-b border-cyber-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono text-cyan-electric font-semibold ml-1.5">
                    mission-control@agent:~/chat
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={resetChat}
                    className="text-[11px] text-slate-400 hover:text-cyan-electric transition-colors"
                  >
                    [RESET]
                  </button>
                  <button
                    data-testid="floating-dock-close"
                    onClick={closeDock}
                    className="text-slate-400 hover:text-rose-400 px-1.5 py-0.5 rounded transition-colors"
                    title="Close (Esc)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Rate Limit Notice in Dock */}
              {rateLimitReached && (
                <div
                  data-testid="dock-rate-limit-notice"
                  className="mx-3 mt-3 text-xs text-amber-300 bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-2"
                >
                  <span>⚠</span>
                  <span>{rateLimitNotice || 'Daily rate limit reached. Reverting to scripted playback.'}</span>
                </div>
              )}

              {/* Scrollable Conversation Stream */}
              <div ref={containerRef} className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[50vh] custom-scrollbar text-xs">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    {msg.role === 'user' ? (
                      <div className="flex items-start gap-2 bg-cyber-panel/50 px-3 py-2 rounded-lg border border-cyber-border text-slate-200">
                        <span className="text-purple-400 font-bold">&gt;</span>
                        <span className="text-slate-100">{msg.content}</span>
                      </div>
                    ) : (
                      <div className="bg-cyber-surface/60 p-3 rounded-lg border border-cyber-border space-y-2">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="text-cyan-electric font-bold flex items-center gap-1">
                            🤖 Agent
                            {msg.isFallback && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                scripted
                              </span>
                            )}
                          </span>
                          {msg.isStreaming && (
                            <span className="text-cyan-electric/80 animate-pulse text-[10px]">
                              streaming...
                            </span>
                          )}
                        </div>

                        {/* Collapsible Telemetry Pane */}
                        {(msg.thought || (msg.toolCalls && msg.toolCalls.length > 0)) && (
                          <div className="pt-0.5">
                            <button
                              type="button"
                              data-testid="dock-telemetry-toggle"
                              onClick={() => setShowTelemetry(prev => !prev)}
                              className="text-[10px] text-slate-400 hover:text-cyan-electric flex items-center gap-1 transition-colors"
                            >
                              <span className="text-cyan-electric">{showTelemetry ? '▼' : '▶'}</span>
                              <span className="underline decoration-dashed decoration-slate-600">
                                REASONING TRACE ({1 + (msg.toolCalls?.length || 0)})
                              </span>
                            </button>

                            {showTelemetry && (
                              <div
                                data-testid="dock-telemetry-content"
                                className="mt-1.5 p-2 rounded bg-black/60 border border-slate-700/60 text-[10px] space-y-1 text-slate-300"
                              >
                                {msg.thought && (
                                  <div>
                                    <span className="text-purple-400 font-bold">&gt; THOUGHT:</span> {msg.thought}
                                  </div>
                                )}
                                {msg.toolCalls && msg.toolCalls.map((t, idx) => (
                                  <div key={idx} className="text-cyan-electric flex items-center gap-1">
                                    <span className="text-slate-500">&gt;</span>
                                    <span className="text-amber-400">TOOL:</span>
                                    <code>{t.tool}()</code>
                                    <span className="text-emerald-400">[200 OK]</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text Output */}
                        <div
                          data-testid="dock-response-content"
                          className="text-slate-200 leading-relaxed"
                        >
                          <AgentMarkdown content={msg.content} />
                          {msg.isStreaming && (
                            <span
                              data-testid="dock-typewriter-cursor"
                              className="inline-block w-1.5 h-3 bg-cyan-electric animate-pulse ml-0.5 align-middle"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Suggested Prompts */}
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-cyber-border/40 pt-2">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    data-testid={`dock-suggested-prompt-${idx}`}
                    onClick={() => handlePromptClick(p.query)}
                    disabled={isStreaming}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyber-panel text-slate-300 border border-cyber-border hover:border-cyan-400 hover:text-cyan-electric transition-colors disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Input Form Bar */}
              <form onSubmit={handleSubmit} className="p-3 bg-cyber-surface/90 border-t border-cyber-border flex items-center gap-2">
                <span className="text-cyan-electric font-bold text-xs pl-1 select-none">&gt;</span>
                <input
                  ref={inputRef}
                  type="text"
                  data-testid="floating-dock-input"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask agent about projects, skills, ML research..."
                  disabled={isStreaming}
                  className="flex-1 bg-cyber-card text-slate-100 placeholder-slate-500 text-xs px-3 py-2 rounded-lg border border-cyber-border focus:border-cyan-electric focus:outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  data-testid="floating-dock-submit"
                  disabled={!inputVal.trim() || isStreaming}
                  className="px-3 py-2 rounded-lg bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/50 hover:bg-cyan-electric/30 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  $ RUN
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingDock;
