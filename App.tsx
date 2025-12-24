
import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './engine/GameEngine';
import { GameState, Vector2, EnemyState } from './types';
import { getAdaptiveMission, getNpcDialogue } from './services/geminiService';
import HUD from './components/HUD';
import GameCanvas from './components/GameCanvas';
import MissionStart from './components/MissionStart';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  const engineRef = useRef<GameEngine | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<Vector2>({ x: 400, y: 300 }); // Default center in world coords
  const isMouseDownRef = useRef(false);
  const dialogueCooldownRef = useRef(0);

  // Mobile Touch Controls State
  const joystickRef = useRef<{ active: boolean; start: Vector2; current: Vector2 }>({ 
    active: false, start: {x: 0, y: 0}, current: {x: 0, y: 0} 
  });
  const [touchJoystickPos, setTouchJoystickPos] = useState<Vector2 | null>(null);

  useEffect(() => {
    engineRef.current = new GameEngine((state) => {
      setGameState(state);
    });

    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    
    // Unified mouse tracking (mapped to screen, will be scaled in canvas)
    const handleMouseMove = (e: MouseEvent) => {
      const worldSize = 800;
      const scale = Math.min(window.innerWidth / worldSize, window.innerHeight / worldSize);
      const offsetX = (window.innerWidth - worldSize * scale) / 2;
      const offsetY = (window.innerHeight - worldSize * scale) / 2;
      mouseRef.current = { 
        x: (e.clientX - offsetX) / scale, 
        y: (e.clientY - offsetY) / scale 
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const isLeftSide = touch.clientX < window.innerWidth / 2;
      
      if (isLeftSide) {
        joystickRef.current = {
          active: true,
          start: { x: touch.clientX, y: touch.clientY },
          current: { x: touch.clientX, y: touch.clientY }
        };
        setTouchJoystickPos({ x: touch.clientX, y: touch.clientY });
      } else {
        isMouseDownRef.current = true;
        // Update crosshair to touch position
        const worldSize = 800;
        const scale = Math.min(window.innerWidth / worldSize, window.innerHeight / worldSize);
        const offsetX = (window.innerWidth - worldSize * scale) / 2;
        const offsetY = (window.innerHeight - worldSize * scale) / 2;
        mouseRef.current = { 
          x: (touch.clientX - offsetX) / scale, 
          y: (touch.clientY - offsetY) / scale 
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (joystickRef.current.active) {
        const touch = Array.from(e.touches).find(t => t.clientX < window.innerWidth / 2);
        if (touch) {
          joystickRef.current.current = { x: touch.clientX, y: touch.clientY };
          setTouchJoystickPos({ x: joystickRef.current.start.x, y: joystickRef.current.start.y, current: {x: touch.clientX, y: touch.clientY} } as any);
        }
      }
      // Update mouse for aiming if touching right side
      const aimTouch = Array.from(e.touches).find(t => t.clientX >= window.innerWidth / 2);
      if (aimTouch) {
        const worldSize = 800;
        const scale = Math.min(window.innerWidth / worldSize, window.innerHeight / worldSize);
        const offsetX = (window.innerWidth - worldSize * scale) / 2;
        const offsetY = (window.innerHeight - worldSize * scale) / 2;
        mouseRef.current = { 
          x: (aimTouch.clientX - offsetX) / scale, 
          y: (aimTouch.clientY - offsetY) / scale 
        };
      }
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        joystickRef.current.active = false;
        setTouchJoystickPos(null);
        isMouseDownRef.current = false;
      } else {
        const remainingLeftSide = Array.from(e.touches).some(t => t.clientX < window.innerWidth / 2);
        const remainingRightSide = Array.from(e.touches).some(t => t.clientX >= window.innerWidth / 2);
        if (!remainingLeftSide) {
          joystickRef.current.active = false;
          setTouchJoystickPos(null);
        }
        if (!remainingRightSide) {
          isMouseDownRef.current = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', () => isMouseDownRef.current = true);
    window.addEventListener('mouseup', () => isMouseDownRef.current = false);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (!gameState || !gameState.isMissionActive) return;
    const updateDialogue = async () => {
      if (dialogueCooldownRef.current > 0) {
        dialogueCooldownRef.current--;
        return;
      }
      const inCombat = gameState.enemies.some(e => e.state === EnemyState.COMBAT);
      if (inCombat && Math.random() < 0.005) {
        const dialogue = await getNpcDialogue("witnessed high-intensity tactical combat", gameState.history);
        engineRef.current?.updateDialogue(dialogue);
        dialogueCooldownRef.current = 500;
      }
    };
    updateDialogue();
  }, [gameState]);

  const handleStartMission = async () => {
    if (!engineRef.current) return;
    setLoading(true);
    try {
      const history = engineRef.current.getState().history;
      const params = await getAdaptiveMission(history);
      engineRef.current.startMission(params);
      requestAnimationFrame((t) => engineRef.current?.update(t));
      setShowIntro(false);
    } catch (err) {
      console.error("Failed to start mission", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameState?.isMissionActive && engineRef.current) {
      // Map virtual joystick to key signals
      const activeKeys = new Set(keysRef.current);
      if (joystickRef.current.active) {
        const dx = joystickRef.current.current.x - joystickRef.current.start.x;
        const dy = joystickRef.current.current.y - joystickRef.current.start.y;
        if (dy < -20) activeKeys.add('w');
        if (dy > 20) activeKeys.add('s');
        if (dx < -20) activeKeys.add('a');
        if (dx > 20) activeKeys.add('d');
      }
      engineRef.current.handleInput(activeKeys, mouseRef.current, isMouseDownRef.current);
    }
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none touch-none">
      {gameState?.isMissionActive && (
        <>
          <GameCanvas state={gameState} mouse={mouseRef.current} />
          <HUD state={gameState} />
          
          {/* Virtual Joystick Visual */}
          {touchJoystickPos && (
            <div 
              className="absolute pointer-events-none z-50 rounded-full border-2 border-blue-500/30 bg-blue-500/10 backdrop-blur-sm"
              style={{ 
                left: touchJoystickPos.x - 60, 
                top: touchJoystickPos.y - 60,
                width: 120, height: 120
              }}
            >
              <div 
                className="absolute w-12 h-12 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,0.6)]"
                style={{
                  left: 60 - 24 + Math.max(-40, Math.min(40, joystickRef.current.current.x - joystickRef.current.start.x)),
                  top: 60 - 24 + Math.max(-40, Math.min(40, joystickRef.current.current.y - joystickRef.current.start.y))
                }}
              />
            </div>
          )}
        </>
      )}

      {showIntro && !loading && (
        <MissionStart onStart={handleStartMission} history={gameState?.history || []} />
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-blue-400 p-10 text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
          <p className="text-xl font-mono animate-pulse tracking-widest uppercase">AMD: ASSEMBLING TACTICAL GRID...</p>
          <p className="text-[10px] md:text-sm mt-2 text-blue-800 tracking-tighter">OPTIMIZING FOR MOBILE OPERATIVE LINK</p>
        </div>
      )}

      {gameState?.isGameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-md text-white p-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">OPERATOR DOWN</h2>
          <p className="mb-8 font-mono text-sm uppercase opacity-70">Mission Failure - Data Corrupted</p>
          <button 
            onClick={handleStartMission}
            className="px-10 py-4 bg-white text-black font-bold hover:bg-red-500 hover:text-white transition-all active:scale-90"
          >
            REBOOT & REDEPLOY
          </button>
        </div>
      )}

      {!gameState?.isMissionActive && !showIntro && !loading && !gameState?.isGameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-green-400 p-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase">Extraction Complete</h2>
          <p className="mb-8 font-mono text-sm md:text-xl uppercase opacity-60">Actor Registry Updated | Zenith Secured</p>
          <button 
            onClick={handleStartMission}
            className="px-12 py-5 bg-green-500 text-black font-bold hover:bg-white transition-all uppercase tracking-widest active:scale-95"
          >
            Next Mission
          </button>
        </div>
      )}
    </div>
  );
}
