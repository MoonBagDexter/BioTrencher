# Architecture Research

**Domain:** Solana copy-trading bot with real-time simulated neural dashboard
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
                          EXTERNAL SERVICES
 ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 │   Helius     │  │  PumpFun     │  │   Jupiter    │
 │  Webhooks    │  │  Bonding     │  │   Swap API   │
 │  (signals)   │  │  Curve API   │  │   (v6)       │
 └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
        │                 │                  │
 ═══════╪═════════════════╪══════════════════╪═══════════════
        │        SINGLE NODE.JS PROCESS      │
        ▼                 │                  │
 ┌──────────────┐         │                  │
 │   Webhook    │         │                  │
 │   Receiver   │         │                  │
 │  (Express)   │         │                  │
 └──────┬───────┘         │                  │
        │                 │                  │
        ▼                 │                  │
 ┌──────────────┐         │                  │
 │   Signal     │         │                  │
 │  Processor   │─────────┤──────────────────┤
 │  (filter +   │         │                  │
 │   decide)    │         │                  │
 └──────┬───────┘         │                  │
        │                 ▼                  ▼
        │          ┌──────────────────────────────┐
        ├─────────►│       Trade Executor          │
        │          │  (PumpFun bonding curve OR    │
        │          │   Jupiter post-migration)     │
        │          └──────────────┬────────────────┘
        │                        │
        ▼                        ▼
 ┌──────────────────────────────────────────┐
 │           Position Manager               │
 │  (entries, PNL calc, exit strategies)    │
 └──────────────────┬───────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────┐
 │           Event Bus (EventEmitter)       │
 │  signal:detected | trade:executed |      │
 │  position:opened | position:closed |     │
 │  price:updated   | cl1:tick              │
 └───────┬──────────────────┬───────────────┘
         │                  │
         ▼                  ▼
 ┌──────────────┐  ┌───────────────────┐
 │  CL1 Sim     │  │  WebSocket Server │
 │  Engine      │  │  (ws / Socket.IO) │
 │  (theater)   │  │                   │
 └──────┬───────┘  └───────┬───────────┘
        │                  │
        └──────┬───────────┘
               ▼
 ┌──────────────────────────────────────────┐
 │         Static Frontend (React)          │
 │   Neuron Grid | Positions | Terminal     │
 └──────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Webhook Receiver** | Accept Helius webhook POSTs, validate, parse raw tx data | Express route handler, single `/webhook` endpoint |
| **Signal Processor** | Decode tx to identify buy/sell, apply rug filters, decide whether to copy | Pure functions: discriminator matching, dev-supply checks, position limit checks |
| **Trade Executor** | Build and send swap transactions to Solana | Two strategies: PumpFun bonding curve (direct instruction building) or Jupiter v6 API (post-migration). Auto-detect via bonding curve state. |
| **Position Manager** | Track open positions, calculate PNL, trigger exits | In-memory store with JSON persistence. Manages entry price, current price, stop-loss, take-profit, time-based exit. |
| **Event Bus** | Decouple components, broadcast state changes | Node.js EventEmitter or typed-emitter. Central nervous system of the app. |
| **CL1 Simulation Engine** | Generate fake biological neural stats reactive to real market data | Consumes event bus signals, outputs neuron firing rates, coherence scores, entropy values. Pure theater. |
| **WebSocket Server** | Push real-time updates to browser clients | ws library or Socket.IO on same Express server. Broadcasts event bus events to connected clients. |
| **Static Frontend** | Render dashboard with neuron grid, positions, terminal | React SPA served by Express. Connects via WebSocket. All rendering client-side. |
| **Price Monitor** | Poll/stream current prices for open positions | Periodic Jupiter price API calls or Helius/Birdeye price feeds. Updates position PNL. |

## Recommended Project Structure

