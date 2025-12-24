
import React from 'react';
import { MissionOutcome } from '../types';

interface Props {
  onStart: () => void;
  history: MissionOutcome[];
}

const MissionStart: React.FC<Props> = ({ onStart, history }) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/95 flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 my-auto">
        {/* Left Side: Lore/Intel */}
        <div className="flex flex-col justify-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">
            PROJECT <br />
            <span className="text-blue-500">ZENITH</span>
          </h1>
          <div className="bg-blue-500/10 border-l-4 border-blue-500 p-6">
            <h2 className="text-blue-400 font-bold mb-2 uppercase text-[10px] md:text-sm tracking-widest">Global Vanguard Intel</h2>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
              We are deploying to <span className="text-white font-bold">Neo-Tokyo, Sector 7</span>. 
              The Adaptive Mission Director (AMD) has analyzed your previous deployments. 
              Enemy forces are recalibrating their GOAP logic based on your tactical footprint.
            </p>
          </div>
          
          <button 
            onClick={onStart}
            className="group relative px-6 md:px-10 py-4 md:py-5 bg-blue-600 text-white font-bold overflow-hidden transition-all hover:bg-blue-500 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform skew-x-12"></div>
            <span className="relative z-10 text-base md:text-xl tracking-widest">COMMENCE EXTRACTION</span>
          </button>
        </div>

        {/* Right Side: Stats/History */}
        <div className="bg-zinc-900/50 border border-white/10 p-6 md:p-8 rounded-sm backdrop-blur-md">
          <h3 className="text-white font-mono text-xs md:text-sm mb-6 flex items-center gap-2">
            <i className="fas fa-database text-blue-500"></i> OPERATOR HISTORY
          </h3>
          
          {history.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-gray-500 font-mono text-[10px] md:text-sm border border-dashed border-white/10">
              NO PRIOR DATA. <br /> INITIALIZING BASELINE PERFORMANCE METRICS.
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4 max-h-48 md:max-h-none overflow-y-auto pr-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 text-[9px] md:text-xs font-mono">
                  <span className={h.success ? 'text-green-500' : 'text-red-500'}>
                    {h.success ? '● SUCCESS' : '○ FAILED'}
                  </span>
                  <span className="text-gray-400">LETHALITY: {h.lethality.toUpperCase()}</span>
                  <span className="text-blue-400">{h.kills} KILLS</span>
                </div>
              ))}
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="text-[9px] text-gray-500 uppercase mb-2">AMD Adjustment Factor</div>
                <div className="text-sm md:text-lg text-blue-400 font-bold">
                  {history.every(h => h.success) ? '+40% ENEMY TACTICAL AGGRESSION' : 'STABILIZED DIFFICULTY'}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 md:mt-12">
            <div className="grid grid-cols-3 gap-2">
              <div className="h-1 bg-blue-500"></div>
              <div className="h-1 bg-blue-500"></div>
              <div className="h-1 bg-blue-500/20"></div>
            </div>
            <div className="flex justify-between text-[10px] text-blue-300 mt-2 font-mono">
              <span>SYNCING...</span>
              <span>84%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionStart;
