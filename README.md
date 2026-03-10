# Doodle Jump — Neon Edition

A full-stack, browser-based platformer built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**, rendered on an **HTML5 Canvas** with a glowing neon aesthetic. Jump as high as you can, land on platforms, and beat your high score!

---

## Features

- **Neon visual theme** — dark background, glowing platforms & player, parallax stars
- **5 platform types**
  - 🟦 **Static** — always there, safe to land on
  - 🔵 **Moving** — slides horizontally; direction arrow shown
  - 🟠 **Breaking** — cracks and disappears on the first jump
  - 🟡 **Spring** — animated coil that launches you extra high
  - 🟣 **Disappearing** — fades out immediately after being stepped on
- **Physics engine** — gravity, squash-and-stretch animation, screen-edge wrap
- **Particle effects** — glowing burst on every jump
- **Procedural audio** — synthesised jump, spring, break, game-over, and level-up sounds via the Web Audio API (no external files)
- **Score & high score** — persisted across sessions via `localStorage`
- **Level progression** — 8 levels; platform gaps widen and dangerous types increase as you climb
- **3 difficulty modes** — Easy / Medium / Hard (configurable on the start screen)
- **Pause / Resume** — `P` key or pause button in the HUD
- **Animated menus** — smooth framer-motion transitions on all overlays
- **Fully responsive** — scales to fill any viewport while maintaining the 2:3 aspect ratio
- **Mobile-first touch controls** — large on-screen left/right buttons
- **Deploy-ready for Vercel** — zero config required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Rendering | HTML5 Canvas 2D |
| Audio | Web Audio API (procedural) |
| Storage | `localStorage` |
| Deploy | Vercel |

---

## Controls

### Desktop (keyboard)

| Key | Action |
|---|---|
| `←` / `A` | Move left |
| `→` / `D` | Move right |
| `P` / `Escape` | Pause / Resume |
| `Space` | Resume (when paused) |

### Mobile (touch)

| Control | Action |
|---|---|
| Left button (bottom-left) | Move left |
| Right button (bottom-right) | Move right |

---

## How to Run Locally

### Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd doodle_jump

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in your browser
open http://localhost:3000
```

### Build for production

```bash
npm run build
npm start
```

---

## Deploy to Vercel

The project is pre-configured for Vercel — no extra setup required.

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B — Vercel Dashboard

1. Push the project to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com](https://vercel.com) → **New Project**.
3. Import the repository.
4. Click **Deploy** — Vercel auto-detects Next.js settings.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Global styles & neon CSS variables
│   ├── layout.tsx         # Root layout with metadata & favicon
│   └── page.tsx           # Entry page (renders <Game />)
├── components/
│   ├── Game.tsx           # Top-level game component (canvas + overlays)
│   ├── HUD.tsx            # Score / level / pause HUD overlay
│   ├── GameMenu.tsx       # Start / pause / game-over animated screen
│   └── MobileControls.tsx # On-screen touch buttons
├── hooks/
│   └── useGameEngine.ts   # Game loop, physics, rendering (canvas)
└── lib/
    ├── types.ts           # TypeScript interfaces
    ├── constants.ts       # Physics & visual constants
    └── audio.ts           # Procedural Web Audio API sounds
public/
└── favicon.svg            # Neon character favicon
```

---

## License

MIT
