"use client";

/**
 * useGameEngine
 * ─────────────
 * Owns the entire game loop (physics + rendering) via refs so React never
 * re-renders on every frame.  Only a lightweight `GameSnapshot` is pushed to
 * React state (≈ 10 fps) so the HUD and menus stay in sync.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Difficulty,
  GameSnapshot,
  GameStateRef,
  InputState,
  Particle,
  Platform,
  PlatformType,
  Star,
} from "@/lib/types";
import {
  CAMERA_FOLLOW_FRAC,
  COLORS,
  FIXED_STEP_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRAVITY,
  JUMP_VELOCITY,
  LEVEL_THRESHOLDS,
  MAX_FALL_SPEED,
  NUM_INITIAL_PLATFORMS,
  NUM_STARS,
  PLATFORM_BUFFER,
  PLATFORM_GAP_MAX,
  PLATFORM_GAP_MIN,
  PLATFORM_H,
  PLATFORM_TYPE_PROBS,
  PLATFORM_W,
  PLAYER_H,
  PLAYER_MOVE_SPEED,
  PLAYER_START_Y,
  PLAYER_W,
  SCORE_SCALE,
  SPRING_VELOCITY,
} from "@/lib/constants";
import {
  playBreak,
  playGameOver,
  playJump,
  playLand,
  playLevelUp,
  playSpring,
} from "@/lib/audio";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Draw a rounded rectangle path (no fill/stroke — caller does that). */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Weighted random selection from a probability array [p0, p1, …].
 *  Returns the index whose "bucket" contains a uniform random number. */
function weightedRandom(weights: number[]): number {
  const r = Math.random() * weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
}

const PLATFORM_TYPE_KEYS: PlatformType[] = [
  "static",
  "moving",
  "breaking",
  "spring",
  "disappearing",
];

/** Choose a platform type based on current level probabilities. */
function choosePlatformType(level: number): PlatformType {
  const idx = Math.min(level, PLATFORM_TYPE_PROBS.length - 1);
  const probs = PLATFORM_TYPE_PROBS[idx];
  return PLATFORM_TYPE_KEYS[weightedRandom([...probs])];
}

/** Create a new platform object. */
function makePlatform(
  id: number,
  x: number,
  y: number,
  type: PlatformType
): Platform {
  return {
    id,
    x,
    y,
    w: PLATFORM_W,
    h: PLATFORM_H,
    type,
    vx: type === "moving" ? (Math.random() < 0.5 ? 1.5 : -1.5) : 0,
    broken: false,
    opacity: 1,
    springBounce: 0,
  };
}

/** Create random background stars spread across the initial visible area. */
function makeStars(): Star[] {
  return Array.from({ length: NUM_STARS }, () => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT * 20, // spread over a large world height
    size: Math.random() * 1.5 + 0.3,
    opacity: Math.random() * 0.6 + 0.2,
    twinklePhase: Math.random() * Math.PI * 2,
  }));
}

/** Emit jump particles at a world position. */
function spawnParticles(
  particles: Particle[],
  wx: number,
  wy: number,
  color: string,
  count = 8
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x: wx,
      y: wy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 30,
      maxLife: 30,
      color,
      size: Math.random() * 3 + 1,
    });
  }
}

// ─── Initialisation ───────────────────────────────────────────────────────────

