/** All numeric and configuration constants for the game */

// ─── Canvas / world dimensions ──────────────────────────────────────────────
export const GAME_WIDTH  = 400;
export const GAME_HEIGHT = 600;

// ─── Physics ─────────────────────────────────────────────────────────────────
/** Gravity acceleration (pixels per fixed step, downward) */
export const GRAVITY = 0.48;
/** Normal jump: player velocity when bouncing off a platform */
export const JUMP_VELOCITY = -14.5;
/** Spring boost: extra upward velocity from spring platforms */
export const SPRING_VELOCITY = -22;
/** Horizontal speed */
export const PLAYER_MOVE_SPEED = 5.5;
/** Cap downward speed */
export const MAX_FALL_SPEED = 22;

// ─── Player ──────────────────────────────────────────────────────────────────
export const PLAYER_W = 38;
export const PLAYER_H = 40;
/** World Y at which the player starts (near bottom of initial screen) */
export const PLAYER_START_Y = GAME_HEIGHT - 180;

// ─── Platforms ───────────────────────────────────────────────────────────────
export const PLATFORM_W = 72;
export const PLATFORM_H = 14;

// ─── Camera ───────────────────────────────────────────────────────────────────
/**
 * Camera keeps the player at this fraction from the top.
 * 0.4 = player is kept 40 % down from the top of the screen.
 */
export const CAMERA_FOLLOW_FRAC = 0.4;

// ─── Score ───────────────────────────────────────────────────────────────────
/** Multiply –cameraY by this to get the displayed score */
export const SCORE_SCALE = 0.08;

// ─── Level thresholds (score points) ─────────────────────────────────────────
export const LEVEL_THRESHOLDS = [0, 400, 1000, 2000, 3500, 5500, 8000, 12000];

// ─── Platform generation ──────────────────────────────────────────────────────
/** How far above the visible screen top we keep platforms pre-generated */
export const PLATFORM_BUFFER = 250;
/** Min vertical gap between successive platforms */
export const PLATFORM_GAP_MIN = 55;

/** Max gap by difficulty (easy → hard) */
export const PLATFORM_GAP_MAX: Record<string, number> = {
  easy:   88,
  medium: 115,
  hard:   145,
};

/** Probability of each platform type by level index [static, moving, breaking, spring, disappearing] */
export const PLATFORM_TYPE_PROBS: [number, number, number, number, number][] = [
  [1.00, 0.00, 0.00, 0.05, 0.00], // level 1
  [0.85, 0.10, 0.00, 0.05, 0.00], // level 2
  [0.75, 0.15, 0.05, 0.05, 0.00], // level 3
  [0.65, 0.15, 0.10, 0.05, 0.05], // level 4
  [0.55, 0.20, 0.12, 0.05, 0.08], // level 5
  [0.45, 0.22, 0.15, 0.05, 0.13], // level 6
  [0.40, 0.22, 0.18, 0.05, 0.15], // level 7
  [0.35, 0.22, 0.20, 0.05, 0.18], // level 8
];

/** Fixed-timestep duration in ms (60 Hz logic) */
export const FIXED_STEP_MS = 1000 / 60;

/** Neon colour palette */
export const COLORS = {
  bg1:          "#060614",
  bg2:          "#0c0c28",
  platform: {
    static:       "#00ffcc",
    moving:       "#4499ff",
    breaking:     "#ff6622",
    spring:       "#ffee22",
    disappearing: "#cc44ff",
  },
  glow: {
    static:       "#00ffcc",
    moving:       "#4499ff",
    breaking:     "#ff4400",
    spring:       "#ffee22",
    disappearing: "#bb33ee",
  },
  player:       "#44ff66",
  playerGlow:   "#44ff44",
  particle:     ["#00ffcc", "#4499ff", "#44ff66", "#ffee22", "#ff6622", "#cc44ff"],
} as const;

/** Number of background stars */
export const NUM_STARS = 80;

/** How many initial platforms to place */
export const NUM_INITIAL_PLATFORMS = 13;
