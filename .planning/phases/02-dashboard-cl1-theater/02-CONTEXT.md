# Phase 2: Dashboard + CL1 Theater - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

A viral-ready public dashboard that looks like a biological neural network is autonomously trading. Three-column layout with neuron visualizer, positions panel, and narrative terminal. Real-time data flows through WebSocket. Every pixel reinforces the CL1 narrative. Must look identical in SAFE and LIVE mode.

</domain>

<decisions>
## Implementation Decisions

### Visual layout
- Three-column layout: neuron visualizer (left), positions (center), terminal/thought process (right)
- Status bar split: some biological stats in a top header bar, others embedded in the neuron visualizer panel
- Desktop-first, mobile-passable (columns stack on mobile so it's at least viewable)
- Claude picks column proportions and overall color theme

### Neuron grid (MEA visualizer)
- MEA (Multi-Electrode Array) style grid with colored square tiles representing neuron clusters
- Different colors for autonomous vs stimulated activity (reference: CL1 MEA screenshot with teal, olive, and pink/red tiles)
- Small electrode indicators inside each tile, connection lines between active nodes
- Grid reacts to trading events (buys, sells, rug rejects) to look like the network is making decisions
- Tabs/views and text overlays at Claude's discretion
- Animation style (burst vs wave vs mix) at Claude's discretion

### Terminal / decision narrative
- Two views with a toggle button: raw terminal view and cleaned/structured view
- Tone: clinical-scientific mixed with data-heavy — research lab meets trading data, clean UI
- Not pure scrolling text — shows coins bought, coins sold, visual separators/lines when "thinking"
- Ambient neural chatter during idle periods ("monitoring coherence...", "scanning mempool...", "baseline stable") — never fully quiet
- Auto-scroll pinned to bottom, "jump to latest" button appears if user scrolls up
- Color-coding and event presentation style at Claude's discretion

### Biological stats
- Five stats: neurons, coherence, entropy, firing rate, win rate
- Mixed reactivity: some stats spike on events (firing rate), others drift slowly over time (coherence, entropy) — feels like a living system
- Win rate blended in with biological stats, no special visual distinction
- Tooltips on hover with pseudo-scientific explanations (e.g. "Neural coherence: synchronization index across electrode clusters")
- Stats derived from real trading data, not random noise

### Claude's Discretion
- Column width proportions
- Overall color theme / palette
- Neuron grid animation style and reactivity patterns
- Whether to include tabs/views on the neuron grid
- Grid text overlays and labels
- How buy/sell/reject events are visually differentiated in terminal
- Loading states and error states

</decisions>

<specifics>
## Specific Ideas

- Reference screenshots of CL1 MEA neuron activity grid: colored square tiles in a grid, autonomous (blue/teal) vs stimulated (red/pink), connection lines between nodes
- Terminal should feel like a mix of neuroscience research log and trading data feed
- "Father fucking lines in the middle as the thing is thinking" — visual separators/dividers in terminal during processing phases
- The whole thing should look like it's actually making decisions, not just displaying data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-dashboard-cl1-theater*
*Context gathered: 2026-03-09*