```
src/
├── server/
│   ├── index.ts              # Express app, WebSocket server, bootstrap
│   ├── config.ts             # Environment config, wallet list, trade params
│   └── routes/
│       └── webhook.ts        # Helius webhook endpoint
├── core/
│   ├── events.ts             # Typed EventEmitter (central event bus)
│   ├── signal-processor.ts   # Decode txs, apply filters, emit signals
│   ├── trade-executor.ts     # Build & send swap txs (PumpFun + Jupiter)
│   ├── position-manager.ts   # Track positions, PNL, exit logic
│   ├── price-monitor.ts      # Poll prices for open positions
│   └── types.ts              # Shared types: Position, Signal, TradeResult
├── cl1/
│   ├── simulation-engine.ts  # CL1 stat generation (neurons, coherence, etc.)
│   ├── bios-log.ts           # Fake BIOS console output generator
│   └── types.ts              # CL1-specific types
├── solana/
│   ├── connection.ts         # Solana connection + Helius RPC setup
│   ├── wallet.ts             # Keypair management (env-loaded)
│   ├── pumpfun.ts            # PumpFun bonding curve interaction
│   ├── jupiter.ts            # Jupiter v6 swap API wrapper
│   └── utils.ts              # TX helpers, confirmation, retries
├── dashboard/                # React frontend (Vite build)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── components/
│   │   │   ├── StatusBar.tsx       # Top bar: neurons, electrodes, BIOS ver
│   │   │   ├── NeuronGrid.tsx      # Animated neuron activity visualization
│   │   │   ├── PositionsPanel.tsx  # Active positions with PNL
│   │   │   └── TerminalConsole.tsx # Scrolling neural decision log
│   │   ├── stores/
│   │   │   └── dashboardStore.ts   # Zustand store for WS state
│   │   └── styles/                 # Dark sci-fi theme CSS
│   └── index.html
└── data/
    └── positions.json        # Persisted position data (flat file)
```

### Structure Rationale

- **`server/`:** Thin HTTP layer. Express handles webhook ingestion and serves the built frontend. WebSocket upgrade happens here. Keeps network concerns isolated.
- **`core/`:** All trading logic. No network code, no UI code. Pure business logic that can be tested independently. The event bus lives here as the central coordination point.
- **`cl1/`:** Completely isolated simulation theater. Consumes events from core, produces display data. Can be developed and tested independently. Zero coupling to trading logic.
- **`solana/`:** Blockchain interaction layer. Wraps @solana/web3.js, PumpFun instructions, Jupiter API. Handles connection management, transaction building, confirmation polling.
- **`dashboard/`:** Standalone Vite React app. Built to static files, served by Express in production. Receives all data via WebSocket -- no REST API calls needed for real-time data.
- **`data/`:** Simple flat-file persistence. For a single-instance bot with 3-5 positions, SQLite is overkill. JSON file with atomic writes is sufficient.

## Architectural Patterns

### Pattern 1: Event-Driven Core with Central Bus

**What:** All components communicate through a typed EventEmitter. Webhook receiver emits `signal:raw`, signal processor listens and emits `signal:validated`, trade executor listens and emits `trade:executed`, etc. WebSocket server subscribes to all events and forwards to clients.

**When to use:** Always for this type of real-time bot. Components need loose coupling because they change independently (e.g., swapping PumpFun for different DEX, changing filter logic).

**Trade-offs:** Simple to reason about, easy to add new consumers. Debugging event chains can be harder than direct calls. Mitigated by structured logging at each event emission.

**Example:**
```typescript
// core/events.ts
import { TypedEmitter } from 'tiny-typed-emitter';

interface BotEvents {
  'signal:raw': (tx: RawWebhookPayload) => void;
  'signal:validated': (signal: ValidatedSignal) => void;
  'signal:rejected': (reason: string, tx: RawWebhookPayload) => void;
  'trade:executing': (signal: ValidatedSignal) => void;
  'trade:executed': (result: TradeResult) => void;
  'trade:failed': (error: Error, signal: ValidatedSignal) => void;
  'position:opened': (position: Position) => void;
  'position:updated': (position: Position) => void;
  'position:closed': (position: Position, reason: string) => void;
  'cl1:tick': (stats: CL1Stats) => void;
}

export const bus = new TypedEmitter<BotEvents>();
```

### Pattern 2: SAFE/LIVE Mode via Strategy Pattern

**What:** Trade executor accepts a strategy interface. SAFE mode returns simulated results (with realistic delays and fake tx signatures). LIVE mode sends real transactions. Both emit the same events, so the rest of the system (dashboard, CL1 sim, position manager) works identically.

**When to use:** From day one. Build SAFE mode first, entire dashboard works. Flip to LIVE when ready.

**Trade-offs:** Slight extra abstraction, but massive development benefit -- you can build and demo the full dashboard without spending any SOL.

**Example:**
```typescript
// core/trade-executor.ts
interface ExecutionStrategy {
  executeBuy(mint: string, solAmount: number): Promise<TradeResult>;
  executeSell(mint: string, tokenAmount: number): Promise<TradeResult>;
}

class SafeExecutor implements ExecutionStrategy {
  async executeBuy(mint: string, solAmount: number): Promise<TradeResult> {
    await delay(randomBetween(200, 800)); // Simulate network
    return {
      signature: `SAFE_${Date.now()}_${randomHex(8)}`,
      mint, solAmount,
      tokensReceived: estimateFromBondingCurve(mint, solAmount),
      mode: 'SAFE',
    };
  }
}

class LiveExecutor implements ExecutionStrategy {
  async executeBuy(mint: string, solAmount: number): Promise<TradeResult> {
    const isMigrated = await checkBondingCurveStatus(mint);
    if (isMigrated) {
      return this.jupiterSwap(mint, solAmount);
    }
    return this.pumpfunSwap(mint, solAmount);
  }
}
```

