import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownComponents = {
  a: ({ node, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-electric underline decoration-cyan-electric/40 hover:decoration-cyan-electric hover:text-cyan-300 transition-colors break-words font-medium"
    />
  ),
  p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0 leading-relaxed break-words" />,
  ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside mb-2 last:mb-0 space-y-1 pl-1" />,
  ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside mb-2 last:mb-0 space-y-1 pl-1" />,
  li: ({ node, ...props }) => <li {...props} className="text-slate-200" />,
  h1: ({ node, ...props }) => <h1 {...props} className="text-base font-bold text-cyan-electric mt-2 mb-1" />,
  h2: ({ node, ...props }) => <h2 {...props} className="text-sm font-bold text-cyan-electric mt-2 mb-1" />,
  h3: ({ node, ...props }) => <h3 {...props} className="text-xs font-bold text-cyan-electric mt-1.5 mb-1" />,
  code: ({ node, className, children, ...props }) => (
    <code
      {...props}
      className={`px-1 py-0.5 rounded bg-black/50 text-cyan-electric/95 font-mono text-[11px] border border-cyan-500/25 break-words ${className || ''}`}
    >
      {children}
    </code>
  ),
  pre: ({ node, ...props }) => (
    <pre
      {...props}
      className="p-2.5 my-2 rounded-lg bg-black/70 border border-slate-700/60 overflow-x-auto text-[11px] font-mono text-slate-200 max-w-full"
    />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-2 max-w-full">
      <table {...props} className="min-w-full border-collapse border border-slate-700/60 text-[11px]" />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th {...props} className="border border-slate-700/60 bg-cyber-surface/90 px-2 py-1 text-left font-bold text-cyan-electric" />
  ),
  td: ({ node, ...props }) => (
    <td {...props} className="border border-slate-700/60 px-2 py-1 text-slate-300" />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote {...props} className="border-l-2 border-cyan-electric/50 pl-2.5 italic my-1.5 text-slate-400 bg-cyan-950/20 py-0.5" />
  ),
  strong: ({ node, ...props }) => <strong {...props} className="font-bold text-slate-100" />,
  em: ({ node, ...props }) => <em {...props} className="italic text-slate-200" />,
};

const AgentMarkdown = ({ content }) => {
  if (!content) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={MarkdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
};

export default AgentMarkdown;
