# Project Research Summary

**Project:** BioTrencher
**Domain:** Solana copy-trading bot with simulated biological neural network dashboard
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH

## Executive Summary

BioTrencher is a Solana PumpFun copy-trading bot wrapped in a CL1 biological neural network theater layer, designed for viral social proof. The recommended build approach is a single Node.js monolith (Express + ws) with an event-driven core, serving a React/Vite SPA dashboard. The stack is well-established: @solana/web3.js v1 (not v2/@solana/kit -- PumpFun SDK pins to v1), Helius webhooks for wallet monitoring, PumpFun SDK for bonding curve trades, and Jupiter v6 as the post-graduation fallback aggregator. One critical ecosystem update: PumpFun tokens now graduate to PumpSwap (Pump's own AMM), not Raydium. The PROJECT.md must be updated accordingly, and Jupiter handles routing through PumpSwap pools automatically.

The architecture is straightforward: webhook receiver -> signal processor (with rug filters) -> trade executor (SAFE/LIVE strategy pattern) -> position manager, all coordinated through a typed EventEmitter bus. The CL1 simulation engine is a pure consumer of trading events, completely decoupled from trading logic. The dashboard (neuron grid, positions panel, terminal console, status bar) connects via WebSocket. SAFE mode should be built first -- the entire dashboard works identically in both modes, enabling content creation before risking any SOL.

The top risks are: (1) supply chain attacks -- the Solana bot npm ecosystem is actively targeted, with confirmed backdoors in @solana/web3.js 1.95.6-1.95.7 and multiple trojanized packages; (2) copy-trade latency -- PumpFun prices can double within a single Solana slot, so the signal-to-execution pipeline must target sub-2-second median latency with Jito bundles and priority fees; (3) sophisticated rug pulls bypassing basic dev-supply filters via bundled multi-wallet buys. The small trade sizes (0.05-0.1 SOL) and position limits (3-5) provide natural risk management, but dependency security must be treated as a Phase 0 concern.

## Key Findings

### Recommended Stack

The stack centers on @solana/web3.js v1 (NOT @solana/kit v2) because the PumpFun SDK requires it as a peer dependency via Anchor. Helius SDK v2 handles webhooks, enhanced transaction parsing, and Jito-aware transaction sending. The frontend is a Vite + React SPA with Tailwind CSS and the motion library for animations, served as static files by Express. SQLite (better-sqlite3) or even simple JSON file persistence is sufficient for 3-5 concurrent positions.

**Core technologies:**
- **@solana/web3.js v1 + Anchor:** Solana interactions -- required by PumpFun SDK peer deps
- **@pump-fun/pump-sdk + pump-swap-sdk:** PumpFun bonding curve and post-graduation PumpSwap trading
- **helius-sdk v2:** Webhook CRUD, enhanced tx parsing, Jito-aware sender (no separate Jito SDK needed)
- **Jupiter v6 (@jup-ag/api):** Fallback swap aggregator for legacy Raydium pools
- **Express + ws:** HTTP webhook receiver and WebSocket real-time push to dashboard
- **Vite + React + Tailwind + motion:** SPA dashboard with dark sci-fi aesthetic and smooth animations
- **HTML5 Canvas (native):** Custom neuron activity grid visualization -- no Three.js/WebGL needed

**Critical version note:** @solana/web3.js versions 1.95.6 and 1.95.7 were compromised. Use 1.95.8+ or latest 1.x only.

### Expected Features

**Must have (table stakes):**
- Dashboard shell with dark theme, 4-panel layout (status bar, neuron grid, positions, terminal)
- Real-time position panel with PNL (entry price, current price, unrealized %)
- Terminal console with neural decision logs (the most screenshot-friendly element)
- CL1 biological stats in status bar (neurons, coherence, entropy, firing rate)
- Neuron activity grid (2D animated, NOT 3D)
- Helius webhook monitoring + copy-trade execution (PumpFun + Jupiter)
- Rug protection filters (dev supply + top holder concentration)
- Multi-signal sell strategy (copy-sell > stop-loss > take-profit > time-exit)
- SAFE mode (paper trading, identical dashboard appearance)
- On-chain provability (wallet address + Solscan link)

**Should have (differentiators):**
- Neural confidence bar per position (market-derived, purely cosmetic but compelling)
- Electrode cluster highlighting on trade events (visual link between brain and trades)
- Reactive biological stats tied to real market data (not random -- viewers notice correlation)
- BIOS boot sequence animation on page load
- Culture health indicator (neuron count + age on 28-day cycle)

**Defer (v2+):**
- Twitter/X auto-posting of trades
- Sound design
- Multiple wallet monitoring strategies
- Mobile-native app

**Anti-features (explicitly avoid):**
- User accounts / multi-user -- this is a single public theater piece, not SaaS
- 3D electrode visualization -- 2D grid is more performant and sufficient
- TradingView charts -- dilutes the biological narrative
- Dynamic wallet discovery -- curated list is the alpha

### Architecture Approach

Single Node.js process with event-driven architecture. All components communicate through a typed EventEmitter bus, enabling loose coupling and parallel development. The SAFE/LIVE mode distinction is implemented via strategy pattern on the trade executor -- same events, same dashboard, different execution backend. The CL1 simulation engine is a one-way consumer of trading events, producing display-only data. Express serves both the webhook endpoint and the built React static files. WebSocket pushes all state updates to the dashboard in real-time (no REST polling).

**Major components:**
1. **Webhook Receiver (Express)** -- accepts Helius POST, validates, emits to event bus
2. **Signal Processor** -- decodes transactions, applies rug filters, gates trade execution
3. **Trade Executor (SAFE/LIVE)** -- builds and sends swap transactions via PumpFun SDK or Jupiter
4. **Position Manager** -- tracks entries, calculates PNL, triggers exit conditions
5. **CL1 Simulation Engine** -- transforms market events into biological-sounding metrics (pure theater)
6. **WebSocket Server** -- broadcasts all event bus events to connected dashboard clients
7. **React Dashboard** -- 4-panel SPA consuming WebSocket feed via Zustand store

### Critical Pitfalls

1. **Supply chain attacks on Solana bot dependencies** -- Pin ALL versions exactly, audit every package, use dedicated hot wallet with minimal SOL. Confirmed attacks in 2025 drained wallets via backdoored npm packages.
2. **PumpFun graduated to PumpSwap, not Raydium** -- Use Jupiter as routing layer (it indexes PumpSwap pools). Do NOT hardcode Raydium program IDs.
3. **Webhook-to-execution latency** -- Pre-compute PDAs, cache token accounts, keep blockhash warm, use Jito bundles + priority fees. Budget 5-15% slippage as copy-trading cost.
4. **Basic rug filters bypassed by bundled multi-wallet buys** -- Check top-N holder concentration, not just deployer wallet. Accept that no filter catches everything; position limits are the real risk management.
5. **Webhook silent failures** -- Deduplicate by tx signature, track last-received timestamp, implement polling fallback for gap detection.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Setup and Foundation
**Rationale:** Security-first foundation. Supply chain attacks are the highest-severity risk and must be addressed before any code that touches private keys. Event bus architecture must exist first as everything depends on it.
**Delivers:** Secure project scaffold, dependency lockfile, Express server, Solana connection, typed event bus, bot configuration system, environment variable management.
**Addresses:** Project structure, config management, wallet security
**Avoids:** Supply chain attacks (Pitfall 3), private key exposure

### Phase 2: Core Trading Loop (SAFE Mode)
**Rationale:** The webhook-to-position pipeline is the backbone. Building it in SAFE mode first validates the entire flow without spending SOL. This is the most complex phase with the most external integrations.
**Delivers:** Helius webhook receiver, transaction decoder, rug protection filters, SAFE mode trade executor, position manager with PNL tracking, sell strategy engine (copy-sell + TP/SL + time-exit).
**Addresses:** Wallet monitoring, copy-trade execution, rug protection, sell strategy, SAFE mode, position tracking
**Avoids:** Webhook silent failures (Pitfall 5), unrealistic paper trading (Pitfall 6), wrong DEX routing (Pitfall 1)

### Phase 3: Dashboard and CL1 Theater
**Rationale:** Can be built in parallel with Phase 2 using mock data, but logically comes after so the WebSocket feed has real events to consume. This phase produces the viral-ready visual product.
**Delivers:** React SPA with all 4 panels (status bar, neuron grid, positions, terminal), CL1 simulation engine, WebSocket integration, dark sci-fi aesthetic, responsive layout.
**Addresses:** All dashboard features, CL1 biological stats, neuron activity grid, terminal console, neural decision logs
**Avoids:** Dashboard looking mechanical (UX pitfall), CL1 stats not correlating with market data

### Phase 4: LIVE Trading
**Rationale:** SAFE mode proves the pipeline works end-to-end. LIVE mode swaps in real transaction execution. This is where real SOL is at risk, so it comes after full system validation.
**Delivers:** PumpFun bonding curve integration, PumpSwap/Jupiter post-graduation swaps, Jito bundle submission, priority fee management, bonding curve migration detection.
**Addresses:** LIVE mode execution, on-chain provability, real wallet trades
**Avoids:** Execution latency (Pitfall 2), buying on wrong DEX (Pitfall 1)

### Phase 5: Hardening and Polish
**Rationale:** Iterative refinement based on real trading data. Rug filters get tuned, exit strategies adjusted, dashboard polished for viral content readiness.
**Delivers:** Refined rug filters (holder concentration, bundled tx detection), BIOS boot sequence, electrode cluster highlighting, error recovery, Railway deployment optimization.
**Addresses:** Differentiator features (P2 from features), rug filter refinement, production reliability
**Avoids:** Rug filter bypass (Pitfall 4), position state loss on restart

### Phase Ordering Rationale

- **Security before functionality:** Dependency pinning and wallet security must be in place before any code handles private keys or interacts with Solana.
- **SAFE before LIVE:** The entire dashboard and trading pipeline works identically in SAFE mode. This enables content creation (screenshots, videos) while de-risking the swap integration. Architecture research strongly recommends this order.
- **Event bus first:** The typed EventEmitter is the central nervous system. Every component depends on it. Building it in Phase 1 enables parallel development of trading logic and dashboard.
- **Dashboard after trading loop:** While these CAN be parallel, the dashboard is more valuable when consuming real webhook events rather than purely mocked data. Building the trading loop first means the dashboard has real signals to display from day one.
- **Hardening last:** Rug filter refinement and polish features need real trading data to calibrate against. Building them last means they're informed by actual production behavior.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Core Trading Loop):** Complex Helius webhook integration, PumpFun transaction decoding (instruction discriminators), and sell strategy logic. The tx decoding for identifying buy/sell actions from raw webhook data is sparsely documented.
- **Phase 4 (LIVE Trading):** PumpFun bonding curve interaction and migration detection. The @pump-fun/pump-sdk API surface needs hands-on exploration. Jito bundle tip amounts need tuning.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Standard Express + TypeScript setup, well-documented patterns.
- **Phase 3 (Dashboard):** React + Vite + Tailwind + Canvas is a well-trodden path. CL1 simulation is custom but straightforward (map market data to stat values).
- **Phase 5 (Hardening):** Iterative refinement, no novel integration work.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | All core packages verified on npm with recent versions. PumpFun SDK ecosystem confirmed. Main uncertainty: Helius SDK v2 breaking changes. |
| Features | MEDIUM | Cross-domain product with limited direct competitors. PredictLLM is primary reference but its repo returned 404. Feature set is well-reasoned but unvalidated by market. |
| Architecture | MEDIUM-HIGH | Event-driven monolith is the standard pattern for Solana trading bots. Multiple guides and open-source bots confirm this approach. Single-process is correct for this scale. |
| Pitfalls | HIGH | Verified across 15+ sources. Supply chain attacks are confirmed with specific CVEs. PumpSwap migration is confirmed by multiple news sources. Webhook reliability issues documented by Helius themselves. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **PumpFun SDK API surface:** The @pump-fun/pump-sdk documentation is sparse. Need hands-on exploration of the buy/sell instruction builders during Phase 2 planning.
- **Helius webhook payload format:** Enhanced Transaction vs Raw webhook types have different payload structures. Need to determine which type provides the data needed for copy-trade signal detection with lowest latency.
- **PumpSwap graduation threshold:** Reported as $69K market cap but from a single Medium article. Needs on-chain verification.
- **PredictLLM reference project:** Primary competitor/inspiration returned 404 on direct fetch. CL1 UI design decisions are based on metadata and screenshots, not source code review.
- **Railway SQLite persistence:** Railway containers are ephemeral by default. Need to verify volume persistence or switch to JSON file approach with Railway's persistent storage.
- **Jito tip calibration:** Optimal tip amounts for non-competitive copy-trading (not sniping) are undocumented. Will need empirical tuning in Phase 4.

## Sources

### Primary (HIGH confidence)
- [@pump-fun/pump-sdk v1.28.0 on npm](https://www.npmjs.com/package/@pump-fun/pump-sdk) -- Official PumpFun bonding curve SDK
- [@pump-fun/pump-swap-sdk v1.14.1 on npm](https://www.npmjs.com/package/@pump-fun/pump-swap-sdk) -- Official PumpSwap AMM SDK
- [helius-sdk v2.0.5 on npm](https://www.npmjs.com/package/helius-sdk) -- Helius webhook + RPC SDK
- [Helius Webhooks Documentation](https://www.helius.dev/docs/webhooks) -- Webhook setup and types
- [Jupiter V6 Swap API docs](https://hub.jup.ag/docs/apis/swap-api) -- Swap routing API
- [Cortical Labs CL1](https://corticallabs.com/cl1) -- CL1 hardware specs and biOS terminology
- [Jito Low Latency Transaction Send](https://docs.jito.wtf/lowlatencytxnsend/) -- Bundle submission docs
- [Railway Express Deployment Guide](https://docs.railway.com/guides/express) -- Deployment patterns

### Secondary (MEDIUM confidence)
- [QuickNode PumpFun Copy Trade Guide](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade) -- Architecture patterns
- [Dysnix Solana Trading Bot Guide 2026](https://dysnix.com/blog/solana-trading-bot-guide) -- Infrastructure patterns
- [RPC Fast Copy-Trading Bot Case Study](https://rpcfast.com/blog/copy-trading-bot-case-study) -- Latency benchmarks
- [Chainstack PumpFun Bot](https://docs.chainstack.com/docs/solana-creating-a-pumpfun-bot) -- Instruction building patterns
- [Flintr Anatomy of a Rug Pull](https://www.flintr.io/articles/anatomy-of-a-rug-pull-identify-scams-on-pumpfun) -- Rug detection strategies

### Tertiary (LOW confidence)
- PumpSwap graduation threshold ($69K market cap) -- single Medium article, unverified on-chain
- gRPC latency numbers (50-100ms vs 300-500ms webhooks) -- from RPC Fast, specific to their infra
- PredictLLM UI patterns -- repo 404, based on metadata and search results only

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
