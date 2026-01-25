import React from 'react';
import styled from 'styled-components';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #1e1e1e;
  overflow: hidden;
  font-size: 0.8rem;
  
  pre {
    margin: 0 !important;
    height: 100%;
    padding: 1.5rem !important;
  }
`;

const CodeBlock = ({ code = "print('Hello World')", language = "python" }) => {
    return (
        <CodeContainer>
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{ background: '#0d1117' }}
                showLineNumbers={true}
            >
                {code}
            </SyntaxHighlighter>
        </CodeContainer>
    );
};

export default CodeBlock;
