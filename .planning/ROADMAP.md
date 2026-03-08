# Roadmap: BioTrencher

## Overview

BioTrencher delivers a copy-trading bot disguised as a biological neural network, built in three phases: first the trading pipeline in SAFE mode (zero SOL risk), then the viral-ready CL1 dashboard, then LIVE trading with real on-chain execution and public deployment. SAFE mode comes first so the entire system can be validated and content-ready before any SOL is spent.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Trading Pipeline (SAFE Mode)** - Webhook monitoring, rug filters, copy-trade execution, position management, and sell strategies in paper-trading mode
- [x] **Phase 2: Dashboard + CL1 Theater** - Vanilla HTML/CSS/JS dashboard with neuron grid, positions panel, terminal console, CL1 biological simulation, and WebSocket real-time updates
- [ ] **Phase 3: LIVE Trading + Deployment** - Real on-chain execution via PumpFun/PumpSwap/Jupiter, Railway deployment, public URL with Solscan verification

## Phase Details

### Phase 1: Trading Pipeline (SAFE Mode)
**Goal**: The complete copy-trading pipeline works end-to-end in paper-trading mode -- webhook signals flow through rug filters into mock executions with full position tracking and automated exits
**Depends on**: Nothing (first phase)
**Requirements**: TRADE-01, TRADE-02, TRADE-03, TRADE-04, TRADE-05, TRADE-06, TRADE-07, TRADE-08, TRADE-09, TRADE-10, MODE-01
**Success Criteria** (what must be TRUE):
  1. When a tracked wallet buys a PumpFun coin, the system detects it within seconds via Helius webhook and logs the signal
  2. Coins with excessive dev/top-wallet supply concentration are rejected with a logged reason before any trade executes
  3. SAFE mode paper-trades the full pipeline (buy signal -> rug check -> mock buy -> position tracking -> exit) with zero SOL spent
  4. Open positions show real-time PNL calculated from live price data, with automatic exits triggered by copy-sell, take-profit, stop-loss, or time limit
  5. The system respects the 3-5 concurrent position limit, queuing or skipping signals when full
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md -- Project scaffold, core types, event bus, config, utilities
- [x] 01-02-PLAN.md -- Webhook server, signal detector, rug filter
- [x] 01-03-PLAN.md -- Trade executor (SAFE mode), position manager
- [x] 01-04-PLAN.md -- Price monitor, pipeline wiring, webhook setup script

### Phase 2: Dashboard + CL1 Theater
**Goal**: A viral-ready public dashboard that looks like a biological neural network is autonomously trading -- every pixel reinforces the CL1 narrative with real-time data flowing through WebSocket
**Depends on**: Phase 1 (needs event bus and position data to display)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, CL1-01, CL1-02, CL1-03, CL1-04, MODE-03
**Success Criteria** (what must be TRUE):
  1. Dashboard displays a top status bar with live biological stats (neurons, coherence, entropy, firing rate, win rate) that react to real market data -- not random noise
  2. Animated 2D neuron activity grid shows color-coded electrode firing patterns that visually respond to trading events
  3. Positions panel shows active coins with entry price, current price, unrealized PNL %, and a CL1 neural confidence bar per position
  4. Terminal console scrolls neural decision logs ("coherence spike... pattern match... confidence 0.847... EXECUTING BUY") that narrate every trade action
  5. Dashboard looks identical whether the backend is running in SAFE or LIVE mode -- no visual distinction between paper and real trades
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- WebSocket bridge, Express static serving, HTML scaffold, CSS theme, boot sequence
- [x] 02-02-PLAN.md -- Neuron grid canvas, bio-stats system, positions panel with confidence bars
- [x] 02-03-PLAN.md -- Terminal console with neural narratives, idle chatter, message router wiring

### Phase 3: LIVE Trading + Deployment
**Goal**: Real SOL trades execute on-chain through PumpFun bonding curve and PumpSwap/Jupiter, deployed on Railway with a public URL anyone can use to verify trades on Solscan
**Depends on**: Phase 1 (trading pipeline), Phase 2 (dashboard)
**Requirements**: MODE-02, MODE-04, DEPL-01, DEPL-02
**Success Criteria** (what must be TRUE):
  1. LIVE mode executes real swaps (0.05-0.1 SOL per trade) on PumpFun bonding curve for pre-migration coins and PumpSwap/Jupiter for post-migration coins
  2. The bot wallet address is displayed on the dashboard with a clickable Solscan link, and every trade is verifiable on-chain by anyone
  3. The entire application runs as a single service on Railway with a public URL accessible to anyone
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Trading Pipeline (SAFE Mode) | 4/4 | Complete | 2026-03-09 |
| 2. Dashboard + CL1 Theater | 3/3 | Complete | 2026-03-09 |
| 3. LIVE Trading + Deployment | 0/TBD | Not started | - |
