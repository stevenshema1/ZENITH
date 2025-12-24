
import React, { useRef, useEffect } from 'react';
import { GameState, Vector2, EntityType, EnemyState, Projectile } from '../types';

interface Props {
  state: GameState;
  mouse: Vector2;
}

const GameCanvas: React.FC<Props> = ({ state, mouse }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const render = () => {
      frameRef.current++;
      
      // Calculate scaling to fit 800x800 world
      const worldSize = 800;
      const scale = Math.min(canvas.width / worldSize, canvas.height / worldSize);
      const offsetX = (canvas.width - worldSize * scale) / 2;
      const offsetY = (canvas.height - worldSize * scale) / 2;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#020205';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Clip to world bounds
      ctx.beginPath();
      ctx.rect(0, 0, worldSize, worldSize);
      ctx.clip();

      // Background
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, worldSize, worldSize);

      // Procedural Pavement / Grid
      ctx.strokeStyle = '#101015';
      ctx.lineWidth = 1;
      for (let i = 0; i <= worldSize; i += 80) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(worldSize, i); ctx.stroke();
      }

      // Neo-Tokyo Rain Effect
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
      for (let i = 0; i < 40; i++) {
        const x = (Math.random() * worldSize + frameRef.current * 3) % worldSize;
        const y = (Math.random() * worldSize + frameRef.current * 15) % worldSize;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1, y + 12);
        ctx.stroke();
      }

      // Walls
      state.walls.forEach(wall => {
        ctx.strokeStyle = wall.destructible ? '#333' : '#111';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wall.start.x, wall.start.y);
        ctx.lineTo(wall.end.x, wall.end.y);
        ctx.stroke();
      });

      // Projectiles
      state.projectiles.forEach(p => {
        const isPlayer = p.ownerId === 'player';
        ctx.shadowBlur = 10;
        ctx.shadowColor = isPlayer ? '#00f2ff' : '#ff003c';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Unified drawing for Actors
      const drawActor = (actor: any) => {
        const isDead = actor.state === EnemyState.DEAD;
        const isPlayer = actor.id === 'player';
        const isCiv = actor.type === EntityType.CIVILIAN;
        const isPanicked = isCiv && actor.state === EnemyState.ALERT;
        const speed = Math.hypot(actor.velocity.x, actor.velocity.y);

        let isFlinching = false;
        let recoilVector = { x: 0, y: 0 };
        if (isCiv && !isDead) {
          const distToMouse = Math.hypot(actor.pos.x - mouse.x, actor.pos.y - mouse.y);
          if (distToMouse < 45) isFlinching = true;

          state.projectiles.forEach((p: Projectile) => {
            const distToProj = Math.hypot(actor.pos.x - p.pos.x, actor.pos.y - p.pos.y);
            if (distToProj < 70) {
              isFlinching = true;
              const dx = actor.pos.x - p.pos.x;
              const dy = actor.pos.y - p.pos.y;
              recoilVector.x += (dx / distToProj) * 5;
              recoilVector.y += (dy / distToProj) * 5;
            }
          });
        }
        
        const animSpeed = isPanicked ? 1.4 : (speed > 10 ? 0.2 : 0.05);
        const walkCycle = isPanicked 
          ? (Math.sin(frameRef.current * 0.8) * 15 + Math.sin(frameRef.current * 1.5) * 6)
          : Math.sin(frameRef.current * animSpeed) * 12;
        
        ctx.save();
        const shudderX = isFlinching ? Math.sin(frameRef.current * 2.5) * 3 : 0;
        const shudderY = isFlinching ? Math.cos(frameRef.current * 2.8) * 3 : 0;

        let jitterX = recoilVector.x + shudderX, jitterY = recoilVector.y + shudderY, jitterRot = 0;
        if (isPanicked) {
          jitterX += (Math.random() - 0.5) * 10;
          jitterY += (Math.random() - 0.5) * 10;
          jitterRot = (Math.random() - 0.5) * 0.25;
        }

        ctx.translate(actor.pos.x + jitterX, actor.pos.y + jitterY);
        ctx.rotate(actor.rotation + jitterRot);

        if (isFlinching) ctx.scale(1.15, 0.8);
        else if (isPanicked) ctx.scale(1.05, 0.95);

        if (isDead) {
          ctx.globalAlpha = 0.5;
          ctx.rotate(Math.PI / 3);
        }

        // Legs
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 5;
        if (!isDead) {
          ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(walkCycle, -14); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-walkCycle, 14); ctx.stroke();
        }

        // Torso
        let bodyColor = actor.color;
        if (isPanicked) {
          const strobe = (Math.sin(frameRef.current * 2.0) + 1) / 2;
          bodyColor = strobe > 0.5 ? '#ff003c' : '#ff71ce'; 
          ctx.shadowBlur = 15;
          ctx.shadowColor = bodyColor;
        } else if (isFlinching) {
          bodyColor = '#fefefe';
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        }
        
        ctx.fillStyle = isDead ? '#222' : bodyColor;
        ctx.beginPath();
        ctx.roundRect(-10, -12, 18, 24, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Arms
        if (!isDead) {
          ctx.strokeStyle = bodyColor;
          ctx.lineWidth = 4;
          if (isPanicked || isFlinching) {
            const armFreq = isFlinching ? 3.5 : 1.5;
            const flailL = Math.sin(frameRef.current * armFreq) * (isFlinching ? 10 : 18);
            const flailR = Math.cos(frameRef.current * (armFreq * 0.9)) * (isFlinching ? 10 : 18);
            ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-10 + flailL, -18 + flailL * 0.3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-10 + flailR, 18 - flailR * 0.3); ctx.stroke();
          } else if (!isCiv) {
            ctx.fillStyle = '#111';
            ctx.fillRect(8, 6, 20, 5); 
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(12, 10); ctx.stroke();
          } else {
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(6 + walkCycle/4, 12); ctx.stroke();
          }
        }

        // Head
        ctx.save();
        if (isFlinching) ctx.rotate(Math.sin(frameRef.current * 0.5) * 0.2);
        ctx.fillStyle = isDead ? '#333' : (isCiv ? (isPanicked || isFlinching ? '#ffaaaa' : '#ffdcc5') : '#111');
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
        if (!isDead) {
          ctx.fillStyle = isPlayer ? '#00f2ff' : (isCiv ? (isPanicked || isFlinching ? '#ff003c' : '#000') : '#ff003c');
          ctx.fillRect(3, -4, 4, 8);
        }
        ctx.restore();
        ctx.restore();

        // UI Overlay
        if (!isDead) {
          ctx.textAlign = 'center';
          const drawLabel = isPanicked ? '!! PANIC !!' : (isFlinching ? 'CAUTION' : (isPlayer ? 'OPERATOR' : actor.id.toUpperCase()));
          ctx.font = (isPanicked || isFlinching) ? 'bold 11px monospace' : '8px monospace';
          ctx.fillStyle = isPanicked ? '#ff003c' : (isFlinching ? '#ffffff' : 'rgba(255,255,255,0.4)');
          ctx.fillText(drawLabel, actor.pos.x, actor.pos.y - 45);
        }
      };

      state.enemies.forEach(drawActor);
      drawActor(state.player);

      // Mouse/Crosshair Visual (mapped to world)
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 12, 0, Math.PI * 2);
      ctx.moveTo(mouse.x - 18, mouse.y); ctx.lineTo(mouse.x + 18, mouse.y);
      ctx.moveTo(mouse.x, mouse.y - 18); ctx.lineTo(mouse.x, mouse.y + 18);
      ctx.stroke();

      ctx.restore();
      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [state, mouse]);

  return <canvas ref={canvasRef} className="absolute inset-0 touch-none" />;
};

export default GameCanvas;
