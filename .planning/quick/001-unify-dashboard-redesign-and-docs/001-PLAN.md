---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/index.html
  - public/css/neuron-grid.css
  - public/css/main.css
  - public/js/boot.js
  - .planning/STATE.md
autonomous: true

must_haves:
  truths:
    - "Raster panel header reads naturally without raw specs"
    - "Spike scope overlay feels proportional and integrated with the MEA panel"
    - "Boot sequence references the new UI elements (spike scope, raster plot, per-channel routing)"
    - "STATE.md reflects all post-Phase-2 redesign work"
  artifacts:
    - path: "public/index.html"
      provides: "Updated raster panel header text"
      contains: "SPIKE RASTER"
    - path: "public/css/neuron-grid.css"
      provides: "Refined spike scope sizing and glass effect"
      contains: "spike-scope"
    - path: "public/js/boot.js"
      provides: "Boot lines referencing spike waveform monitor, raster display, channel routing"
      contains: "spike waveform"
    - path: ".planning/STATE.md"
      provides: "Updated project state with post-Phase-2 redesign details"
      contains: "Chakra Petch"
  key_links:
    - from: "public/css/neuron-grid.css"
      to: "public/css/main.css"
      via: "shared CSS variables (--surface-glass, --border-panel, --panel-radius)"
      pattern: "var\\(--"
---

<objective>
Unify the post-Phase-2 dashboard redesign (new theme, spike scope, raster plot, per-channel routing) by polishing visual integration of bolted-on elements, updating boot sequence text, and bringing documentation up to date.

Purpose: The new UI features look forced/disconnected. This plan makes them feel native and updates project docs to reflect all untracked changes.
Output: Visually integrated spike scope + raster panel, updated boot sequence, current STATE.md
</objective>

