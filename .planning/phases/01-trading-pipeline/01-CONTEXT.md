# Phase 1: Trading Pipeline (SAFE Mode) - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

The complete copy-trading pipeline in paper-trading mode. Webhook signals from tracked wallets flow through rug filters into mock executions with full position tracking and automated exits. Zero SOL spent — everything is simulated except the signal detection and price feeds.

</domain>

<decisions>
## Implementation Decisions

### Rug filter criteria
- Dev wallet holdings must be ≤5% of total supply or coin is rejected
- Single wallet cap: no individual non-dev wallet can hold more than 5% of supply
- No additional checks (no minimum holders, no liquidity threshold, no coin age) — the tracked wallets themselves are the quality signal
- Keep filters simple: dev holdings + single wallet cap only

### Position management
- 5 concurrent positions max
- When limit is hit, skip the signal and log it (narrated as biological decision — "neural coherence insufficient... pattern rejected")
- Fixed 0.1 SOL simulated buy amount per trade
- No queuing — signals are dropped, not deferred

### Exit strategy params
- All exit parameters (take-profit, stop-loss, time limit) are randomized/alternated per trade to simulate biological decision-making
- TP range: alternate between ~2x and ~3x targets
- SL range: alternate between ~-30% and ~-50%
- Time limit: randomized within a reasonable range per trade
- This variation is core to the CL1 narrative — no two trades should exit identically

### Signal processing
- Track wallet addresses from a config file (easy add/remove without code changes)
- Copy buys on PumpFun bonding curve AND PumpSwap (post-migration)
- First buy only per coin — no re-entry if already holding or already exited that coin
- No artificial execution delay in SAFE mode — execute mock trade immediately on signal

### Claude's Discretion
- Price source for real-time PNL calculation (Jupiter API vs on-chain pool reserves vs hybrid)
- Copy-sell priority logic (how copy-sell interacts with automated TP/SL/time exits)
- Exact randomization ranges and distribution for exit params
- Internal event bus architecture and data persistence approach

</decisions>

<specifics>
## Specific Ideas

- Skipped signals (position limit full) should be narrated in CL1 style — the "brain" chose not to ape, not a technical limitation
- Exit parameter variation is a feature, not randomness — it should feel like a biological system making different judgment calls
- Config file for tracked wallets so addresses can be swapped without touching code

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-trading-pipeline*
*Context gathered: 2026-03-09*
