"use client";

/**
 * GameMenu — animated overlay for: main menu, pause screen, and game-over screen.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { Difficulty, GameStatus } from "@/lib/types";

interface GameMenuProps {
  status: GameStatus;
  score: number;
  highScore: number;
  difficulty: Difficulty;
  onStart: (d: Difficulty) => void;
  onResume: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

const DIFFICULTIES: { key: Difficulty; label: string; color: string }[] = [
  { key: "easy",   label: "Easy",   color: "#44ff66" },
  { key: "medium", label: "Medium", color: "#ffee22" },
  { key: "hard",   label: "Hard",   color: "#ff6622" },
];

export default function GameMenu({
  status,
  score,
  highScore,
  difficulty,
  onStart,
  onResume,
  onDifficultyChange,
  audioEnabled,
  onToggleAudio,
}: GameMenuProps) {
  const visible = status === "menu" || status === "paused" || status === "gameover";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          style={{ background: "rgba(6,6,20,0.82)", backdropFilter: "blur(6px)" }}
        >
          {/* ── Title ──────────────────────────────────────────────── */}
          {status === "menu" && (
            <>
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="text-center mb-2"
              >
                <div
                  className="text-5xl font-black tracking-tight leading-none"
                  style={{ color: "#44ff66", textShadow: "0 0 28px #44ff66, 0 0 60px #44ff6688" }}
                >
                  DOODLE
                </div>
                <div
                  className="text-5xl font-black tracking-tight leading-none"
                  style={{ color: "#00ffcc", textShadow: "0 0 28px #00ffcc, 0 0 60px #00ffcc88" }}
                >
                  JUMP
                </div>
                <p className="mt-3 text-xs tracking-widest uppercase" style={{ color: "#4499ff99" }}>
                  Neon Edition
                </p>
              </motion.div>

              {/* Best score badge */}
              {highScore > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mb-5 text-sm"
                  style={{ color: "#ffee22", textShadow: "0 0 10px #ffee22" }}
                >
                  Best: {highScore.toLocaleString()}
                </motion.div>
              )}
              {!highScore && <div className="mb-5" />}
            </>
          )}

          {/* ── Game Over ──────────────────────────────────────────── */}
          {status === "gameover" && (
            <motion.div
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-center mb-6"
            >
              <div
                className="text-4xl font-black tracking-tight"
                style={{ color: "#ff6622", textShadow: "0 0 24px #ff6622" }}
              >
                GAME OVER
              </div>
              <div className="mt-3 flex flex-col items-center gap-1">
                <span className="text-3xl font-bold tabular-nums" style={{ color: "#00ffcc", textShadow: "0 0 12px #00ffcc" }}>
                  {score.toLocaleString()}
                </span>
                <span className="text-xs uppercase tracking-widest" style={{ color: "#00ffcc88" }}>
                  Score
                </span>
                {score >= highScore && score > 0 && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="mt-1 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ color: "#ffee22", background: "rgba(255,238,34,0.15)", textShadow: "0 0 10px #ffee22" }}
                  >
                    New Best!
                  </motion.span>
                )}
                {score < highScore && (
                  <span className="mt-1 text-xs" style={{ color: "#ffffff55" }}>
                    Best: {highScore.toLocaleString()}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Paused ─────────────────────────────────────────────── */}
          {status === "paused" && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-center mb-6"
            >
              <div
                className="text-4xl font-black tracking-tight"
                style={{ color: "#4499ff", textShadow: "0 0 24px #4499ff" }}
              >
                PAUSED
              </div>
              <p className="mt-2 text-sm" style={{ color: "#4499ff88" }}>
                Score: {score.toLocaleString()}
              </p>
            </motion.div>
          )}

          {/* ── Difficulty selector (menu + gameover) ──────────────── */}
          {(status === "menu" || status === "gameover") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 mb-5"
            >
              {DIFFICULTIES.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => onDifficultyChange(key)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all hover:scale-105 active:scale-95"
                  style={{
                    color: difficulty === key ? color : "#ffffff66",
                    borderColor: difficulty === key ? color : "#ffffff22",
                    background: difficulty === key ? `${color}22` : "transparent",
                    textShadow: difficulty === key ? `0 0 8px ${color}` : "none",
                    boxShadow: difficulty === key ? `0 0 12px ${color}44` : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Action buttons ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center gap-3"
          >
            {status === "paused" ? (
              <ActionButton color="#4499ff" onClick={onResume}>
                ▶ Resume
              </ActionButton>
            ) : (
              <ActionButton color="#44ff66" onClick={() => onStart(difficulty)}>
                {status === "gameover" ? "▶ Play Again" : "▶ Play"}
              </ActionButton>
            )}

            {status === "paused" && (
              <button
                onClick={() => onStart(difficulty)}
                className="text-xs uppercase tracking-widest transition-all hover:scale-105"
                style={{ color: "#ff662299" }}
              >
                Restart
              </button>
            )}
          </motion.div>

          {/* ── Audio toggle ─────────────────────────────────────────── */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onToggleAudio}
            className="mt-6 flex items-center gap-2 text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            style={{ color: audioEnabled ? "#00ffcc88" : "#ffffff33" }}
          >
            <span>{audioEnabled ? "🔊" : "🔇"}</span>
            <span>Sound {audioEnabled ? "On" : "Off"}</span>
          </motion.button>

          {/* ── Controls hint ────────────────────────────────────────── */}
          {status === "menu" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-5 text-[10px] text-center px-4 leading-loose uppercase tracking-widest"
              style={{ color: "#ffffff33" }}
            >
              ← → Arrow keys / A D · Touch buttons on mobile
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Small helper component ───────────────────────────────────────────────────

function ActionButton({
  children,
  color,
  onClick,
}: {
  children: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="px-10 py-3 rounded-full font-bold text-base uppercase tracking-widest border transition-all"
      style={{
        color,
        borderColor: `${color}88`,
        background: `${color}1a`,
        textShadow: `0 0 10px ${color}`,
        boxShadow: `0 0 20px ${color}44, inset 0 0 20px ${color}0a`,
      }}
    >
      {children}
    </motion.button>
  );
}