function buildInitialState(difficulty: Difficulty): GameStateRef {
  const platforms: Platform[] = [];

  // Always place a guaranteed static platform directly under the player
  const startPlatformY = PLAYER_START_Y + PLAYER_H + 4;
  platforms.push(makePlatform(0, GAME_WIDTH / 2 - PLATFORM_W / 2, startPlatformY, "static"));

  // Fill the initial screen with platforms bottom→top
  let nextY = startPlatformY;
  for (let i = 1; i < NUM_INITIAL_PLATFORMS; i++) {
    const gap = PLATFORM_GAP_MIN + Math.random() * 30;
    nextY -= gap;
    const x = Math.random() * (GAME_WIDTH - PLATFORM_W);
    platforms.push(makePlatform(i, x, nextY, "static")); // all static at start
  }

  return {
    status: "menu",
    player: {
      x: GAME_WIDTH / 2 - PLAYER_W / 2,
      y: PLAYER_START_Y,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: JUMP_VELOCITY,  // start with an upward velocity
      facingRight: true,
      squash: 0,
    },
    platforms,
    particles: [],
    stars: makeStars(),
    cameraY: 0,
    minCameraY: 0,
    nextPlatformY: nextY,
    score: 0,
    highScore: 0,
    level: 0,
    difficulty,
    frame: 0,
    platformIdCounter: NUM_INITIAL_PLATFORMS,
    screenShake: 0,
    lastTime: 0,
    accumulator: 0,
  };
}

// ─── Update (fixed-step) ──────────────────────────────────────────────────────