### Pattern 3: Reactive CL1 Stats from Market Data

**What:** CL1 simulation engine subscribes to trading events and transforms real market data into biological-sounding metrics. Higher volatility = higher entropy. Winning trades = higher coherence. New signal = neuron firing burst. This makes the theater reactive and believable.

**When to use:** For the CL1 simulation layer specifically.

**Trade-offs:** Adds a mapping layer, but makes the dashboard feel alive rather than random.

```typescript
// cl1/simulation-engine.ts
class CL1SimulationEngine {
  private state: CL1State;

  constructor(private bus: TypedEmitter<BotEvents>) {
    // React to real events
    bus.on('signal:validated', () => this.onNewSignal());
    bus.on('trade:executed', (r) => this.onTradeExecuted(r));
    bus.on('position:updated', (p) => this.onPositionUpdate(p));

    // Tick every 2-3 seconds for ambient activity
    setInterval(() => this.ambientTick(), 2500);
  }

  private onNewSignal() {
    this.state.firingRate = clamp(this.state.firingRate + 15, 0, 100);
    this.state.activeNeurons += randomBetween(3, 8);
    this.emitTick();
  }

  private onTradeExecuted(result: TradeResult) {
    this.state.coherence = clamp(this.state.coherence + 5, 0, 100);
    this.state.entropy = clamp(this.state.entropy - 3, 0, 100);
    this.emitTick();
  }
}
```

## Data Flow

### Primary Signal Flow (Webhook to Dashboard)

```
Helius Webhook POST
    ↓
Express /webhook handler (validate, parse)
    ↓
bus.emit('signal:raw', payload)
    ↓
Signal Processor (decode tx, check discriminator)
    ├── Is it a buy from tracked wallet? → Continue
    ├── Dev supply > threshold? → bus.emit('signal:rejected')
    ├── Max positions reached? → bus.emit('signal:rejected')
    └── Pass all filters → bus.emit('signal:validated')
    ↓
Trade Executor (SAFE or LIVE strategy)
    ├── Check bonding curve status
    ├── Route to PumpFun or Jupiter
    ├── Build, sign, send transaction
    └── bus.emit('trade:executed')
    ↓
Position Manager
    ├── Create position record (entry price, time, amount)
    ├── bus.emit('position:opened')
    └── Start monitoring for exit conditions
    ↓
CL1 Engine (reacts to all above events)
    └── bus.emit('cl1:tick', updatedStats)
    ↓
WebSocket Server (forwards all events to clients)
    ↓
React Dashboard (updates UI in real-time)
```

### Position Exit Flow

```
Price Monitor (polls every 5-10 seconds)
    ↓
Position Manager checks each position:
    ├── Tracked wallet sold? → Exit (copy sell)
    ├── PNL > take_profit_pct? → Exit (take profit)
    ├── PNL < -stop_loss_pct? → Exit (stop loss)
    ├── Time > max_hold_time? → Exit (time-based)
    └── None triggered → Continue holding
    ↓
Trade Executor (sell via PumpFun or Jupiter)
    ↓
bus.emit('position:closed', position, reason)
    ↓
CL1 Engine + WebSocket → Dashboard
```

### State Management

```
Server-side state (in-memory + JSON persistence):
    ├── positions: Map<string, Position>     # Active positions
    ├── cl1State: CL1State                   # Current simulation stats
    ├── config: BotConfig                    # Trade params, wallet list
    └── mode: 'SAFE' | 'LIVE'               # Execution mode

Client-side state (Zustand store):
    ├── positions: Position[]                # Mirrored from server via WS
    ├── cl1Stats: CL1Stats                   # Latest CL1 tick
    ├── terminalLogs: LogEntry[]             # Rolling buffer (last ~200)
    └── connected: boolean                   # WS connection status
```

### Key Data Flows

1. **Signal detection to trade execution:** Helius webhook POST -> Express -> Signal Processor -> Trade Executor -> Solana. Entire chain should complete in under 2 seconds for competitive copy-trading. The Helius webhook provides parsed or raw tx data; the signal processor just needs to decode instruction discriminators and check accounts.

