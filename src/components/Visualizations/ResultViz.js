import React from 'react';

const ResultViz = ({ image, label = "Pedestrian", confidence = "0.92" }) => {
  const imgUrl = image || "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  return (
    <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
      <img
        src={imgUrl}
        alt="Result Visualization"
        className="w-full h-full object-cover opacity-80"
        loading="lazy"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-400 bg-emerald-400/10 p-2 text-emerald-400 font-mono text-xs">
        <span className="absolute -top-6 left-0 bg-emerald-400 text-black px-1.5 py-0.5 font-bold font-mono text-[11px] uppercase tracking-wider">
          {label} {confidence}
        </span>
        <div className="w-[120px] h-[80px]" />
      </div>
    </div>
  );
};

export default ResultViz;
