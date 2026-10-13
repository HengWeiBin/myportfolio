import React, { useState, useEffect } from 'react';

const TrainingLog = () => {
  const [lines, setLines] = useState([]);
  const totalEpochs = 50;

  useEffect(() => {
    const sequence = [
      { text: '> python train.py --model transformer_xl --dataset custom_corpus', delay: 500, color: '#f0f6fc' },
      { text: '[INFO] Initializing model parameters...', delay: 1200, color: '#8b949e' },
      { text: '[INFO] Connecting to GPU cluster [A100x8]...', delay: 1800, color: '#8b949e' },
      { text: 'Loading checkpoint...', delay: 2400, color: '#c9d1d9' },
    ];

    let timeouts = [];

    // Initial sequence
    sequence.forEach((item) => {
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
          setLines(prev => [
            ...prev,
            { text: '> Model saved to /checkpoints/best_model.pt', color: '#10b981' },
            { text: '> Ready for inference.', color: '#00f0ff' }
          ]);
          return;
        }

        const loss = (2.5 / Math.sqrt(epoch)).toFixed(4);
        const acc = (0.95 - (0.5 / Math.sqrt(epoch))).toFixed(4);
        const progress = Math.min(Math.floor((epoch / totalEpochs) * 20), 20);
        const progressBar = `[${'='.repeat(progress)}${'>'}${'.'.repeat(20 - progress)}]`;

        setLines(prev => {
          const next = [...prev];
          if (next.length > 10) next.shift();
          return [
            ...next,
            {
              text: `Epoch ${epoch}/${totalEpochs}: ${progressBar} - loss: ${loss} - acc: ${acc}`,
              color: '#94a3b8'
            }
          ];
        });

        epoch++;
      }, 300);

      timeouts.push(trainInterval);
    }, 3000);

    timeouts.push(startTraining);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="bg-cyber-surface/90 border border-cyber-border rounded-lg p-4 sm:p-5 font-mono text-slate-300 max-w-full my-4 shadow-xl text-left min-h-[240px] sm:min-h-[280px] overflow-hidden">
      {lines.map((line, i) => (
        <div
          key={i}
          className="text-xs sm:text-[13px] font-mono leading-relaxed mb-1 break-all"
          style={{ color: line.color }}
        >
          {line.text}
        </div>
      ))}
      <div className="text-xs sm:text-[13px] font-mono leading-relaxed">
        <span className="inline-block w-2 h-3.5 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
      </div>
    </div>
  );
};

export default TrainingLog;
