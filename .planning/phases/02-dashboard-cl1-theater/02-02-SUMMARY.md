---
phase: 02-dashboard-cl1-theater
plan: 02
subsystem: frontend-visualization
tags: [canvas, animation, neuron-grid, positions, confidence, bio-stats]
depends_on:
  requires: ["02-01"]
  provides: ["neuron-grid", "bio-stats", "stats-display", "positions-panel", "confidence-calc"]
  affects: ["02-03"]
tech-stack:
  added: []
  patterns: ["IIFE modules", "requestAnimationFrame loop", "EMA smoothing", "DOM rendering"]
key-files:
  created:
    - public/js/neuron-grid.js
    - public/css/neuron-grid.css
    - public/js/bio-stats.js
    - public/js/stats.js
    - public/js/confidence.js
    - public/js/positions.js
  modified:
    - public/index.html
    - public/css/main.css
metrics:
  duration: "2 min"
  completed: "2026-03-09"
---

# Phase 02 Plan 02: Neuron Grid, Positions Panel, Bio-Stats Summary

Canvas-based 8x8 MEA neuron grid with ambient animation and trading event reactions, positions panel with neural confidence bars, and biological stats derived from real trading data.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Neuron grid canvas and bio-stats system | 91bf106 | neuron-grid.js, bio-stats.js, stats.js, neuron-grid.css |
| 2 | Positions panel with confidence bars | e98f9d0 | positions.js, confidence.js |

## What Was Built

### Neuron Grid (neuron-grid.js)
- 8x8 tile array with typed distribution (70% autonomous/teal, 20% stimulated/olive, 10% accent/pink)
- HiDPI-aware canvas rendering with devicePixelRatio scaling
- requestAnimationFrame loop with 100ms delta cap to prevent tab-switch jumps
- Lerp-based intensity animation with ambient drift (3-5 random tiles every 2s)
- Connection lines between active tiles (intensity > 0.5, within 2 tile distance)
- White electrode dots at tile centers
- Trading event reactions: burst (signals), wave from center (trade executed), dim+recover (position closed), subtle pulse (price updates)

### Bio-Stats (bio-stats.js)
- Coherence: EMA-smoothed (alpha=0.1) from win/loss outcomes
- Entropy: derived from actual price change percentages, EMA-smoothed
- Firing Rate: rolling 60s event timestamp window
- Win Rate: closedWins/closedTotal ratio from real position closes
- Slow drift: random walk every 2s on coherence (+/-0.005) and entropy (+/-0.008)

### Stats Display (stats.js)
- Cached DOM references to stat value elements
- 1s polling interval + immediate update on BioStats changes
- Pulse animation (CSS class) when values change > 5%

### Positions Panel (positions.js)
- Renders position cards with mint (shortened), entry price, current price, PNL %
- PNL color-coded green/red
- Handles snapshot, opened, updated, closed, and price:updated messages
- Fade-out animation on position close

### Confidence Calculation (confidence.js)
- 40% price momentum: PNL mapped from [-50%, +200%] to [0, 1]
- 30% time held: rises 0-10min, peaks 10-20min, decays after 30min
- 30% volume proxy: BioStats.firingRate / 60, capped at 1.0
- Color gradient: red (0%) -> yellow (50%) -> teal (100%)
- Glow effect on confidence > 75%

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| IIFE pattern for all modules | Consistent with 02-01 decision, avoids global pollution |
| Confidence recalculation every 2s | Balances responsiveness with DOM update frequency |
| EMA smoothing on coherence/entropy | Prevents jarring jumps, creates smooth biological feel |
| Position card styles in main.css | Avoids another CSS file, styles are tightly coupled to dashboard |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] Neuron grid canvas renders 8x8 tiles with animation
- [x] Connection lines drawn between active tiles
- [x] Trading events cause distinct visual reactions
- [x] Bio-stats derive from real data (not random noise)
- [x] Stats bar updates from BioStats with pulse animation
- [x] Positions panel renders cards with PNL and confidence bars
- [x] Confidence uses momentum + time + volume factors
- [x] Empty state handled gracefully
- [x] No memory leaks from animation loop (delta capped, intervals managed)

## Next Phase Readiness

All visualization modules expose handleMessage() for app.js to route WebSocket messages. Plan 02-03 (running in parallel) handles the terminal panel and will wire up the message routing in app.js.
