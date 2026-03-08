# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Real, provable on-chain profitable trades that look like they're being made by a biological neural network
**Current focus:** Phase 2 COMPLETE - Ready for Phase 3 (LIVE Trading + Deployment)

## Current Position

Phase: 2 of 3 COMPLETE (Dashboard + CL1 Theater)
Plan: 3 of 3 in current phase — ALL COMPLETE
Status: Phase 2 verified and complete
Last activity: 2026-03-09 -- Phase 2 verified, price:updated data shape fixed

Progress: [████████████████████████] 100% Phase 2

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 2.7 min
- Total execution time: 19 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-trading-pipeline | 4/4 | 12 min | 3 min |
| 02-dashboard-cl1-theater | 3/3 | 7 min | 2.3 min |

**Recent Trend:**
- Last 5 plans: 01-04 (3 min), 02-01 (3 min), 02-02 (2 min), 02-03 (2 min)
- Trend: Accelerating

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: SAFE mode before LIVE -- full pipeline validated risk-free before spending SOL
- [Roadmap]: Single Node.js monolith with typed EventEmitter bus as central architecture
- [Roadmap]: @solana/web3.js v1 (not v2) due to PumpFun SDK peer dependency
- [01-01]: Used @solana/web3.js 1.98.4 (safe 1.x, avoids compromised 1.95.6-7)
- [01-01]: Singleton typed event bus with setMaxListeners(20)
- [01-01]: Config fails fast on invalid wallet addresses using PublicKey constructor
- [01-02]: bs58 downgraded to v5 for CJS compatibility (v6 is ESM-only)
- [01-02]: PumpSwap discriminator marked unverified with runtime warning
- [01-02]: Added source field to Signal type for pumpfun/pumpswap discrimination
- [01-02]: SELL signals bypass rug filter entirely
- [01-03]: Price getter injection via callback to avoid circular deps with price monitor
- [01-03]: Exit condition priority order: stop-loss > take-profit > time-limit
- [01-03]: Pipeline modules export both class and init function pattern
- [01-04]: 10s base Jupiter polling interval with exponential backoff (max 60s)
- [01-04]: Separate 30s time-limit exit checker independent of price polling
- [01-04]: Pipeline init order: positionManager -> signalDetector -> rugFilter -> tradeExecutor -> priceMonitor
- [02-01]: Google Fonts CDN for VT323 instead of self-hosting
- [02-01]: IIFE pattern for client JS modules, Boot exposed on window
- [02-01]: WS protocol auto-detection (ws/wss) for HTTPS compatibility
- [02-02]: Confidence recalculation every 2s (balances responsiveness with DOM updates)
- [02-02]: EMA smoothing on coherence/entropy for biological feel
- [02-03]: setTimeout chain with jitter for idle chatter (not setInterval)
- [02-03]: CSS-only structured view toggle (no DOM restructuring)
- [02-03]: Idle timer reset only on non-idle events
- [02-verify]: price:updated wrapped in { prices } to match frontend expectation

### Pending Todos

None.

### Blockers/Concerns

- [Research]: PumpFun SDK documentation is sparse -- needs hands-on exploration during Phase 3 planning
- [Research]: Railway SQLite persistence uncertain -- may need JSON file or Railway persistent storage
- [RESOLVED]: @solana/web3.js pinned to 1.98.4 (safe version)
- [RESOLVED]: price:updated data shape mismatch between backend and frontend

## Session Continuity

Last session: 2026-03-09
Stopped at: Completed Phase 2 (Dashboard + CL1 Theater) -- all 3 plans verified
Resume file: None
