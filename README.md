# HomeRanking

A shared household-load tracker for two people. It scores chores on three
dimensions — **Effort**, **Aversion** and **Mental load** — so the invisible
half of running a home (noticing, planning, remembering, coordinating) is
counted rather than assumed.

- **[docs/SPEC.md](docs/SPEC.md)** — product and design spec, and the reasoning
  behind each decision.
- **[docs/CHORES.md](docs/CHORES.md)** — the 38 seed chores, the grading
  anchors, and the analysis. This file is the source of truth for
  `src/data/chores.ts`.

## Phase 1 (this build)

A working weekly tracker, stored in the browser on one device:

- a tab each, so tapping is unambiguous
- weekly counters with a `− n +` stepper — no daily logging, catch up any time
- the weekly total, counting up as you log
- a balance beam: two arms off a central fulcrum
- the Effort / Aversion / Mental load split for whoever's tab is open
- collapsible categories with progress against target
- light and dark, both designed

Not yet built: shared sync between phones (Phase 2), the weekly recap, streak
and monthly ranking (Phase 3), and the settings screen for editing chores and
scores (Phase 4). Until Phase 4, edit `docs/CHORES.md` and regenerate.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Deploying

Pushes to `main` build and publish to GitHub Pages via
`.github/workflows/deploy.yml`. Enable it once under **Settings → Pages →
Source → GitHub Actions**; the site then serves from
`https://compain-david.github.io/HomeRanking/`.

## Stack

React, Vite and TypeScript, with hand-written CSS built on custom properties.
No UI framework and no animation library — the interactions are few enough that
CSS transitions cover them, and fewer dependencies means less to break.

One rule runs through the styling: **colour means a person and nothing else.**
Alix and David are the only two saturated hues in the app; Effort, Aversion and
Mental load are told apart by tone of whoever's colour is active, never by
introducing more.
