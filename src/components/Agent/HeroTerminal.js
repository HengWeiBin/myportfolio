import React, { useState, useRef, useEffect } from 'react';
import { useAgent } from './AgentContext';

const HeroTerminal = () => {
  const {
    messages,
    isStreaming,
    sendMessage,
    suggestedPrompts,
    rateLimitReached,
    rateLimitNotice,
    resetChat
  } = useAgent();

  const [inputVal, setInputVal] = useState('');
  const [showTelemetry, setShowTelemetry] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest response
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

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

  // Find latest assistant message
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const latestAssistant = assistantMessages[assistantMessages.length - 1] || null;

  return (
    <div
      data-testid="hero-terminal"
      className="w-full bg-cyber-dark/85 border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(0,240,255,0.08)] backdrop-blur-md font-mono"
    >
      {/* Terminal Header */}
      <div className="bg-cyber-surface/90 px-4 py-2.5 border-b border-cyber-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-bold text-cyan-electric">PORTFOLIO ASSISTANT</span>
        </div>

        <div className="flex items-center gap-3">
          {rateLimitReached ? (
            <span
              data-testid="rate-limit-badge"
              className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"
              title="Fallback Mode"
              aria-label="Fallback Mode"
            />
          ) : (
            <span
              className="inline-block w-2 h-2 rounded-full bg-emerald-400"
              title="Connected"
              aria-label="Connected"
            />
          )}

          <button
            onClick={resetChat}
            title="Reset Terminal"
            className="text-[11px] text-slate-400 hover:text-cyan-electric hover:underline transition-colors"
          >
            [CLEAR]
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Rate Limit Notice Banner */}
        {rateLimitReached && (
          <div
            data-testid="rate-limit-notice"
            className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-lg flex items-center"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚠</span>
              <span>{rateLimitNotice || 'Daily rate limit reached (5 requests/day). Reverting to scripted playback.'}</span>
            </div>
          </div>
        )}

        {/* Conversation Stream Output */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className="text-xs sm:text-sm">
              {msg.role === 'user' ? (
                <div className="flex items-start gap-2 text-slate-200 bg-cyber-panel/40 px-3 py-2 rounded-lg border border-cyber-border">
                  <span className="text-purple-400 font-bold select-none">&gt; visitor:</span>
                  <span className="text-slate-100 font-medium">{msg.content}</span>
                </div>
              ) : (
                <div className="space-y-2 bg-cyber-surface/40 p-3 rounded-lg border border-cyber-border/80">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="text-cyan-electric font-semibold flex items-center gap-1.5">
                      <span className="text-xs">🤖</span> agent:
                      {msg.isFallback && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          scripted
                        </span>
                      )}
                    </span>
                    {msg.isStreaming && (
                      <span className="text-cyan-electric/80 animate-pulse text-[11px]">
                        streaming tokens...
                      </span>
                    )}
                  </div>

                  {/* Telemetry Drawer */}
                  {(msg.thought || (msg.toolCalls && msg.toolCalls.length > 0)) && (
                    <div className="pt-1">
                      <button
                        type="button"
                        data-testid="telemetry-drawer-toggle"
                        onClick={() => setShowTelemetry(prev => !prev)}
                        className="text-[11px] text-slate-400 hover:text-cyan-electric flex items-center gap-1.5 transition-colors focus:outline-none"
                      >
                        <span className="text-cyan-electric font-mono">{showTelemetry ? '▼' : '▶'}</span>
                        <span className="underline decoration-dashed decoration-slate-600 hover:decoration-cyan-electric">
                          TELEMETRY & REASONING TRACE ({1 + (msg.toolCalls?.length || 0)} events)
                        </span>
                      </button>

                      {showTelemetry && (
                        <div
                          data-testid="telemetry-content"
                          className="mt-2 p-2.5 rounded bg-black/60 border border-slate-700/60 text-[11px] space-y-1.5 text-slate-300 animate-fadeIn"
                        >
                          {msg.thought && (
                            <div data-testid="telemetry-thought" className="text-slate-400">
                              <span className="text-purple-400 font-bold">&gt; THOUGHT:</span> {msg.thought}
                            </div>
                          )}
                          {msg.toolCalls && msg.toolCalls.map((t, idx) => (
                            <div key={idx} data-testid="telemetry-tool" className="text-cyan-electric/90 flex items-center gap-1.5">
                              <span className="text-slate-500">&gt;</span>
                              <span className="font-bold text-amber-400">TOOL CALL:</span>
                              <code>{t.tool}()</code>
                              <span className="text-emerald-400 text-[10px]">[STATUS: 200 OK]</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Streamed Token Output */}
                  <div
                    data-testid="agent-response-content"
                    className="text-slate-200 leading-relaxed pt-1"
                  >
                    {msg.content}
                    {msg.isStreaming && (
                      <span
                        data-testid="typewriter-cursor"
                        className="inline-block w-2 h-3.5 bg-cyan-electric animate-pulse ml-1 align-middle"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-cyber-border/60">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">QUICK QUERIES:</span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              data-testid={`suggested-prompt-${idx}`}
              onClick={() => handlePromptClick(p.query)}
              disabled={isStreaming}
              className="text-xs px-2.5 py-1 rounded bg-cyber-panel/80 text-slate-300 border border-cyber-border hover:border-cyan-400 hover:text-cyan-electric hover:bg-cyan-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3 text-cyan-electric font-bold select-none">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              data-testid="hero-terminal-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask agent about projects, neural architectures, skills..."
              disabled={isStreaming}
              className="w-full bg-cyber-card/90 text-slate-100 placeholder-slate-500 text-xs sm:text-sm pl-8 pr-4 py-2.5 rounded-lg border border-cyber-border focus:border-cyan-electric focus:ring-1 focus:ring-cyan-electric focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            data-testid="hero-terminal-submit"
            disabled={!inputVal.trim() || isStreaming}
            className="px-4 py-2.5 rounded-lg bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/50 hover:bg-cyan-electric/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center gap-1.5"
          >
            <span>$ RUN</span>
            <span className="hidden sm:inline">&rarr;</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeroTerminal;