2. **Real-time dashboard updates:** Every event bus emission triggers a WebSocket broadcast. The client receives typed JSON messages and updates Zustand store. React components subscribe to specific store slices and re-render.

3. **CL1 theater generation:** CL1 engine runs on a 2-3 second ambient tick plus reactive bursts from trading events. Stats are deterministic-ish (seeded from real market data) so they look consistent, not random. Terminal log entries combine real trading events with generated neural language.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (you) | Monolith is perfect. Single Railway service. In-memory state + JSON file. No database needed. |
| 10-50 viewers | Same architecture. WebSocket server handles this trivially. Add connection count logging. |
| 100+ concurrent viewers | Consider serving frontend from CDN (Cloudflare Pages) with WS connecting back to Railway. Reduces static asset load on the service. |
| Multiple bots | Would need to split into services. Not in scope -- don't architect for this. |

### Scaling Priorities

1. **First bottleneck: Webhook processing speed.** If Helius sends a webhook and your server takes too long to respond, you miss the trade window. Keep webhook handler fast -- validate, enqueue, respond 200 immediately, process async.
2. **Second bottleneck: Transaction confirmation.** Solana tx confirmation can take 1-30 seconds. Use `skipPreflight: true` and poll confirmation status separately. Never block the event loop waiting for confirmation.

## Anti-Patterns

### Anti-Pattern 1: Polling RPC Instead of Webhooks

**What people do:** Use `onAccountChange` or periodic `getTransaction` calls to detect wallet activity instead of Helius webhooks.
**Why it's wrong:** Higher latency (you're polling, not being pushed), burns RPC credits, misses transactions during polling gaps, rate-limited during Solana congestion. Helius webhooks are push-based with automatic retries.
**Do this instead:** Use Helius Enhanced Transaction Webhooks for wallet monitoring. Reserve RPC WebSocket subscriptions for price monitoring only.

### Anti-Pattern 2: Database for 3-5 Positions

**What people do:** Set up PostgreSQL or SQLite for position tracking in a bot that holds 3-5 concurrent positions.
**Why it's wrong:** Massive over-engineering. Adds deployment complexity (Railway database service), migration management, connection pooling -- all for a handful of records.
**Do this instead:** In-memory Map with periodic JSON file persistence. On startup, load from JSON. On position change, write to JSON. If the process crashes, you lose at most the last few seconds of state, and positions are still on-chain for manual recovery.

### Anti-Pattern 3: Microservices for a Single-User Bot

**What people do:** Split webhook receiver, trade executor, and dashboard into separate services with message queues between them.
**Why it's wrong:** Adds network latency between components (critical for copy-trading speed), deployment complexity, and debugging difficulty. For a single-user bot, the overhead far outweighs the benefit.
**Do this instead:** Single Node.js process with in-process EventEmitter. All components share memory. Deploy as one Railway service.

### Anti-Pattern 4: REST API for Dashboard Data

**What people do:** Build REST endpoints that the dashboard polls every N seconds for position updates and stats.
**Why it's wrong:** Adds latency (poll interval), wastes bandwidth (most polls return unchanged data), creates unnecessary server load, and the dashboard feels sluggish.
**Do this instead:** WebSocket-only data flow. Server pushes events as they happen. Dashboard reflects state in real-time. No polling, no REST for live data.

### Anti-Pattern 5: Building LIVE Mode First

