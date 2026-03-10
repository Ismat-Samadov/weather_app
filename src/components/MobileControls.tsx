"use client";

/**
 * MobileControls — large on-screen left/right buttons rendered at the bottom
 * of the game viewport.  Sends input via the shared inputRef.
 */

import { useEffect, RefObject } from "react";
import type { InputState } from "@/lib/types";

interface MobileControlsProps {
  inputRef: RefObject<InputState>;
}

export default function MobileControls({ inputRef }: MobileControlsProps) {
  // Prevent context menus on long-press (common mobile annoyance)
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    return () => document.removeEventListener("contextmenu", prevent);
  }, []);

  const startLeft  = () => { inputRef.current.left  = true;  };
  const stopLeft   = () => { inputRef.current.left  = false; };
  const startRight = () => { inputRef.current.right = true;  };
  const stopRight  = () => { inputRef.current.right = false; };

  const btnBase =
    "select-none flex items-center justify-center rounded-full border active:scale-95 transition-transform";

  const btnStyle = {
    width: "72px",
    height: "72px",
    background: "rgba(68,153,255,0.10)",
    borderColor: "rgba(68,153,255,0.35)",
    color: "#4499ffcc",
    boxShadow: "0 0 16px rgba(68,153,255,0.20)",
    fontSize: "1.6rem",
    touchAction: "none" as const,
    userSelect: "none" as const,
    WebkitUserSelect: "none" as const,
  };

  return (
    <div
      className="absolute inset-x-0 bottom-4 z-10 flex justify-between px-6 pointer-events-none"
      aria-label="Mobile game controls"
    >
      {/* Left button */}
      <button
        className={`${btnBase} pointer-events-auto`}
        style={btnStyle}
        onPointerDown={startLeft}
        onPointerUp={stopLeft}
        onPointerLeave={stopLeft}
        onPointerCancel={stopLeft}
        aria-label="Move left"
      >
        ◀
      </button>

      {/* Right button */}
      <button
        className={`${btnBase} pointer-events-auto`}
        style={btnStyle}
        onPointerDown={startRight}
        onPointerUp={stopRight}
        onPointerLeave={stopRight}
        onPointerCancel={stopRight}
        aria-label="Move right"
      >
        ▶
      </button>
    </div>
  );
}
