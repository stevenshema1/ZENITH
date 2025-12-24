
import { Entity, EntityType, EnemyState, GameState, Vector2, Projectile, Wall, MissionParams, MissionOutcome } from '../types';

export class GameEngine {
  private state: GameState;
  private lastTime: number = 0;
  private onUpdate: (state: GameState) => void;
  private frameCount: number = 0;

  constructor(onUpdate: (state: GameState) => void) {
    this.onUpdate = onUpdate;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      player: {
        id: 'player',
        type: EntityType.PLAYER,
        pos: { x: 400, y: 600 },
        health: 100,
        maxHealth: 100,
        rotation: 0,
        velocity: { x: 0, y: 0 },
        state: EnemyState.IDLE,
        color: '#3b82f6'
      },
      enemies: [],
      projectiles: [],
      walls: this.generateWalls(),
      mission: null,
      history: [],
      isGameOver: false,
      lastDialogue: 'Operator online. Stand by for neural link...',
      isMissionActive: false
    };
  }

  private generateWalls(): Wall[] {
    return [
      { start: { x: 50, y: 50 }, end: { x: 50, y: 750 }, destructible: false },
      { start: { x: 750, y: 50 }, end: { x: 750, y: 750 }, destructible: false },
      { start: { x: 150, y: 150 }, end: { x: 350, y: 150 }, destructible: true, health: 100 },
      { start: { x: 450, y: 400 }, end: { x: 650, y: 400 }, destructible: true, health: 100 },
      { start: { x: 100, y: 550 }, end: { x: 300, y: 550 }, destructible: false },
      { start: { x: 500, y: 200 }, end: { x: 500, y: 350 }, destructible: false },
    ];
  }

  public startMission(params: MissionParams) {
    const enemies: Entity[] = [];
    const enemyCount = params.enemyConfig.density || 6;
    const civilianCount = 12; // High density for "crowded" feel
    
    // Spawn Real People (Civilians)
    const civColors = ['#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
    for (let i = 0; i < civilianCount; i++) {
      enemies.push({
        id: `civ-${i}`,
        type: EntityType.CIVILIAN,
        pos: { x: 100 + Math.random() * 600, y: 200 + Math.random() * 400 },
        health: 40,
        maxHealth: 40,
        rotation: Math.random() * Math.PI * 2,
        velocity: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
        state: EnemyState.IDLE,
        color: civColors[i % civColors.length],
        plan: ['Navigating Market', 'Neural Browsing']
      });
    }

    // Spawn Hostile Enforcers
    for (let i = 0; i < enemyCount; i++) {
      enemies.push({
        id: `sector-guard-${i}`,
        type: EntityType.ENEMY,
        pos: { x: 100 + Math.random() * 600, y: 50 + Math.random() * 150 },
        health: 80,
        maxHealth: 80,
        rotation: Math.PI / 2,
        velocity: { x: 0, y: 0 },
        state: EnemyState.PATROL,
        color: '#333333',
        plan: ['Sector Perimeter Check', 'Querying Central Intel']
      });
    }

    this.state = {
      ...this.state,
      enemies,
      mission: params,
      isMissionActive: true,
      isGameOver: false,
      projectiles: [],
      player: { ...this.state.player, pos: { x: 400, y: 700 }, health: 100 }
    };
  }

  public update(time: number) {
    if (!this.state.isMissionActive || this.state.isGameOver) return;
    
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = Math.min(time, this.lastTime + 100); // Caps delta time
    this.lastTime = time;
    this.frameCount++;

    this.updateEntities(dt);
    this.updateProjectiles(dt);
    this.updateAI(dt);
    this.checkCollisions();

    this.onUpdate({ ...this.state });
    requestAnimationFrame(this.update.bind(this));
  }

  private updateEntities(dt: number) {
    // Player movement
    this.state.player.pos.x += this.state.player.velocity.x * dt;
    this.state.player.pos.y += this.state.player.velocity.y * dt;

    // Constrain player
    this.state.player.pos.x = Math.max(20, Math.min(780, this.state.player.pos.x));
    this.state.player.pos.y = Math.max(20, Math.min(780, this.state.player.pos.y));

    this.state.enemies.forEach(actor => {
      if (actor.state !== EnemyState.DEAD) {
        actor.pos.x += actor.velocity.x * dt;
        actor.pos.y += actor.velocity.y * dt;
        
        // Wrap-around or bounce for civilians to keep area crowded
        if (actor.pos.x < 0 || actor.pos.x > 800) actor.velocity.x *= -1;
        if (actor.pos.y < 0 || actor.pos.y > 800) actor.velocity.y *= -1;
      }
    });
  }

  private updateProjectiles(dt: number) {
    this.state.projectiles = this.state.projectiles.filter(p => {
      p.pos.x += p.velocity.x * dt;
      p.pos.y += p.velocity.y * dt;
      return p.pos.x > 0 && p.pos.x < 800 && p.pos.y > 0 && p.pos.y < 800;
    });
  }

  private updateAI(dt: number) {
    const playerPos = this.state.player.pos;
    const gunfireDetected = this.state.projectiles.length > 0;
    
    this.state.enemies.forEach(actor => {
      if (actor.state === EnemyState.DEAD) return;

      if (actor.type === EntityType.CIVILIAN) {
        if (gunfireDetected) {
          actor.state = EnemyState.ALERT;
          actor.plan = ['PANIC', 'EVADE DANGER'];
          const dx = actor.pos.x - playerPos.x;
          const dy = actor.pos.y - playerPos.y;
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5); // Add erratic jitter
          actor.velocity = { x: Math.cos(angle) * 160, y: Math.sin(angle) * 160 };
          actor.rotation = angle;
        } else {
          // Normal crowd wandering
          if (this.frameCount % 180 === 0) {
            const angle = Math.random() * Math.PI * 2;
            actor.velocity = { x: Math.cos(angle) * 30, y: Math.sin(angle) * 30 };
            actor.rotation = angle;
            actor.plan = ['Window Shopping', 'Commuting'];
          }
        }
        return;
      }

      // Tactical Hostile AI
      const dist = Math.hypot(actor.pos.x - playerPos.x, actor.pos.y - playerPos.y);
      if (dist < 450 || gunfireDetected) {
        actor.state = EnemyState.COMBAT;
        const targetRot = Math.atan2(playerPos.y - actor.pos.y, playerPos.x - actor.pos.x);
        actor.rotation = targetRot;
        
        if (dist > 180) {
          actor.velocity = { x: Math.cos(targetRot) * 90, y: Math.sin(targetRot) * 90 };
          actor.plan = ['Flanking Target', 'Closing Gap'];
        } else {
          actor.velocity = { x: 0, y: 0 };
          actor.plan = ['Suppressing Operator', 'Holding Ground'];
        }

        if (Math.random() < 0.04) {
          this.fireProjectile(actor.id, actor.pos, actor.rotation, 450);
        }
      }
    });
  }

  private checkCollisions() {
    this.state.projectiles = this.state.projectiles.filter(p => {
      let hit = false;
      
      // Hit Player?
      if (p.ownerId !== 'player') {
        const d = Math.hypot(p.pos.x - this.state.player.pos.x, p.pos.y - this.state.player.pos.y);
        if (d < 18) {
          this.state.player.health -= p.damage;
          hit = true;
          if (this.state.player.health <= 0) this.state.isGameOver = true;
        }
      }

      // Hit Others?
      this.state.enemies.forEach(actor => {
        if (actor.state === EnemyState.DEAD || actor.id === p.ownerId) return;
        const d = Math.hypot(p.pos.x - actor.pos.x, p.pos.y - actor.pos.y);
        if (d < 20) {
          actor.health -= p.damage;
          hit = true;
          if (actor.health <= 0) {
            actor.state = EnemyState.DEAD;
            actor.velocity = { x: 0, y: 0 };
            actor.plan = ['DECEASED'];
          }
        }
      });

      return !hit;
    });

    const activeThreats = this.state.enemies.filter(e => e.type === EntityType.ENEMY && e.state !== EnemyState.DEAD);
    if (this.state.mission && activeThreats.length === 0) {
      this.completeMission(true);
    }
  }

  private completeMission(success: boolean) {
    const outcome: MissionOutcome = {
      success,
      timeSeconds: this.frameCount / 60,
      kills: this.state.enemies.filter(e => e.type === EntityType.ENEMY && e.state === EnemyState.DEAD).length,
      stealthRating: this.state.enemies.some(e => e.state === EnemyState.COMBAT) ? 20 : 90,
      lethality: 'high'
    };
    this.state.history.push(outcome);
    this.state.isMissionActive = false;
  }

  public fireProjectile(ownerId: string, pos: Vector2, rotation: number, speed: number) {
    const offset = 25;
    this.state.projectiles.push({
      id: Math.random().toString(),
      pos: { 
        x: pos.x + Math.cos(rotation) * offset, 
        y: pos.y + Math.sin(rotation) * offset 
      },
      velocity: {
        x: Math.cos(rotation) * speed,
        y: Math.sin(rotation) * speed
      },
      ownerId,
      damage: 12
    });
  }

  public handleInput(keys: Set<string>, mouse: Vector2, isMouseDown: boolean) {
    const speed = 200;
    let vx = 0, vy = 0;
    if (keys.has('w')) vy -= speed;
    if (keys.has('s')) vy += speed;
    if (keys.has('a')) vx -= speed;
    if (keys.has('d')) vx += speed;

    this.state.player.velocity = { x: vx, y: vy };
    this.state.player.rotation = Math.atan2(mouse.y - this.state.player.pos.y, mouse.x - this.state.player.pos.x);

    if (isMouseDown && this.frameCount % 10 === 0) {
      this.fireProjectile('player', this.state.player.pos, this.state.player.rotation, 700);
    }
  }

  public updateDialogue(text: string) {
    this.state.lastDialogue = text;
  }

  public getState() { return this.state; }
}
