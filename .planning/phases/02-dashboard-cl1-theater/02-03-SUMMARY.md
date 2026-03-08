---
phase: 02-dashboard-cl1-theater
plan: 03
subsystem: dashboard-terminal
tags: [terminal, neural-narrative, idle-chatter, websocket-routing, frontend]
dependency-graph:
  requires: [02-01]
  provides: [terminal-console, message-router, idle-chatter]
  affects: [03-live-trading]
tech-stack:
  added: []
  patterns: [neural-narrative-mapping, idle-chatter-timer, dual-view-toggle, scroll-management]
key-files:
  created:
    - public/js/terminal.js
    - public/css/terminal.css
  modified:
    - public/js/app.js
    - public/index.html
decisions:
  - id: 02-03-01
    description: "Idle chatter uses setTimeout chain (not setInterval) for variable jitter"
  - id: 02-03-02
    description: "Structured view uses CSS border-left accents rather than DOM restructuring for toggle performance"
  - id: 02-03-03
    description: "Terminal appendLine resets idle timer only on non-idle events to prevent idle messages from suppressing themselves"
metrics:
  duration: 2 min
  completed: 2026-03-09
---

# Phase 02 Plan 03: Terminal Console + Message Router Summary

**Neural decision terminal with trade narratives, idle chatter, dual-view toggle, and complete WS message routing wired end-to-end.**

## What Was Done

### Task 1: Terminal console with neural narratives and idle chatter
- Created `public/js/terminal.js` exposing `window.Terminal` with `init()`, `handleMessage(msg)`, `appendLine(text, className)`
- Neural narrative mapping for all event types:
  - signal:detected -> coherence spike + pattern recognition
  - signal:validated -> substrate check PASSED + confidence score + SIGNAL LOCKED
  - signal:rejected -> substrate check FAILED + anomaly description + SIGNAL REJECTED
  - trade:executed -> thinking separator + synaptic relay + TRADE EXECUTED
  - position:opened -> neural pathway established + exit parameters
  - position:closed -> context-specific reasoning (stop-loss/take-profit/time-limit/copy-sell) + PNL
  - snapshot -> restoring neural pathways
- 10 ambient idle messages (monitoring coherence, scanning mempool, electrode drift, etc.)
- Idle system: 8s timeout, 3s+jitter interval between messages, resets on real events
- Scroll detection: userScrolled flag, jump-to-latest button appears on scroll up
- 500-line DOM cap: removes oldest children when exceeded
- Dual-view toggle: raw (timestamped lines) vs structured (color-coded left borders, wider separators)
- Created `public/css/terminal.css` with all color classes, separator styles, thinking animation, scrollbar, structured view styles

### Task 2: Wire complete message router and finalize app.js
- Replaced all console.log stubs in `routeMessage()` with real handler calls
- Full routing: snapshot -> Positions + Terminal + NeuronGrid; signals -> Terminal + NeuronGrid + BioStats; trade:executed -> Terminal + NeuronGrid + BioStats; position:opened/updated -> Positions + BioStats; position:closed -> Positions + Terminal + NeuronGrid + BioStats; price:updated -> Positions + BioStats + NeuronGrid + Stats.update()
- All handlers guarded with `typeof !== 'undefined'` for safe parallel plan execution
- DOMContentLoaded initializes NeuronGrid, Stats, Positions, Terminal before boot
- Added terminal.css link and terminal.js script tag to index.html
- Added #jump-to-latest button inside terminal panel
- MODE-03 verified: zero SAFE/paper/simulation references in any frontend file

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **setTimeout chain for idle chatter** -- Used chained setTimeout with random jitter (0-2000ms) instead of setInterval, producing more natural-feeling irregular timing for ambient messages.
2. **CSS-only structured view toggle** -- Toggle adds/removes `.structured` class on container, changing styles via CSS (border-left accents, wider margins). No DOM restructuring needed, making toggle instant.
3. **Idle timer reset scoping** -- Only non-idle appendLine calls reset the idle timer, preventing idle messages from perpetually suppressing themselves.

## Verification Results

- [PASS] Terminal narrates trade actions in neural language (all event types mapped)
- [PASS] Idle chatter fills silence after 8 seconds with variable jitter
- [PASS] Toggle switches between raw and structured views via CSS class
- [PASS] Auto-scroll works, jump-to-latest button positioned absolute in panel
- [PASS] All panels receive WebSocket messages via complete router
- [PASS] No SAFE/LIVE mode distinction visible (grep confirms zero matches)
- [PASS] Terminal capped at 500 lines (MAX_LINES constant)
- [PASS] TypeScript `tsc --noEmit` still passes

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 7381a1c | feat(02-03): terminal console with neural narratives and idle chatter |
| 2 | 3d09764 | feat(02-03): wire complete message router and finalize app.js |