**What people do:** Start with real transaction execution, then add paper trading later.
**Why it's wrong:** You spend real SOL while debugging. Bugs in filter logic or exit strategy cost money. Dashboard development is blocked until chain interaction works.
**Do this instead:** Build SAFE mode first. The entire dashboard, CL1 simulation, and position management work identically in SAFE mode. Only the trade executor differs. Switch to LIVE once everything is proven.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Helius Webhooks** | POST to Express endpoint. Enhanced Transaction type for parsed data, or Raw for lower latency. | Free tier: limited webhooks. Paid tier recommended for reliability. Webhook events cost 1 credit each. Configure with Helius SDK or REST API. |
| **PumpFun Bonding Curve** | Direct on-chain instruction building via @solana/web3.js. No official API -- build instructions manually using program IDL. | Use pumpfun-pumpswap-sdk or equivalent. Must check bonding curve PDA to determine if token has migrated. |
| **Jupiter v6 Swap API** | REST API: GET /quote then POST /swap. Returns serialized transaction to sign locally. | Public API at `https://quote-api.jup.ag/v6`. Rate limits apply. Consider QuickNode Metis for higher limits. |
| **Solana RPC** | @solana/web3.js Connection with Helius RPC URL. Used for tx submission, confirmation, account reads. | Use Helius RPC (included with webhook plan). Avoid public RPC for trading -- too slow and rate-limited. |
| **Price Data** | Jupiter Price API or Birdeye API for current token prices. Poll every 5-10 seconds for open positions. | Jupiter: `https://price.jup.ag/v4/price?ids=TOKEN`. Free, no auth needed. Sufficient for 3-5 positions. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Webhook Receiver <-> Signal Processor | EventEmitter (`signal:raw`) | Async. Webhook handler responds 200 immediately, emits event for processing. |
| Signal Processor <-> Trade Executor | EventEmitter (`signal:validated`) | Executor subscribes. Multiple executors possible (SAFE + LIVE) but only one active. |
| Trade Executor <-> Solana Layer | Direct function calls | Synchronous within async context. Executor calls `pumpfun.buy()` or `jupiter.swap()`. |
| Position Manager <-> Price Monitor | Direct function calls + EventEmitter | Price monitor updates positions, position manager checks exit conditions, emits events. |
| All Core <-> CL1 Engine | EventEmitter (one-way) | CL1 engine is read-only consumer. It never affects trading decisions. Complete isolation. |
| All Core <-> WebSocket Server | EventEmitter (one-way) | WS server subscribes to all events, serializes to JSON, broadcasts to connected clients. |
| WebSocket Server <-> React Frontend | WebSocket (ws/wss) | JSON messages. Client reconnects automatically on disconnect. Server sends full state snapshot on connect. |

## Build Order Implications

The architecture has clear dependency chains that inform phase ordering:

```
Phase 1: Foundation
    Express server + config + Solana connection
    Event bus
    SAFE mode executor (no chain interaction needed)
    ↓ (enables everything else)

Phase 2: Core Trading Loop (SAFE)
    Webhook receiver (Helius integration)
    Signal processor (tx decoding + filters)
    Position manager (in-memory + JSON)
    Wire together: webhook -> signal -> SAFE trade -> position
    ↓ (trading loop works end-to-end in paper mode)

Phase 3: Dashboard
    WebSocket server (broadcasts event bus)
    React frontend (all 4 panels)
    CL1 simulation engine
    ↓ (full visual experience, still SAFE mode)

Phase 4: LIVE Trading
    PumpFun bonding curve integration
    Jupiter v6 swap integration
    Bonding curve migration detection
    LIVE executor replacing SAFE
    ↓ (real money on the line)

Phase 5: Hardening
    Exit strategy tuning (stop-loss, take-profit, time-based)
    Error recovery (tx failures, RPC issues)
    Rug filter refinement
    Price monitoring accuracy
```

**Key dependency insight:** The CL1 simulation and dashboard (Phase 3) can be built in parallel with core trading logic (Phase 2) because they only consume events. The event bus is the critical abstraction that enables this parallelism.

**SAFE mode is the linchpin:** Building it first means the dashboard looks fully functional from Phase 3 onward, even before real Solana integration exists. This matters for the project's viral-content goal -- you can start creating screenshot/video content before risking any SOL.

## Sources

- [QuickNode: PumpFun Copy Trade Guide](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade) - MEDIUM confidence (verified architecture patterns)
- [Helius Webhooks Documentation](https://www.helius.dev/docs/webhooks) - HIGH confidence (official docs)
- [Helius Wallet Tracker Tutorial](https://www.helius.dev/blog/build-a-wallet-tracker-on-solana) - HIGH confidence (official tutorial)
- [Jupiter V6 Swap API Docs](https://hub.jup.ag/docs/apis/swap-api) - HIGH confidence (official docs)
- [PumpFun-PumpSwap SDK](https://github.com/Erbsensuppee/pumpfun-pumpswap-sdk) - MEDIUM confidence (open-source, auto bonding curve switching)
- [Chainstack PumpFun Bot](https://github.com/chainstacklabs/pumpfun-bonkfun-bot) - MEDIUM confidence (production-tested reference)
- [Railway Express Deployment Guide](https://docs.railway.com/guides/express) - HIGH confidence (official docs)
- [Railway WebSocket Server Template](https://railway.com/deploy/nodejs-websocket-game-server) - HIGH confidence (official template)
- [Dysnix Solana Trading Bot Infrastructure Guide 2026](https://dysnix.com/blog/solana-trading-bot-guide) - MEDIUM confidence (industry guide)
- [RPC Fast Solana Trading Bots Guide 2026](https://rpcfast.com/blog/solana-trading-bot-guide) - MEDIUM confidence (industry guide)

---
*Architecture research for: Solana copy-trading bot with CL1 neural simulation dashboard*
*Researched: 2026-03-09*
