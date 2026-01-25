import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const TerminalContainer = styled.div`
  background: rgba(13, 17, 23, 0.95);
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 1.5rem;
  font-family: 'Courier New', Courier, monospace;
  color: #c9d1d9;
  max-width: 800px;
  margin: 2rem auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  text-align: left;
  min-height: 300px;
`;

const LogLine = styled.div`
  margin-bottom: 4px;
  font-size: 0.9rem;
  line-height: 1.4;
  color: ${props => props.color || '#c9d1d9'};
`;


const Cursor = styled.span`
  display: inline-block;
  width: 8px;
  height: 15px;
  background: #00ff41;
  animation: ${blink} 1s step-end infinite;
  vertical-align: middle;
  margin-left: 4px;
`;

const TrainingLog = () => {
    const [lines, setLines] = useState([]);

    const totalEpochs = 50;

    useEffect(() => {
        const sequence = [
            { text: '> python train.py --model transformer_xl --dataset custom_corpus', delay: 500, color: '#f0f6fc' },
            { text: '[INFO] Initializing model parameters...', delay: 1200, color: '#8b949e' },
            { text: '[INFO] Connecting to GPU cluster [A100x8]...', delay: 1800, color: '#8b949e' },
            { text: 'Loading checkpoint...', delay: 2400 },
        ];

        let timeouts = [];

        // Initial sequence
        sequence.forEach((item, index) => {
            const timeout = setTimeout(() => {
                setLines(prev => [...prev, item]);
            }, item.delay);
            timeouts.push(timeout);
        });

        // Simulated training loop
        const startTraining = setTimeout(() => {
            let epoch = 1;
            const trainInterval = setInterval(() => {
                if (epoch > totalEpochs) {
                    clearInterval(trainInterval);
                    setLines(prev => [...prev,
                    { text: '> Model saved to /checkpoints/best_model.pt', color: '#3fb950' },
                    { text: '> Ready for inference.', color: '#3fb950' }
                    ]);
                    return;
                }

                const loss = (2.5 / Math.sqrt(epoch)).toFixed(4);
                const acc = (0.95 - (0.5 / Math.sqrt(epoch))).toFixed(4);
                const progress = Math.min(Math.floor((epoch / totalEpochs) * 20), 20);
                const progressBar = `[${'='.repeat(progress)}${'>'}${'.'.repeat(20 - progress)}]`;

                setLines(prev => {
                    const next = [...prev];
                    // Keep only last few lines to prevent overflow if desired, or let it scroll
                    if (next.length > 12) next.shift();
                    return [...next, {
                        text: `Epoch ${epoch}/${totalEpochs}: ${progressBar} - loss: ${loss} - accuracy: ${acc}`,
                        color: '#c9d1d9'
                    }];
                });


                epoch++;
            }, 300); // Speed of epochs

            timeouts.push(trainInterval);
        }, 3000);

        timeouts.push(startTraining);

        return () => {
            timeouts.forEach(clearTimeout);
            // Need to handle clearInterval appropriately if we mixed them
        };
    }, []);

    return (
        <TerminalContainer>
            {lines.map((line, i) => (
                <LogLine key={i} color={line.color}>
                    {line.text}
                </LogLine>
            ))}
            <LogLine>
                <Cursor />
            </LogLine>
        </TerminalContainer>
    );
};

export default TrainingLog;