function update(s: GameStateRef, input: InputState): void {
  s.frame++;
  const p = s.player;

  // ── Input ────────────────────────────────────────────────────────────────
  if (input.left) {
    p.vx = -PLAYER_MOVE_SPEED;
    p.facingRight = false;
  } else if (input.right) {
    p.vx = PLAYER_MOVE_SPEED;
    p.facingRight = true;
  } else {
    p.vx *= 0.8;
  }

  // ── Physics ──────────────────────────────────────────────────────────────
  const prevBottom = p.y + p.h;

  p.vy = Math.min(p.vy + GRAVITY, MAX_FALL_SPEED);
  p.y += p.vy;
  p.x += p.vx;

  // Horizontal wrap
  if (p.x + p.w < 0) p.x = GAME_WIDTH;
  if (p.x > GAME_WIDTH) p.x = -p.w;

  // Squash decay
  if (p.squash > 0) p.squash = Math.max(0, p.squash - 0.08);

  // ── Platform collisions (only while falling) ──────────────────────────────
  if (p.vy > 0) {
    const currentBottom = p.y + p.h;

    for (const plat of s.platforms) {
      if (plat.broken) continue;
      if (plat.type === "disappearing" && plat.opacity <= 0.05) continue;

      // One-way platform: player must have been ABOVE the platform top last frame
      if (prevBottom <= plat.y && currentBottom >= plat.y) {
        // Horizontal overlap
        if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
          // ── Land ──────────────────────────────────────────────────────────
          p.y = plat.y - p.h;
          p.squash = 1;

          if (plat.type === "spring") {
            p.vy = SPRING_VELOCITY;
            plat.springBounce = 1;
            playSpring();
            spawnParticles(s.particles, p.x + p.w / 2, p.y + p.h, COLORS.glow.spring, 12);
          } else if (plat.type === "breaking") {
            plat.broken = true;
            p.vy = JUMP_VELOCITY;
            playBreak();
            spawnParticles(s.particles, plat.x + plat.w / 2, plat.y, COLORS.glow.breaking, 14);
          } else if (plat.type === "disappearing") {
            plat.opacity = 0; // start fading immediately
            p.vy = JUMP_VELOCITY;
            playJump();
            spawnParticles(s.particles, p.x + p.w / 2, p.y + p.h, COLORS.glow.disappearing, 8);
          } else {
            // static or moving
            p.vy = JUMP_VELOCITY;
            playJump();
            spawnParticles(s.particles, p.x + p.w / 2, p.y + p.h, COLORS.playerGlow, 8);
          }

          playLand();
          break;
        }
      }
    }
  }

  // ── Update moving platforms ───────────────────────────────────────────────
  for (const plat of s.platforms) {
    if (plat.type === "moving") {
      plat.x += plat.vx;
      if (plat.x <= 0 || plat.x + plat.w >= GAME_WIDTH) plat.vx *= -1;
    }
    if (plat.springBounce > 0) plat.springBounce = Math.max(0, plat.springBounce - 0.06);
    if (plat.type === "disappearing" && plat.opacity < 1) {
      plat.opacity = Math.max(0, plat.opacity - 0.025);
    }
  }

  // ── Camera ────────────────────────────────────────────────────────────────
  const targetCameraY = p.y - GAME_HEIGHT * CAMERA_FOLLOW_FRAC;
  if (targetCameraY < s.cameraY) {
    s.cameraY = targetCameraY;
    if (s.cameraY < s.minCameraY) s.minCameraY = s.cameraY;
  }

  // ── Score & level ─────────────────────────────────────────────────────────
  const newScore = Math.floor(-s.minCameraY * SCORE_SCALE);
  if (newScore > s.score) {
    s.score = newScore;
    if (s.score > s.highScore) s.highScore = s.score;
  }

  const newLevel = LEVEL_THRESHOLDS.findIndex((t, i) => {
    const next = LEVEL_THRESHOLDS[i + 1] ?? Infinity;
    return s.score >= t && s.score < next;
  });
  if (newLevel > s.level) {
    s.level = newLevel;
    playLevelUp();
  }

  // ── Generate new platforms ────────────────────────────────────────────────
  const generateThreshold = s.cameraY - PLATFORM_BUFFER;
  while (s.nextPlatformY > generateThreshold) {
    const maxGap = PLATFORM_GAP_MAX[s.difficulty] ?? 115;
    const gap = PLATFORM_GAP_MIN + Math.random() * (maxGap - PLATFORM_GAP_MIN);
    s.nextPlatformY -= gap;
    const x = Math.random() * (GAME_WIDTH - PLATFORM_W);
    const type = choosePlatformType(s.level);
    s.platforms.push(makePlatform(s.platformIdCounter++, x, s.nextPlatformY, type));
  }

  // ── Remove platforms that fell way below the screen ───────────────────────
  const removeThreshold = s.cameraY + GAME_HEIGHT + 100;
  s.platforms = s.platforms.filter((pl) => pl.y < removeThreshold);

  // ── Particles ─────────────────────────────────────────────────────────────
  for (const part of s.particles) {
    part.x += part.vx;
    part.y += part.vy;
    part.vy += 0.15;
    part.life--;
  }
  s.particles = s.particles.filter((pt) => pt.life > 0);

  // ── Screen shake decay ────────────────────────────────────────────────────
  if (s.screenShake > 0) s.screenShake = Math.max(0, s.screenShake - 0.5);

  // ── Game-over detection ───────────────────────────────────────────────────
  if (p.y > s.cameraY + GAME_HEIGHT + p.h) {
    s.status = "gameover";
    s.screenShake = 12;
    playGameOver();
    // Persist high score
    try {
      localStorage.setItem("doodleHighScore", String(s.highScore));
    } catch {
      // ignore
    }
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render(ctx: CanvasRenderingContext2D, s: GameStateRef): void {
  const { cameraY, frame } = s;

  // Screen shake transform
  const shakeX = s.screenShake > 0 ? (Math.random() - 0.5) * s.screenShake : 0;
  const shakeY = s.screenShake > 0 ? (Math.random() - 0.5) * s.screenShake : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // ── Background ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  bg.addColorStop(0, COLORS.bg1);
  bg.addColorStop(1, COLORS.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // ── Stars (subtle parallax at 0.15×) ─────────────────────────────────────
  for (const star of s.stars) {
    const screenY = ((star.y - cameraY * 0.15) % (GAME_HEIGHT * 1.5) + GAME_HEIGHT * 1.5) % (GAME_HEIGHT * 1.5);
    const alpha = star.opacity * (0.6 + 0.4 * Math.sin(frame * 0.025 + star.twinklePhase));
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(star.x, screenY, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Platforms ─────────────────────────────────────────────────────────────
  for (const plat of s.platforms) {
    const sy = plat.y - cameraY;
    if (sy < -PLATFORM_H - 5 || sy > GAME_HEIGHT + 5) continue;
    drawPlatform(ctx, plat, sy, frame);
  }

  // ── Player ────────────────────────────────────────────────────────────────
  const py = s.player.y - cameraY;
  drawPlayer(ctx, s.player, py, frame);

  // ── Particles ─────────────────────────────────────────────────────────────
  for (const part of s.particles) {
    const sy = part.y - cameraY;
    if (sy < -5 || sy > GAME_HEIGHT + 5) continue;
    const alpha = part.life / part.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = part.color;
    ctx.shadowColor = part.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(part.x, sy, part.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Platform renderer ────────────────────────────────────────────────────────

function drawPlatform(
  ctx: CanvasRenderingContext2D,
  plat: Platform,
  sy: number,
  frame: number
): void {
  const fillColor = COLORS.platform[plat.type];
  const glowColor = COLORS.glow[plat.type];

  ctx.save();
  ctx.globalAlpha = plat.type === "disappearing" ? plat.opacity : 1;

  // Glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = plat.type === "breaking" && plat.broken ? 4 : 14;

  // Body
  ctx.fillStyle = fillColor;
  roundRectPath(ctx, plat.x, sy, plat.w, plat.h, 6);
  ctx.fill();

  // Highlight stripe
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  roundRectPath(ctx, plat.x + 3, sy + 2, plat.w - 6, 4, 2);
  ctx.fill();

  // ── Type-specific decorations ──────────────────────────────────────────
  if (plat.type === "moving") {
    // Animated arrow indicating direction
    const arrowX = plat.x + plat.w / 2;
    const arrowY = sy + plat.h / 2;
    const dir = plat.vx > 0 ? 1 : -1;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.moveTo(arrowX + dir * 6, arrowY);
    ctx.lineTo(arrowX + dir * 1, arrowY - 4);
    ctx.lineTo(arrowX + dir * 1, arrowY + 4);
    ctx.closePath();
    ctx.fill();
  }

  if (plat.type === "breaking") {
    if (plat.broken) {
      // Crack lines
      ctx.strokeStyle = "rgba(255,100,0,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plat.x + 10, sy + 2);
      ctx.lineTo(plat.x + 25, sy + PLATFORM_H - 2);
      ctx.moveTo(plat.x + 40, sy + 1);
      ctx.lineTo(plat.x + 55, sy + PLATFORM_H - 1);
      ctx.stroke();
    } else {
      // Faint crack hint
      ctx.strokeStyle = "rgba(255,150,50,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plat.x + 20, sy + 3);
      ctx.lineTo(plat.x + 30, sy + PLATFORM_H - 3);
      ctx.stroke();
    }
  }

  if (plat.type === "spring") {
    // Animated spring coil on top
    const coilX = plat.x + plat.w / 2;
    const coilBaseY = sy;
    const bounce = plat.springBounce;
    const coilH = 12 + bounce * 8;
    ctx.strokeStyle = COLORS.glow.spring;
    ctx.shadowColor = COLORS.glow.spring;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const cx = coilX + Math.sin(t * Math.PI * 3) * 6;
      const cy = coilBaseY - t * coilH;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (plat.type === "disappearing") {
    // Flickering dots to indicate it will vanish
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.15);
    ctx.fillStyle = `rgba(255,255,255,${(pulse * 0.5).toFixed(2)})`;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(plat.x + 12 + i * 14, sy + PLATFORM_H / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ─── Player renderer ──────────────────────────────────────────────────────────

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: { x: number; y: number; w: number; h: number; vy: number; facingRight: boolean; squash: number },
  sy: number,
  _frame: number
): void {
  const { x, w, h, vy, facingRight, squash } = player;

  // Squash when landing, stretch when jumping fast
  const scaleX = 1 + squash * 0.25;
  const scaleY = 1 - squash * 0.2 + (vy < -8 ? 0.2 : 0);
  const cx = x + w / 2;
  const cy = sy + h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, scaleY);

  // Glow
  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 18;

  // Body
  ctx.fillStyle = COLORS.player;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.fill();

  // Inner highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  roundRectPath(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h / 2.5, 5);
  ctx.fill();

  // Eyes — shift based on direction
  const eyeOffsetX = facingRight ? 3 : -3;
  const eyePositions = [
    { x: eyeOffsetX - 7, y: -6 },
    { x: eyeOffsetX + 7, y: -6 },
  ];

  for (const ep of eyePositions) {
    // White sclera
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, 5, 0, Math.PI * 2);
    ctx.fill();
    // Pupil (looks in direction of movement)
    ctx.fillStyle = "#003300";
    ctx.beginPath();
    ctx.arc(ep.x + (facingRight ? 1.5 : -1.5), ep.y + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Glint
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(ep.x + (facingRight ? 0.5 : -0.5) - 0.5, ep.y - 0.5, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smile
  ctx.strokeStyle = "#003300";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(eyeOffsetX, 4, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const stateRef = useRef<GameStateRef>(buildInitialState("medium"));
  const inputRef = useRef<InputState>({ left: false, right: false });
  const frameIdRef = useRef<number>(0);
  const snapshotTimerRef = useRef<number>(0);

  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    status: "menu",
    score: 0,
    highScore: 0,
    level: 0,
    difficulty: "medium",
  });

  /** Push lightweight snapshot to React state (throttled). */
  const syncSnapshot = useCallback(() => {
    const s = stateRef.current;
    setSnapshot({
      status: s.status,
      score: s.score,
      highScore: s.highScore,
      level: s.level,
      difficulty: s.difficulty,
    });
  }, []);

  /** The main animation-frame loop. */
  const loop = useCallback(
    (timestamp: number) => {
      const s = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      if (s.lastTime === 0) s.lastTime = timestamp;
      const rawDt = Math.min(timestamp - s.lastTime, 100);
      s.lastTime = timestamp;

      if (s.status === "playing") {
        s.accumulator += rawDt;
        while (s.accumulator >= FIXED_STEP_MS) {
          update(s, inputRef.current);
          s.accumulator -= FIXED_STEP_MS;
        }
      }

      render(ctx2d, s);

      // Sync to React ~10 fps
      snapshotTimerRef.current += rawDt;
      if (snapshotTimerRef.current > 100) {
        snapshotTimerRef.current = 0;
        syncSnapshot();
      }

      frameIdRef.current = requestAnimationFrame(loop);
    },
    [canvasRef, syncSnapshot]
  );

  // Start the loop once on mount
  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [loop]);

  // ── Public control API ──────────────────────────────────────────────────────

  const startGame = useCallback((difficulty: Difficulty) => {
    const saved = Number(localStorage.getItem("doodleHighScore") ?? 0);
    const fresh = buildInitialState(difficulty);
    fresh.highScore = saved;
    fresh.status = "playing";
    fresh.lastTime = 0;
    stateRef.current = fresh;
    syncSnapshot();
  }, [syncSnapshot]);

  const pauseGame = useCallback(() => {
    if (stateRef.current.status === "playing") {
      stateRef.current.status = "paused";
      syncSnapshot();
    }
  }, [syncSnapshot]);

  const resumeGame = useCallback(() => {
    if (stateRef.current.status === "paused") {
      stateRef.current.status = "playing";
      stateRef.current.lastTime = 0;
      syncSnapshot();
    }
  }, [syncSnapshot]);

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      stateRef.current.difficulty = d;
      syncSnapshot();
    },
    [syncSnapshot]
  );

  return {
    snapshot,
    inputRef,
    startGame,
    pauseGame,
    resumeGame,
    setDifficulty,
  };
}