<execution_context>
@C:\Users\thedi\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\thedi\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@public/index.html
@public/css/main.css
@public/css/neuron-grid.css
@public/js/boot.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Polish spike scope + raster panel visual integration</name>
  <files>public/index.html, public/css/neuron-grid.css, public/css/main.css</files>
  <action>
    **Raster panel header (index.html line 108):**
    Change `SPIKE RASTER — 59 CHANNELS × 30s` to just `SPIKE RASTER` — the raw spec text is too technical and breaks the UI's otherwise clean aesthetic. Keep the `25 kHz` badge as-is (it's subtle enough).

    **Spike scope overlay (neuron-grid.css):**
    The current spike scope is 200x90px which feels small and disconnected. Make these changes:
    - Increase size to `width: 240px; height: 100px` for better waveform visibility
    - Add `background: var(--surface-glass)` to match panel glass morphism (currently has no background, just backdrop-filter which is inconsistent)
    - Add the same top accent line that panels get: add a `::before` pseudo-element with the phosphor gradient line (`linear-gradient(90deg, transparent, var(--phosphor-faint), rgba(0, 255, 163, 0.15), var(--phosphor-faint), transparent)`) — 1px height at top
    - Position `bottom: 12px; left: 12px` (slightly more breathing room from edges)

    **Raster panel styling (main.css):**
    - Add `height: 120px` to `.raster-panel` (reduce from 140px — it currently takes too much vertical space for what's essentially a strip visualization)
    - The raster panel already inherits `.panel` styles (glass, border, radius) so it's already integrated — no further changes needed there

    Do NOT change any JavaScript files in this task. Do NOT change the raster canvas background color (it intentionally uses a slightly different dark for contrast).
  </action>
  <verify>Open public/index.html in browser. Verify: (1) raster header says "SPIKE RASTER" without channel/time specs, (2) spike scope overlay in bottom-left of MEA panel has visible glass background and phosphor accent line, (3) raster strip is slightly shorter but still readable.</verify>
  <done>Raster header is clean, spike scope has consistent glass morphism treatment matching other panels, raster panel is 120px tall.</done>
</task>

<task type="auto">
  <name>Task 2: Update boot sequence for new UI elements</name>
  <files>public/js/boot.js</files>
  <action>
    Update the BOOT_LINES array to reference the new dashboard features that were added post-Phase-2. Insert these lines in appropriate positions:

    After the existing "Electrode array: 64 channels detected" line (line 10), add:
    - `{ text: 'Channel routing: column-major, 5 reserved (ref/gnd)', delay: 100 }`
    - `{ text: 'Usable channels: 59 -- per-region event routing enabled', delay: 100 }`

    After the existing "Stimulus-response latency: 14ms" line (line 19), add:
    - `{ text: '  Spike waveform monitor: 75 samples @ 25kHz', delay: 80 }`
    - `{ text: '  Raster display: 59ch scrolling -- OK', delay: 80 }`

    These additions make the boot sequence feel like it's initializing the specific hardware features visible on screen, reinforcing that everything is part of one integrated system.

    Do NOT change existing boot lines. Do NOT change the BIOS version string. Do NOT modify any other function in the file.
  </action>
  <verify>Open dashboard, hard-refresh. Watch boot sequence. New lines about channel routing, spike waveform monitor, and raster display should appear naturally in the POST diagnostics section.</verify>
  <done>Boot sequence references per-channel routing (59 usable channels), spike waveform monitor (75 samples @ 25kHz), and raster display — all matching the actual UI elements visible after boot completes.</done>
</task>

<task type="auto">
  <name>Task 3: Update STATE.md with post-Phase-2 redesign context</name>
  <files>.planning/STATE.md</files>
  <action>
    Update STATE.md to reflect the untracked redesign work done after Phase 2 completion. Make these specific changes:

    **Current Position section:**
    - Change `Last activity:` to `2026-03-09 -- Post-Phase-2 dashboard redesign unified (quick-001)`

    **Accumulated Context > Decisions section — add these entries at the end:**
    - `[post-02]: Theme overhaul: VT323 → Chakra Petch (display) + DM Mono (mono), bioluminescent color palette`
    - `[post-02]: Glass morphism panels with backdrop-filter blur, atmospheric background layers (noise, grid, glow orbs, scanlines)`
    - `[post-02]: Spike waveform oscilloscope overlay on MEA panel (75 samples @ 25kHz, matching CL1 spec)`
    - `[post-02]: Spike raster plot as full-width bottom strip (59 channels × 30s scrolling window)`
    - `[post-02]: Per-channel MEA routing — signals to central cluster, rejections to edges, trades to mid-ring`
    - `[post-02]: CL1 MEA channel layout: column-major 8×8, channels 0/4/7/56/63 reserved (ref/ground)`

    **Session Continuity section:**
    - Update `Last session:` to `2026-03-09`
    - Update `Stopped at:` to `Unified post-Phase-2 dashboard redesign -- spike scope/raster integrated, boot updated, docs current`

    Do NOT change the phase/plan counters (still Phase 2 of 3, plan 3 of 3). Do NOT change performance metrics. Do NOT change blockers/concerns.
  </action>
  <verify>Read .planning/STATE.md and confirm: (1) Last activity mentions quick-001, (2) six [post-02] decisions are listed, (3) session continuity is updated.</verify>
  <done>STATE.md accurately reflects all post-Phase-2 changes including theme overhaul, new visualization components, and CL1 MEA integration details.</done>
</task>

</tasks>

<verification>
1. `grep -c "59 CHANNELS" public/index.html` returns 0 (old spec text removed)
2. `grep "spike waveform" public/js/boot.js` returns a match (boot references new feature)
3. `grep "Chakra Petch" .planning/STATE.md` returns a match (docs updated)
4. Visual: dashboard loads with cohesive glass morphism across all panels including spike scope overlay
</verification>

<success_criteria>
- Spike scope overlay has glass background + phosphor accent matching other panels
- Raster panel header is clean (no raw channel/time specs)
- Boot sequence naturally references all visible UI elements
- STATE.md documents all post-Phase-2 redesign decisions
- No functional changes to any JavaScript module behavior
</success_criteria>

<output>
After completion, create `.planning/quick/001-unify-dashboard-redesign-and-docs/001-SUMMARY.md`
</output>
