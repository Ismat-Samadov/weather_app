"use client";

/**
 * Game — top-level component that wires together:
 *   • The HTML5 Canvas (scaled to fit the viewport)
 *   • useGameEngine (physics + rendering loop)
 *   • HUD overlay (score, level, pause button)
 *   • GameMenu overlay (start / pause / game-over screens)
 *   • MobileControls (on-screen left/right buttons)
 *   • Keyboard input listener
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";
import HUD from "./HUD";
import GameMenu from "./GameMenu";
import MobileControls from "./MobileControls";
import { GAME_WIDTH, GAME_HEIGHT } from "@/lib/constants";
import type { Difficulty } from "@/lib/types";
import { isAudioEnabled, setAudioEnabled } from "@/lib/audio";

export default function Game() {
  // ── Canvas ref ──────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Game engine ─────────────────────────────────────────────────────────
  const { snapshot, inputRef, startGame, pauseGame, resumeGame, setDifficulty } =
    useGameEngine(canvasRef);

  // ── Audio toggle ────────────────────────────────────────────────────────
  const [audioEnabled, setAudioEnabledState] = useState(true);
  const toggleAudio = useCallback(() => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    setAudioEnabledState(next);
  }, [audioEnabled]);

  // ── Keyboard input ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") inputRef.current.left  = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") inputRef.current.right = true;
      if ((e.key === "Escape" || e.key === "p" || e.key === "P") && snapshot.status === "playing") pauseGame();
      if ((e.key === "Escape" || e.key === "p" || e.key === "P") && snapshot.status === "paused")  resumeGame();
      if (e.key === " " && snapshot.status === "paused") resumeGame();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") inputRef.current.left  = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") inputRef.current.right = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
    };
  }, [inputRef, pauseGame, resumeGame, snapshot.status]);

  // ── Canvas CSS scaling ───────────────────────────────────────────────────
  // The canvas internal resolution is fixed at GAME_WIDTH × GAME_HEIGHT.
  // We use CSS to scale it uniformly so it fits inside the viewport.
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / GAME_WIDTH, vh / GAME_HEIGHT, 1.6); // cap at 1.6×
      setScale(s);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleStart = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
      startGame(d);
    },
    [startGame, setDifficulty]
  );

  const handleDifficultyChange = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
    },
    [setDifficulty]
  );

  return (
    /* Full-viewport dark wrapper */
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: "#060614" }}
    >
      {/* Scaled game container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl"
        style={{
          width:  GAME_WIDTH  * scale,
          height: GAME_HEIGHT * scale,
          boxShadow: "0 0 60px rgba(68,153,255,0.25), 0 0 120px rgba(68,153,255,0.08)",
          border: "1px solid rgba(68,153,255,0.18)",
        }}
      >
        {/* The actual canvas — CSS-scaled but internal resolution stays 400×600 */}
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            width:  GAME_WIDTH  * scale,
            height: GAME_HEIGHT * scale,
            display: "block",
            imageRendering: "pixelated",
          }}
        />

        {/* HUD — only visible while playing or paused */}
        {(snapshot.status === "playing" || snapshot.status === "paused") && (
          <HUD
            score={snapshot.score}
            highScore={snapshot.highScore}
            level={snapshot.level}
            onPause={pauseGame}
          />
        )}

        {/* Menu / Pause / Game-Over overlay */}
        <GameMenu
          status={snapshot.status}
          score={snapshot.score}
          highScore={snapshot.highScore}
          difficulty={snapshot.difficulty}
          onStart={handleStart}
          onResume={resumeGame}
          onDifficultyChange={handleDifficultyChange}
          audioEnabled={audioEnabled}
          onToggleAudio={toggleAudio}
        />

        {/* Mobile on-screen controls (always rendered; hidden on large screens via CSS) */}
        {snapshot.status === "playing" && (
          <MobileControls inputRef={inputRef} />
        )}
      </div>

      {/* Keyboard hint — desktop only */}
      {snapshot.status === "playing" && (
        <p
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest hidden md:block"
          style={{ color: "#4499ff44" }}
        >
          ← → to move · P to pause
        </p>
      )}
    </div>
  );
}
