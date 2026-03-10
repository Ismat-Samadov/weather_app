"use client";

/**
 * HUD — Heads-Up Display rendered as DOM elements floating above the canvas.
 * Shows score, high-score, level, and a pause button.
 */

import { motion } from "framer-motion";

interface HUDProps {
  score: number;
  highScore: number;
  level: number;
  onPause: () => void;
}

export default function HUD({ score, highScore, level, onPause }: HUDProps) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between px-3 pt-2 pointer-events-none select-none">
      {/* Score */}
      <div className="flex flex-col">
        <motion.span
          key={score}
          initial={{ scale: 1.3, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="text-2xl font-bold tabular-nums"
          style={{ color: "#00ffcc", textShadow: "0 0 12px #00ffcc" }}
        >
          {score.toLocaleString()}
        </motion.span>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "#00ffcc88" }}>
          Score
        </span>
      </div>

      {/* Level badge */}
      <div className="flex flex-col items-center">
        <span
          className="text-xs font-semibold px-3 py-0.5 rounded-full border"
          style={{
            color: "#cc44ff",
            borderColor: "#cc44ff66",
            textShadow: "0 0 8px #cc44ff",
            background: "rgba(204,68,255,0.1)",
          }}
        >
          LVL {level + 1}
        </span>
      </div>

      {/* High-score + pause */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex flex-col items-end">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: "#ffee22", textShadow: "0 0 10px #ffee22" }}
          >
            {highScore.toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "#ffee2288" }}>
            Best
          </span>
        </div>

        {/* Pause button — re-enabled for pointer events */}
        <button
          onClick={onPause}
          className="pointer-events-auto mt-1 w-8 h-8 flex items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95"
          style={{
            borderColor: "#4499ff66",
            background: "rgba(68,153,255,0.12)",
            color: "#4499ff",
          }}
          aria-label="Pause"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="4" height="12" rx="1" />
            <rect x="8" y="1" width="4" height="12" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
