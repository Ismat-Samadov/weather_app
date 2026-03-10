/**
 * Procedural audio via the Web Audio API.
 * No external files required — all sounds are synthesised on the fly.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = true;

/** Lazily create (or reuse) the AudioContext. */
function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);
  }
  // Mobile browsers suspend the context until a user gesture
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/** Toggle audio on/off globally. */
export function setAudioEnabled(on: boolean): void {
  enabled = on;
  if (masterGain) masterGain.gain.value = on ? 0.35 : 0;
}

export function isAudioEnabled(): boolean {
  return enabled;
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

/** Play a sine-wave sweep from `f0` → `f1` Hz over `dur` seconds. */
function sweep(f0: number, f1: number, dur: number, vol = 0.4): void {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(f1, now + dur);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(masterGain!);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  } catch {
    // Silently ignore if audio is not available
  }
}

/** Play a burst of white noise for `dur` seconds. */
function noise(dur: number, vol = 0.25): void {
  try {
    const ac = getCtx();
    const bufLen = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const gain = ac.createGain();
    const now = ac.currentTime;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(gain);
    gain.connect(masterGain!);
    src.start(now);
  } catch {
    // Silently ignore
  }
}

/** Play a short beep at frequency `f` Hz. */
function beep(f: number, dur: number, vol = 0.3): void {
  sweep(f, f, dur, vol);
}

// ─── Public sound effects ─────────────────────────────────────────────────────

/** Short upward sweep when the player bounces off a platform. */
export function playJump(): void {
  if (!enabled) return;
  sweep(280, 560, 0.12, 0.35);
}

/** Higher jump from a spring. */
export function playSpring(): void {
  if (!enabled) return;
  sweep(380, 900, 0.18, 0.4);
}

/** Crunch when a breaking platform shatters. */
export function playBreak(): void {
  if (!enabled) return;
  noise(0.12, 0.3);
}

/** Descending sweep when the player falls off screen. */
export function playGameOver(): void {
  if (!enabled) return;
  sweep(440, 80, 0.7, 0.45);
}

/** Short rising arpeggio on a score milestone. */
export function playLevelUp(): void {
  if (!enabled) return;
  const ac = getCtx();
  const notes = [523, 659, 784, 1047];
  const now = ac.currentTime;
  notes.forEach((freq, i) => {
    setTimeout(() => beep(freq, 0.12, 0.3), i * 80);
  });
  void now; // suppress unused warning
}

/** Soft click when the player first lands on any platform (optional feedback). */
export function playLand(): void {
  if (!enabled) return;
  sweep(200, 140, 0.07, 0.2);
}
