import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ code = "print('Hello World')", language = "python" }) => {
  return (
    <div className="w-full h-full bg-[#1e1e1e] overflow-hidden text-xs font-mono">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          background: '#0d1117',
          margin: 0,
          height: '100%',
          padding: '1.25rem',
          fontSize: '0.8rem',
          borderRadius: 0
        }}
        showLineNumbers={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
