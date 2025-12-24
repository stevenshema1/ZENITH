
import React from 'react';
import { GameState, EnemyState, EntityType } from '../types';

interface Props {
  state: GameState;
}

const HUD: React.FC<Props> = ({ state }) => {
  const activeEnemies = state.enemies.filter(
    (e) => e.type === EntityType.ENEMY && e.state !== EnemyState.DEAD
  );
  const liveCivilians = state.enemies.filter(
    (e) => e.type === EntityType.CIVILIAN && e.state !== EnemyState.DEAD
  );
  const combatMode = activeEnemies.some((e) => e.state === EnemyState.COMBAT);
  const isCollateralDamage = liveCivilians.length < 12;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-10 font-mono flex flex-col justify-between overflow-hidden z-20">
      {/* Top Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="bg-black/80 border-l-2 border-blue-500 p-3 md:p-5 w-40 md:w-80 backdrop-blur-xl shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-blue-500 font-bold text-[8px] md:text-xs tracking-[0.2em]">ZENITH_OP</span>
            <span className="hidden md:inline text-[10px] text-blue-500/50">V.1.09</span>
          </div>
          <div className="space-y-1 md:space-y-2">
            <div className="flex justify-between text-[8px] md:text-[10px] text-blue-300 uppercase">
              <span>HP</span>
              <span className={state.player.health < 40 ? 'text-red-500 animate-pulse' : ''}>
                {Math.ceil(state.player.health)}%
              </span>
            </div>
            <div className="w-full bg-blue-900/20 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-blue-400 h-full transition-all duration-500" 
                style={{ width: `${state.player.health}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-black/80 border-r-2 border-red-500 p-3 md:p-5 w-40 md:w-72 backdrop-blur-xl text-right">
          <h3 className="text-red-500 font-bold text-[8px] md:text-xs tracking-widest uppercase mb-1">Scan</h3>
          <div className="text-[9px] md:text-[11px] space-y-0.5 md:space-y-1">
            <div className="text-white flex justify-between">
              <span className="text-white/40">HOSTILES:</span>
              <span className="font-bold">{activeEnemies.length}</span>
            </div>
            <div className={`flex justify-between ${isCollateralDamage ? 'text-orange-500' : 'text-purple-400'}`}>
              <span className="opacity-40">CITIZENS:</span>
              <span className="font-bold">{liveCivilians.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle - Objective Monitor */}
      <div className="self-center w-full max-w-xs md:max-w-md">
        <div className="bg-white/5 border border-white/10 px-4 md:px-10 py-2 md:py-4 backdrop-blur-sm rounded-sm text-center">
          <div className="text-[8px] text-white/30 uppercase tracking-[0.4em] mb-1 font-bold">Primary Link</div>
          <div className="text-white font-medium text-xs md:text-lg tracking-tight uppercase truncate">
            {state.mission?.objective || 'Standby for Tasking'}
          </div>
        </div>
      </div>

      {/* Bottom - Hide Intent Monitor on Mobile for Thumb Space */}
      <div className="flex justify-between items-end gap-4 md:gap-10">
        <div className="hidden lg:block bg-black/90 border border-white/5 p-6 w-96 backdrop-blur-2xl">
          <div className="text-[10px] text-blue-500 font-bold mb-4 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
             <i className="fas fa-users text-[8px]"></i> ACTOR INTENT MONITOR
          </div>
          <div className="space-y-2 text-[10px]">
            {state.enemies.filter(e => e.state !== EnemyState.DEAD).slice(0, 4).map((e, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${e.type === EntityType.ENEMY ? 'bg-red-500' : 'bg-purple-500'}`}></span>
                <span className="text-white/40 w-16">{e.id.split('-')[0].toUpperCase()}</span>
                <span className="text-white flex-1 overflow-hidden whitespace-nowrap text-ellipsis italic">
                  {(e.plan || []).join(' > ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full md:max-w-2xl">
          <div className="bg-gradient-to-r from-blue-900/60 to-black/90 p-3 md:p-6 border-l-4 border-blue-400 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
            <div className="text-[8px] md:text-[10px] text-blue-400 mb-1 md:mb-3 font-bold tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></span>
              COMMS
            </div>
            <div className="text-[10px] md:text-sm text-white/90 leading-relaxed font-serif italic line-clamp-2 md:line-clamp-none">
              "{state.lastDialogue}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
