/** All game-wide TypeScript types and interfaces */

export type PlatformType = "static" | "moving" | "breaking" | "spring" | "disappearing";

export type GameStatus = "menu" | "playing" | "paused" | "gameover";

export type Difficulty = "easy" | "medium" | "hard";

/** A platform in the game world */
export interface Platform {
  id: number;
  x: number;         // world X (left edge)
  y: number;         // world Y (top edge — Y increases downward)
  w: number;
  h: number;
  type: PlatformType;
  vx: number;        // horizontal velocity (moving platforms)
  broken: boolean;   // has this breaking platform already cracked?
  opacity: number;   // 0-1, used to fade disappearing platforms
  springBounce: number; // 0-1 spring-coil animation timer
}

/** The player character */
export interface Player {
  x: number;         // world X (left edge)
  y: number;         // world Y (top edge)
  w: number;
  h: number;
  vx: number;
  vy: number;
  facingRight: boolean;
  squash: number;    // 0 = normal, 1 = max squash (on landing)
}

/** A single particle emitted on jump/break */
export interface Particle {
  x: number;         // world X
  y: number;         // world Y
  vx: number;
  vy: number;
  life: number;      // frames remaining
  maxLife: number;
  color: string;
  size: number;
}

/** A background star (parallax) */
export interface Star {
  x: number;          // screen X (0..GAME_WIDTH)
  y: number;          // world Y at creation; scrolled with parallax
  size: number;
  opacity: number;
  twinklePhase: number;
}

/** All mutable game state stored in a ref (not React state) */
export interface GameStateRef {
  status: GameStatus;
  player: Player;
  platforms: Platform[];
  particles: Particle[];
  stars: Star[];
  cameraY: number;       // world Y of top of visible screen
  minCameraY: number;    // most-upward cameraY reached (drives score)
  nextPlatformY: number; // world Y of the most-recently generated platform
  score: number;
  highScore: number;
  level: number;
  difficulty: Difficulty;
  frame: number;
  platformIdCounter: number;
  screenShake: number;
  lastTime: number;
  accumulator: number;
}

/** Snapshot exposed to React UI (triggers re-renders) */
export interface GameSnapshot {
  status: GameStatus;
  score: number;
  highScore: number;
  level: number;
  difficulty: Difficulty;
}

/** Live input flags (keyboard + touch) */
export interface InputState {
  left: boolean;
  right: boolean;
}
