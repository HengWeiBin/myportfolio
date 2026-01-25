import React from 'react';
import styled from 'styled-components';

const DiagramContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #0d1117;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const SvgContent = styled.svg`
  width: 90%;
  height: 90%;
  filter: drop-shadow(0 0 10px rgba(88, 166, 255, 0.2));
`;

// Simple standardized visualization of an Encoder-Decoder or generic Network
const NeuralArch = () => {
    return (
        <DiagramContainer>
            <SvgContent viewBox="0 0 400 200">
                {/* Input Layer */}
                <rect x="50" y="50" width="40" height="100" rx="4" fill="transparent" stroke="#30363d" strokeWidth="2" />
                <text x="70" y="170" fill="#8b949e" fontSize="10" textAnchor="middle">Input</text>

                {/* Hidden Layers / Transformer Blocks */}
                <rect x="120" y="40" width="160" height="120" rx="4" fill="rgba(88, 166, 255, 0.1)" stroke="#58a6ff" strokeWidth="2" />
                <text x="200" y="100" fill="#58a6ff" fontSize="12" textAnchor="middle">Transformer Blocks</text>

                {/* Attention heads simulation */}
                {[0, 1, 2].map(i => (
                    <circle key={i} cx="150" cy={70 + i * 30} r="5" fill="#58a6ff" />
                ))}
                {[0, 1, 2].map(i => (
                    <circle key={i} cx="250" cy={70 + i * 30} r="5" fill="#58a6ff" />
                ))}

                {/* Internal connections */}
                <path d="M 155 70 L 245 130" stroke="#58a6ff" strokeWidth="1" opacity="0.5" />
                <path d="M 155 130 L 245 70" stroke="#58a6ff" strokeWidth="1" opacity="0.5" />

                {/* Output Layer */}
                <rect x="310" y="50" width="40" height="100" rx="4" fill="transparent" stroke="#30363d" strokeWidth="2" />
                <text x="330" y="170" fill="#8b949e" fontSize="10" textAnchor="middle">Output</text>

                {/* Flow lines */}
                <path d="M 90 100 L 120 100" stroke="#c9d1d9" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M 280 100 L 310 100" stroke="#c9d1d9" strokeWidth="2" markerEnd="url(#arrow)" />

                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#c9d1d9" />
                    </marker>
                </defs>
            </SvgContent>
        </DiagramContainer>
    );
};

export default NeuralArch;
