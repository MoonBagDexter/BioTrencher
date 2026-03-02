# Technology Stack

**Project:** BioTrencher
**Researched:** 2026-03-09
**Overall Confidence:** MEDIUM-HIGH

## Recommended Stack

### Runtime & Language

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js | 22 LTS | Server runtime | Railway auto-detects, ES modules native, V8 v12.4, WebSocket support built-in | HIGH |
| TypeScript | ~5.7 | Type safety | Catches Solana instruction building errors at compile time, all SDKs have TS types | HIGH |

### Solana Core

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @solana/web3.js | 1.98.x | Solana interactions | PumpFun SDK requires it as peer dep via @coral-xyz/anchor. Do NOT use v2/@solana/kit directly -- the PumpFun SDK pins to web3.js v1 APIs. Helius SDK v2 uses @solana/kit internally but that's their concern, not ours. | HIGH |
| @coral-xyz/anchor | latest | Program interaction | Required peer dep for @pump-fun/pump-sdk; provides instruction deserialization for decoding copy-trade target transactions | MEDIUM |
| bs58 | ^6.0 | Base58 encoding | Solana key encoding/decoding, tiny dep, universal in Solana ecosystem | HIGH |

**Critical note on @solana/kit vs @solana/web3.js:** The ecosystem is mid-migration. @solana/kit (v3.0.3, formerly web3.js v2) is the future, but @pump-fun/pump-sdk still depends on @solana/web3.js v1 + Anchor. Using kit directly would mean managing two incompatible Solana stacks. Stick with web3.js v1 until PumpFun SDK migrates.

### Wallet Monitoring

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| helius-sdk | 2.0.5 | Helius API + webhooks | Official SDK, webhook CRUD, enhanced transaction parsing, Jito-aware sender. v2 uses @solana/kit internally. | HIGH |

**Helius webhooks vs Yellowstone gRPC:** gRPC streaming is 3-6x faster (50-100ms vs 300-500ms). However, for BioTrencher's 0.05-0.1 SOL trades with theater focus, webhooks are the right call:
- Simpler infrastructure (HTTP POST to your endpoint vs maintaining gRPC stream)
- Railway-friendly (just an HTTP endpoint, no persistent gRPC connection to manage)
- Good enough latency for the trade sizes involved
- Project goal is viral dashboard, not competitive HFT

If latency becomes a problem in LIVE mode, upgrade path is: Helius LaserStream (Yellowstone-compatible gRPC) or QuickNode Yellowstone via `@triton-one/yellowstone-grpc`.

### Trading / DEX

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @pump-fun/pump-sdk | 1.28.0 | PumpFun bonding curve buys/sells | Official SDK from PumpFun team (npm: @pumpfun). Returns TransactionInstruction[] -- you control signing/sending. Covers bonding curve math, buy/sell quoting, graduation tracking. | HIGH |
| @pump-fun/pump-swap-sdk | 1.14.1 | Post-graduation AMM trading | Official SDK for PumpSwap AMM (post-bonding-curve). Tokens now graduate to PumpSwap (not Raydium). | MEDIUM |
| @jup-ag/api | 6.0.48 | Jupiter swap aggregator | For post-migration swaps if token migrated before PumpSwap existed (legacy Raydium pools). Jupiter V6 API client. Use as fallback behind PumpSwap SDK. | HIGH |

