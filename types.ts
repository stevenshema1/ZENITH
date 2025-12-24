
export type MissionOutcome = {
  success: boolean;
  timeSeconds: number;
  kills: number;
  stealthRating: number; // 0-100
  lethality: 'low' | 'medium' | 'high';
};

export type MissionParams = {
  location: string;
  objective: string;
  environment: {
    weather: string;
    lighting: string;
    hazards: string[];
  };
  enemyConfig: {
    density: number;
    types: string[];
    tactics: string[];
  };
  narrativeBrief: string;
};

export type Vector2 = { x: number; y: number };

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  CIVILIAN = 'CIVILIAN',
  TARGET = 'TARGET'
}

export enum EnemyState {
  IDLE = 'IDLE',
  PATROL = 'PATROL',
  ALERT = 'ALERT',
  COMBAT = 'COMBAT',
  DEAD = 'DEAD'
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  health: number;
  maxHealth: number;
  rotation: number;
  velocity: Vector2;
  state: EnemyState;
  color: string;
  plan?: string[];
}

export interface GameState {
  player: Entity;
  enemies: Entity[];
  projectiles: Projectile[];
  walls: Wall[];
  mission: MissionParams | null;
  history: MissionOutcome[];
  isGameOver: boolean;
  lastDialogue: string;
  isMissionActive: boolean;
}

export interface Projectile {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  ownerId: string;
  damage: number;
}

export interface Wall {
  start: Vector2;
  end: Vector2;
  destructible: boolean;
  health?: number;
}
