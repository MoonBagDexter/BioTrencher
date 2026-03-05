---
phase: 01-trading-pipeline
plan: 02
subsystem: api
tags: [express, webhooks, helius, pumpfun, pumpswap, solana, rug-filter]

requires:
  - phase: 01-01
    provides: typed event bus, core types, config loader, logger
provides:
  - Express webhook server with deduplication
  - PumpFun buy/sell signal detection from raw webhooks
  - PumpSwap buy signal detection (unverified discriminator)
  - Rug filter rejecting >5% holder concentration
affects: [01-03, 01-04]

tech-stack:
  added: []
  patterns:
    - "Non-blocking webhook handler (respond 200 before processing)"
    - "Anchor discriminator matching for instruction decoding"
    - "Fail-closed rug filter (reject on RPC error)"

key-files:
  created:
    - src/server/index.ts
    - src/pipeline/signal-detector.ts
    - src/pipeline/rug-filter.ts
  modified:
    - src/core/types.ts
    - package.json

key-decisions:
  - "bs58 downgraded to v5 for CJS compatibility (v6 is ESM-only)"
  - "PumpSwap discriminator marked unverified with runtime warning"
  - "Added source field to Signal type for pumpfun/pumpswap discrimination"
  - "SELL signals bypass rug filter entirely"

patterns-established:
  - "Pipeline stage pattern: subscribe to bus event, process, emit next event"
  - "Fail-closed on RPC errors during safety checks"
  - "FIFO dedup set with fixed capacity for webhook signatures"

duration: 3min
completed: 2026-03-09
---

# Phase 1 Plan 2: Webhook Receiver, Signal Detector, and Rug Filter Summary

**Express webhook server with PumpFun/PumpSwap discriminator-based signal detection and top-20 holder concentration rug filter**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T04:54:33Z
- **Completed:** 2026-03-09T04:57:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Non-blocking webhook endpoint that responds 200 immediately and deduplicates by tx signature
- Signal detector decodes PumpFun buy/sell and PumpSwap buy from raw Helius webhook data
- Rug filter checks all top-20 holders against 5% threshold, fail-closed on errors
- SELL signals bypass rug filter for copy-sell exit logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Express webhook server with deduplication** - `3505baa` (feat)
2. **Task 2: Signal detector and rug filter pipeline stages** - `86c5a0a` (feat)

## Files Created/Modified
- `src/server/index.ts` - Express server with /webhook POST (dedup) and /health GET
- `src/pipeline/signal-detector.ts` - Decodes PumpFun buy/sell and PumpSwap buy via discriminator matching
- `src/pipeline/rug-filter.ts` - Rejects tokens where any top-20 holder has >5% supply
- `src/core/types.ts` - Added `source` field to Signal interface
- `package.json` - Downgraded bs58 to v5 for CJS compatibility

## Decisions Made
- **bs58 v5 downgrade:** bs58 v6 is ESM-only and incompatible with the project's CJS module setup. Downgraded to v5.0.0 which works with CommonJS.
- **PumpSwap discriminator unverified:** Used SHA-256("global:buy") Anchor pattern but cannot confirm without PumpSwap IDL. Added runtime warning and TODO.
- **Signal source field:** Added `source: 'pumpfun' | 'pumpswap'` to Signal type so downstream stages can differentiate signal origin.
- **SELL bypass:** SELL signals skip rug filter entirely since they trigger copy-sell exit logic, not new position entry.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `source` field to Signal type**
- **Found during:** Task 2 (Signal detector implementation)
- **Issue:** Signal type had no way to distinguish PumpFun vs PumpSwap origin
- **Fix:** Added `source: 'pumpfun' | 'pumpswap'` to Signal interface
- **Files modified:** src/core/types.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** 3505baa (Task 1 commit)

**2. [Rule 3 - Blocking] Downgraded bs58 from v6 to v5**
- **Found during:** Task 2 (Signal detector implementation)
- **Issue:** bs58 v6 is ESM-only, causing TS1479 error in CJS project
- **Fix:** `npm install bs58@5.0.0`
- **Files modified:** package.json, package-lock.json
- **Verification:** tsc --noEmit passes with zero errors
- **Committed in:** 86c5a0a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Webhook receiver, signal detector, and rug filter are wired via typed event bus
- Ready for Plan 03 (trade executor / position manager) to subscribe to signal:validated
- PumpSwap discriminator needs verification against live transactions before production use

---
*Phase: 01-trading-pipeline*
*Completed: 2026-03-09*