**Important update on token graduation:** PumpFun tokens now graduate to PumpSwap (Pump's own AMM), NOT Raydium. The PROJECT.md mentions "Jupiter for post-migration" but the correct 2026 flow is: bonding curve -> PumpSwap AMM. Jupiter can still route through PumpSwap pools, so keep it as a fallback aggregator, but the primary post-graduation SDK should be @pump-fun/pump-swap-sdk.

### MEV Protection

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Jito bundles (via helius-sdk) | - | MEV-protected transaction sending | Helius SDK v2 has `sendTransactionWithSender()` that dual-routes to validators AND Jito infra. No separate Jito SDK needed. 95% of Solana stake runs Jito validator client. | MEDIUM |

If Helius sender proves insufficient, direct Jito bundle submission is available via `jito-ts` or the Jito JSON-RPC API. But start with Helius sender -- it's simpler and handles the bundle tip logic.

### Backend Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Express | ^5.0 | HTTP server + webhook receiver | Lightweight, receives Helius webhook POSTs, serves dashboard API. Express 5 is stable as of 2025. Minimal overhead vs Fastify for this use case. | HIGH |
| ws | ^8.0 | WebSocket server | Push real-time updates to dashboard (positions, neural stats, terminal logs). Native Node.js WebSocket library, Railway supports WebSocket natively. | HIGH |

**Why not Socket.IO:** Socket.IO adds fallback transports (HTTP long-polling) and rooms/namespaces we don't need. `ws` is lighter, faster, and sufficient for a single-page dashboard consuming a real-time feed. All modern browsers support native WebSocket.

### Frontend / Dashboard

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | ^19.0 | UI framework | Component model fits dashboard panels (neuron grid, positions, terminal). Huge ecosystem. | HIGH |
| Vite | ^6.0 | Build tool + dev server | 60ms HMR, zero-config TS, tree-shaking. Best choice for SPA dashboards -- no SSR/SSG overhead of Next.js. Dashboard is fully client-side, no SEO needed. | HIGH |
| Tailwind CSS | ^4.0 | Styling | Utility-first, fast iteration on dark/cyberpunk aesthetic. JIT compilation. v4 released 2025. | HIGH |
| motion (Framer Motion) | ^12.0 | UI animations | Smooth transitions for panels, stagger effects for terminal entries, layout animations. Renamed from framer-motion to motion in late 2024. Import from "motion/react". | HIGH |
| HTML5 Canvas (native) | - | Neuron activity grid | Custom canvas rendering for the animated neural network visualization. No library needed -- requestAnimationFrame + canvas API gives full control over the "brain activity" aesthetic. tsParticles is an option but custom canvas gives better narrative control. | MEDIUM |

**Why Vite over Next.js:** This is a single-page real-time dashboard behind no auth (public view). No SEO, no SSR, no API routes needed in the frontend. Next.js would add server complexity for zero benefit. Vite + React is the standard 2026 choice for SPA dashboards.

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| better-sqlite3 | ^11.0 | Trade history, position state, config | Zero-config, single-file DB, synchronous API (no callback overhead), perfect for single-process trading bot. Railway supports filesystem persistence. | MEDIUM |

**Why SQLite over PostgreSQL:** BioTrencher is a single-process bot with 3-5 concurrent positions. There's no multi-service architecture, no concurrent writers, no need for network-accessible DB. SQLite eliminates an entire infrastructure dependency. If the project grows to need shared state across services, migration to PostgreSQL via Railway's managed Postgres is straightforward.

**Schema covers:** positions (active/closed), trade history, wallet watchlist, paper trade results, PnL tracking.

### Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Railway | - | Hosting | User requirement. Supports Node.js, WebSockets, auto-SSL, GitHub deploys. Has managed PostgreSQL if SQLite proves insufficient. | HIGH |
| dotenv | ^16.0 | Environment config | Standard .env management for API keys (Helius, RPC endpoint), wallet private key, trade params | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @solana/spl-token | latest | SPL token operations | Creating/checking associated token accounts for bought tokens |
| bn.js | ^5.0 | Big number math | Required by PumpFun SDK for token amounts, bonding curve calculations |
| cron / node-cron | ^3.0 | Scheduled tasks | Time-based exit strategy, periodic position health checks |
| winston or pino | latest | Structured logging | Trade execution logs, error tracking, debug output. Pino is faster but winston has more transports. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Solana SDK | @solana/web3.js v1 | @solana/kit (v2) | PumpFun SDK depends on web3.js v1 + Anchor. Two Solana stacks = pain. |
| Wallet monitoring | Helius webhooks | Yellowstone gRPC | gRPC is faster but adds infra complexity. Webhooks sufficient for 0.05 SOL trades. Clear upgrade path exists. |
| Post-graduation DEX | @pump-fun/pump-swap-sdk | Jupiter only | PumpSwap is now where tokens graduate. Jupiter routes through it anyway. Use native SDK for lower latency. |
| Frontend framework | Vite + React | Next.js | No SSR/SEO needed. Next.js adds server complexity for a client-only dashboard. |
| Database | SQLite (better-sqlite3) | PostgreSQL | Single-process bot, no concurrent writers. SQLite = zero infra. Upgrade path to Railway Postgres exists. |
| WebSocket | ws | Socket.IO | Socket.IO's fallback transports and room system are unnecessary overhead for a single dashboard stream. |
| CSS | Tailwind | styled-components / CSS modules | Tailwind is faster for rapid dark-theme iteration. Utility classes compose well for dashboard layouts. |
| Animation | motion + custom canvas | Three.js / react-three-fiber | 3D is overkill for a 2D neuron grid. Canvas API + motion covers all visual needs without WebGL overhead. |
| Neuron visualization | Custom Canvas | tsParticles | tsParticles has linked-particle presets but custom canvas gives precise control over the CL1 neural narrative (firing patterns, electrode grid, coherence waves). |
| HTTP framework | Express | Fastify / Hono | Express is simpler for webhook receiving + static file serving. Fastify's perf advantage irrelevant for <100 req/s. |

## Installation

```bash
# Core Solana + Trading
npm install @solana/web3.js @solana/spl-token @coral-xyz/anchor bn.js bs58
npm install @pump-fun/pump-sdk @pump-fun/pump-swap-sdk
npm install @jup-ag/api
npm install helius-sdk

# Backend
npm install express ws dotenv better-sqlite3 pino node-cron

# Dev dependencies
npm install -D typescript @types/node @types/express @types/ws @types/better-sqlite3
npm install -D tsx # for running TS directly in dev

# Frontend (separate package.json in /dashboard or /client)
npm create vite@latest dashboard -- --template react-ts
cd dashboard
npm install motion @tsparticles/react  # tsparticles optional, for fallback
npm install -D tailwindcss @tailwindcss/vite
```

## Project Structure Recommendation

```
biotrencher/
  server/           # Node.js backend
    src/
      webhook/      # Helius webhook handler
      trading/      # Copy-trade execution engine
      strategy/     # Filters, position sizing, exit logic
      theater/      # CL1 stat generation
      ws/           # WebSocket broadcaster
      db/           # SQLite schema + queries
  dashboard/        # Vite + React frontend
    src/
      components/
        NeuronGrid/     # Canvas-based neural visualization
        PositionsPanel/ # Active trades + PnL
        Terminal/       # Scrolling log console
        StatusBar/      # Top bar with CL1 stats
      hooks/
        useWebSocket.ts # WS connection to server
  .env              # API keys, wallet, config
```

## Monorepo vs Separate Packages

Use a **single repo with two entry points** (server + dashboard), NOT a monorepo tool like Turborepo or Nx. The project is small enough that a simple `package.json` at root with workspaces or just two separate `package.json` files works fine. Railway can deploy the server, and the dashboard can be built as static files served by Express.

Simpler approach: Express serves the built React dashboard as static files from a `/dist` directory. Single Railway service, single deploy. WebSocket connection is to the same host on the same port.

## Key Version Pins & Compatibility Notes

| Concern | Detail |
|---------|--------|
| @solana/web3.js security | Versions 1.95.6 and 1.95.7 were compromised (malicious publish). Use 1.95.8+ or latest 1.x. |
| PumpFun SDK peer deps | Requires @solana/web3.js, @solana/spl-token, @coral-xyz/anchor, bn.js. Check peer dep versions on install. |
| Helius SDK v2 breaking changes | v2.0.0 rewrote internals to use @solana/kit. If you import Helius types, some have changed. Check migration guide. |
| Token graduation destination | As of 2025, tokens graduate to PumpSwap (Pump's AMM), NOT Raydium. Update PROJECT.md accordingly. |
| motion package rename | framer-motion is now "motion". Import from "motion/react", not "framer-motion". |

## Sources

### HIGH Confidence (official docs, npm, GitHub)
- [@solana/kit v3.0.3 on npm](https://www.npmjs.com/package/@solana/kit) - Anza's official SDK, successor to web3.js v2
- [@pump-fun/pump-sdk v1.28.0 on npm](https://www.npmjs.com/package/@pump-fun/pump-sdk) - Official PumpFun bonding curve SDK
- [@pump-fun/pump-swap-sdk v1.14.1 on npm](https://www.npmjs.com/package/@pump-fun/pump-swap-sdk) - Official PumpSwap AMM SDK
- [@jup-ag/api v6.0.48 on npm](https://www.npmjs.com/package/@jup-ag/api) - Jupiter V6 swap API client
- [helius-sdk v2.0.5 on npm](https://www.npmjs.com/package/helius-sdk) - Helius Node.js SDK
- [Helius Webhooks docs](https://www.helius.dev/docs/webhooks) - Webhook setup and types
- [Solana web3.js v2 renamed to @solana/kit](https://blog.triton.one/intro-to-the-new-solana-kit-formerly-web3-js-2/) - Triton One announcement
- [Anza Solana SDK 2.0 release](https://www.anza.xyz/blog/solana-web3-js-2-release) - Official release announcement
- [Railway WebSocket support](https://railway.com/deploy/DZV--w) - Node.js WebSocket template
- [Jupiter V6 Swap API docs](https://hub.jup.ag/docs/apis/swap-api) - Official API documentation
- [motion.dev](https://motion.dev/) - Motion (formerly Framer Motion) official site

### MEDIUM Confidence (verified tutorials, multiple sources agree)
- [QuickNode PumpFun copy trade guide](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade) - Copy trading architecture pattern with Yellowstone gRPC
- [Helius blog: web3.js 2.0 SDK](https://www.helius.dev/blog/how-to-start-building-with-the-solana-web3-js-2-0-sdk) - Migration guidance
- [Solana trading bot architecture guide (Dysnix)](https://dysnix.com/blog/solana-trading-bot-guide) - Infrastructure patterns
- [Vite vs Next.js 2026 comparison](https://designrevision.com/blog/vite-vs-nextjs) - Framework selection rationale
- [Chainstack: Building a PumpFun bot](https://docs.chainstack.com/docs/solana-creating-a-pumpfun-bot) - Direct instruction building patterns
- [Builderby Solana swap tutorial](https://github.com/builderby/solana-swap-tutorial) - Jupiter V6 + Jito bundles TypeScript

### LOW Confidence (single source, unverified)
- PumpSwap graduation threshold ($69K market cap) - from Medium article, not verified against on-chain program
- gRPC latency numbers (50-100ms vs 300-500ms for webhooks) - from RPC Fast case study, specific to their infra
