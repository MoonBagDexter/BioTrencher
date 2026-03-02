# Feature Research

**Domain:** Biological neural network trading dashboard (PumpFun copy-trading with CL1 simulation theater)
**Researched:** 2026-03-09
**Confidence:** MEDIUM (cross-domain product with limited direct competitors; PredictLLM is the primary reference point)

## Feature Landscape

This product sits at the intersection of three domains: (1) Solana trading bot dashboards, (2) biological computing visualization UIs, and (3) viral crypto narrative theater. Features are evaluated against all three.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or fake.

**Dashboard Core**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Real-time position panel with PNL | Every trading dashboard shows this; without it, the "trader" narrative collapses | MEDIUM | Must show entry price, current price, unrealized PNL %, and token name. Pull from on-chain data for LIVE mode, simulate for SAFE mode |
| Win rate / overall stats bar | Axiom, GMGN, and every wallet tracker show this prominently; audiences on Twitter use win rate as credibility signal | LOW | Aggregate stats: total trades, win rate, total PNL. Displayed in top status bar |
| Live terminal / console log | PredictLLM has terminal output; crypto Twitter expects "hacker aesthetic" scrolling logs | MEDIUM | Scrolling text showing decisions, trade executions, and neural activity. This is the most screenshot-friendly panel |
| Status indicators (online/active state) | Users need to see the system is alive and running, not a static screenshot | LOW | Connection status, uptime, last trade timestamp |
| Dark theme / sci-fi aesthetic | Every crypto trading dashboard and AI agent dashboard uses dark mode; light mode would look amateur | LOW | Non-negotiable. Dark background, neon/matrix green or cyan accents |
| Mobile-responsive layout | Twitter clips get viewed on phones; dashboard must look good in screenshots at any viewport | MEDIUM | At minimum, the key panels must be legible on mobile viewports for screenshot sharing |

**Trading Engine (Backend)**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Wallet monitoring (Helius webhooks) | Core copy-trading mechanism; without this, no trades happen | HIGH | Subscribe to wallet transaction events, parse swap instructions, extract token mint and amounts |
| Copy-trade execution (buy) | Must actually buy the same token the tracked wallet bought | HIGH | PumpFun bonding curve for pre-migration, Jupiter for post-migration. Needs RPC + swap SDK integration |
| Sell strategy (multi-signal) | Can't just buy; need exits. Every serious bot has TP/SL | HIGH | Copy wallet sells + take profit % + stop loss % + time-based exit. Priority: copy-sell > stop-loss > take-profit > time-exit |
| Rug protection filters | Table stakes for any PumpFun bot in 2026. Trojan, Axiom, GMGN all have these. Without them, you get rekt on camera | MEDIUM | Dev/top wallet supply concentration check. Mint authority check. Freeze authority check (PumpFun revokes by default, but verify) |
| SAFE mode (paper trading) | Test the system without risking SOL; dashboard looks identical in both modes | MEDIUM | Full simulation with fake executions but real webhook signals. Dashboard displays mock positions |
| LIVE mode (real execution) | The whole point; provable on-chain trades | HIGH | 0.05-0.1 SOL per trade, 3-5 max concurrent positions, real wallet with verifiable txns |

**CL1 Biological Theater**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Neuron activity grid / electrode visualization | PredictLLM has 3D electrode visualization; this is the visual centerpiece that makes the "biological" claim believable | HIGH | Animated grid showing electrode firing patterns. Does NOT need to be 3D -- a 2D grid with color-coded activity states is more performant and still looks incredible |
| Biological stats in status bar | CL1 terminology (neurons, electrodes, coherence, entropy, firing rate) must be visible at a glance | LOW | Numbers that update reactively based on market conditions. Values derived from market data (volatility -> entropy, volume -> firing rate, etc.) |
| BIOS version / system info | PredictLLM references biOS v2.4.1; having firmware version info adds authenticity | LOW | Static or slowly incrementing version string. "biOS v2.4.1" or similar |
| Neural decision logs in terminal | The terminal must show "neural" reasoning, not just trade logs | MEDIUM | "Coherence spike on cluster 7-12... pattern match: bullish divergence... confidence 0.847... EXECUTING BUY" style messages |

### Differentiators (Competitive Advantage)

Features that set BioTrencher apart. Not expected in typical trading bots, but these create the viral narrative.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Neural confidence" bar per position | Each open position shows a CL1 confidence score (0-100%) that fluctuates with market data. No other trading bot does this. Makes every screenshot tell a story | LOW | Derived from a simple formula (price momentum + volume + time held). Purely cosmetic but extremely compelling |
| Electrode cluster highlighting on trade events | When a trade fires, specific electrode clusters "light up" on the neuron grid, creating a visual link between the brain and the trade | MEDIUM | Map each tracked wallet to an electrode cluster. When a signal comes in, that cluster activates. Pure theater but visually stunning |
| Reactive biological stats tied to real market data | Stats aren't random -- they correlate with actual market conditions. Viewers who watch long enough notice the pattern, which reinforces authenticity | MEDIUM | Entropy rises with market volatility. Firing rate rises with trade volume. Coherence rises when positions are profitable. This creates a "it actually works" illusion |
| On-chain provability callout | Prominent display of the bot's wallet address with a "Verify on Solscan" link. The fact that trades are real and verifiable is the ultimate differentiator from pure grifts | LOW | Wallet address + link to Solscan. Updated after each trade. Maybe a "last verified tx" timestamp |
| Fake BIOS boot sequence | On page load, show a boot sequence terminal (loading biOS, initializing MEA, calibrating electrodes, establishing neural baseline). Sets the stage before the dashboard appears | MEDIUM | 3-5 second animation on first load. Can be skipped on refresh. Creates a "this is real hardware" impression |
| Sound design (optional) | Subtle ambient sounds -- electrode pings, low hum -- when viewing the dashboard. Creates immersion for screen recordings | LOW | Optional, off by default. Subtle enough to not be annoying. Enhances video content |
| Culture health indicator | Show "neuron count" and "culture age" (days alive) that slowly degrade over a 28-day cycle (matching real CL1 cartridge lifespan), then "reset" when new culture is loaded | LOW | Pure theater but adds temporal narrative. "Day 14/28 -- 187,000 neurons active" |
| Trade history with neural annotations | Historical trades show not just PNL but which electrode clusters fired and what the "neural reasoning" was | MEDIUM | Stored alongside trade records. Useful for Twitter threads showing past performance |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific product.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / multi-user dashboard | "Let people sign in and track their own bots" | Scope explosion. This is a single-agent public theater piece, not a SaaS. Adding auth, user state, and permissions triples complexity for zero viral value | Keep it as a single public dashboard. One URL, one brain, one wallet |
| Telegram/Discord bot notifications | "Send trade alerts to channels" | Splits attention from the dashboard. The dashboard IS the product. Also creates maintenance burden for bot hosting, rate limits, and API management | If notifications are needed later, add a simple Twitter/X auto-post of trades. That feeds the viral loop directly |
| 3D electrode visualization | PredictLLM uses 3D; "we should too" | 3D adds massive complexity (Three.js/WebGL), performance issues on mobile, and accessibility problems. A well-designed 2D grid with animations is more legible and more performant | 2D grid with color gradients, pulse animations, and cluster highlighting. Still looks incredible, runs everywhere |
| Real CL1 integration | "Why not connect to actual CL1 hardware?" | $35K per unit, 28-day cartridge lifespan, requires lab environment, adds zero value to the narrative (the simulation IS the product) | Simulate everything. The point is viral theater, not neuroscience |
| Dynamic wallet discovery | "Automatically find profitable wallets to copy" | Unreliable, computationally expensive, and introduces bad signals. The curated list IS the alpha | Static wallet list, manually curated. Quality over quantity |
| TradingView chart integration | "Show price charts for each position" | Adds complexity, requires TradingView widget licensing or charting library integration, and dilutes the biological narrative. This isn't a trading terminal | Show simple PNL numbers and percentage changes. The focus is on the neural grid, not candlestick charts |
| Portfolio rebalancing / position sizing optimization | "Optimize trade sizes based on confidence" | Over-engineering for a 0.05-0.1 SOL fixed-size bot. Variable sizing adds risk management complexity for marginal benefit at these trade sizes | Fixed trade size. Simple, predictable, easy to audit |
| Historical backtesting UI | "Show how the bot would have performed" | Backtesting is meaningless for copy-trading (you'd be backtesting other wallets' decisions, not the "neural network"). Also massive engineering effort | Show real track record instead. On-chain history is the backtest |

## Feature Dependencies

```
[Helius Webhook Monitoring]
    |
    +--requires--> [Wallet List Configuration]
    |
    +--enables--> [Copy-Trade Execution]
    |                |
    |                +--requires--> [PumpFun Swap SDK]
    |                +--requires--> [Jupiter Swap SDK]
    |                +--enables--> [Position Tracking / PNL Panel]
    |                +--enables--> [Trade History]
    |
    +--enables--> [Rug Protection Filters]
                     |
                     +--gates--> [Copy-Trade Execution] (filter must pass before buy)

[Market Data Feed]
    |
    +--enables--> [CL1 Biological Stats Simulation]
    |                |
    |                +--enables--> [Neuron Activity Grid]
    |                +--enables--> [Status Bar Stats]
    |                +--enables--> [Neural Decision Logs]
    |                +--enables--> [Neural Confidence per Position]
    |
    +--enables--> [Sell Strategy Engine]
                     |
                     +--requires--> [Position Tracking]

[Dashboard Shell (layout, dark theme, panels)]
    |
    +--enables--> ALL visual components
    +--independent-of--> Trading Engine (can be built in parallel)

[SAFE Mode]
    +--requires--> [Helius Webhooks] (real signals)
    +--requires--> [Dashboard Shell]
    +--independent-of--> [Swap SDKs] (no real execution)

[LIVE Mode]
    +--requires--> [SAFE Mode working first]
    +--requires--> [Swap SDKs]
    +--requires--> [Rug Filters]
```

### Dependency Notes

- **Dashboard Shell is independent of Trading Engine:** These can be developed in parallel. The dashboard can use mock data while the backend is built.
- **SAFE mode before LIVE mode:** SAFE mode validates the full pipeline (webhooks -> filters -> display) without risking SOL. LIVE mode adds swap execution on top.
- **CL1 simulation depends on market data feed:** The biological stats need real market data (volatility, volume, price action) to generate reactive values. Without market data, stats are just random noise.
- **Rug filters gate trade execution:** Filters must evaluate before any buy executes. This is a hard dependency in the execution pipeline.
- **Sell strategy requires position tracking:** Can't sell what you're not tracking. Position state management is a prerequisite.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate the concept (get a viral tweet).

- [ ] **Dashboard shell with dark theme** -- The frame that holds everything. Top status bar, neuron grid, positions panel, terminal console. Layout only, can use mock data initially
- [ ] **CL1 biological stats simulation** -- Reactive stats tied to market data. This is the hook that makes screenshots compelling
- [ ] **Neuron activity grid (2D)** -- Animated electrode grid with firing patterns. The visual centerpiece
- [ ] **Terminal console with neural decision logs** -- Scrolling log mixing neural language with trade actions. Most screenshot-friendly panel
- [ ] **Helius webhook monitoring** -- Real-time wallet transaction detection. The signal source
- [ ] **Rug protection filters** -- Dev supply concentration, mint/freeze authority checks. Prevents embarrassing losses on camera
- [ ] **Copy-trade execution (PumpFun + Jupiter)** -- Actually execute buy trades
- [ ] **Sell strategy (copy-sell + TP/SL + time-exit)** -- Exit positions automatically
- [ ] **Position panel with PNL** -- Show active positions with real-time PNL. Proves the bot is actually trading
- [ ] **SAFE mode** -- Paper trading mode for testing. Dashboard looks identical to LIVE
- [ ] **On-chain provability (wallet address display)** -- Show wallet + Solscan link

### Add After Validation (v1.x)

Features to add once the core is working and initial viral tweet is posted.

- [ ] **BIOS boot sequence animation** -- Trigger: after v1 gets traction, this adds polish for follow-up content
- [ ] **Trade history with neural annotations** -- Trigger: when people ask "show me past trades"
- [ ] **Electrode cluster highlighting on trade events** -- Trigger: when video content needs more visual flair
- [ ] **Culture health indicator (neuron count + age)** -- Trigger: when the narrative needs temporal depth ("day 14 of culture 3")
- [ ] **Sound design** -- Trigger: when making screen recording content for Twitter/YouTube

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Twitter/X auto-posting of trades** -- Why defer: requires Twitter API integration, rate limit management, content formatting. Do manually first to learn what resonates
- [ ] **Multiple wallet monitoring strategies** -- Why defer: start with one curated list, expand only if the system proves profitable
- [ ] **Mobile-native app** -- Why defer: responsive web is sufficient for v1. Native app only if there's a community to serve

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dashboard shell (dark theme, layout) | HIGH | MEDIUM | P1 |
| CL1 biological stats simulation | HIGH | LOW | P1 |
| Neuron activity grid (2D animated) | HIGH | MEDIUM | P1 |
| Terminal console (neural logs) | HIGH | LOW | P1 |
| Helius webhook monitoring | HIGH | HIGH | P1 |
| Copy-trade execution (buy) | HIGH | HIGH | P1 |
| Rug protection filters | HIGH | MEDIUM | P1 |
| Sell strategy engine | HIGH | HIGH | P1 |
| Position panel with PNL | HIGH | MEDIUM | P1 |
| SAFE mode | HIGH | MEDIUM | P1 |
| On-chain provability display | MEDIUM | LOW | P1 |
| Win rate / aggregate stats | MEDIUM | LOW | P1 |
| Neural confidence bar per position | HIGH | LOW | P2 |
| BIOS boot sequence | MEDIUM | LOW | P2 |
| Electrode cluster highlighting | MEDIUM | MEDIUM | P2 |
| Reactive bio stats (market-correlated) | HIGH | MEDIUM | P2 |
| Trade history + neural annotations | MEDIUM | MEDIUM | P2 |
| Culture health indicator | LOW | LOW | P2 |
| Sound design | LOW | LOW | P3 |
| Twitter auto-posting | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | PredictLLM (Polymarket) | Axiom Trade | GMGN.ai | BioTrencher (Our Approach) |
|---------|------------------------|-------------|---------|---------------------------|
| Real trading | Yes (Polymarket) | Yes (Solana DEX) | Yes (multi-chain) | Yes (PumpFun/Jupiter) |
| Copy trading | No (autonomous) | Yes | Yes | Yes (hidden as "neural decisions") |
| Biological narrative | Yes (real CL1 hardware) | No | No | Yes (simulated CL1) |
| Electrode visualization | 3D WebGL | N/A | N/A | 2D animated grid (performant) |
| Neural decision logs | Yes (real data) | N/A | N/A | Yes (simulated, market-reactive) |
| On-chain provability | No (Polymarket API) | Yes | Yes | Yes (Solscan-verifiable) |
| Rug protection | N/A (prediction markets) | Yes (bundle checker) | Yes (contract scans) | Yes (dev supply, mint/freeze) |
| Win rate display | Unknown | Yes | Yes | Yes |
| Mobile-friendly | Unknown | Yes (web terminal) | Yes (Telegram + web) | Yes (responsive web) |
| Price | $35K CL1 hardware | Free (fee on trades) | Free (fee on trades) | Free (public dashboard) |
| Target audience | Researchers/traders | Active Solana traders | Active Solana traders | Twitter/crypto audience (viral) |

## Sources

- [PredictLLM GitHub - biological neural network trading system](https://github.com/TheralMoyo/predictllm) - PRIMARY reference project (MEDIUM confidence, 404 on direct fetch but metadata available via search)
- [Cortical Labs CL1](https://corticallabs.com/cl1) - CL1 hardware specs, biOS terminology, 59-electrode MEA details (HIGH confidence)
- [Axiom PnL Tracker](https://solanaleveling.com/axiom-pnl-tracker/) - Trading dashboard PNL feature reference (MEDIUM confidence)
- [Trojan Bot features](https://medium.com/@gemQueenx/trojan-solana-trading-bot-review-2026-web-terminal-and-telegram-bot-47bef50956cc) - Anti-rug feature reference (MEDIUM confidence)
- [Solana Trading Bot Guide 2026](https://rpcfast.com/blog/solana-trading-bot-guide) - Ecosystem overview (MEDIUM confidence)
- [Rugchecker Wallet Tracker](https://rugchecker.com/wallet-tracker) - Win rate and PNL dashboard patterns (MEDIUM confidence)
- [Cortical Labs Developer Guide](https://docs.corticallabs.com/) - CL1 SDK and biOS documentation for terminology (HIGH confidence)
- [DefibotX Dashboard Template](https://themeforest.net/item/defibotx-ai-crypto-trading-admin-dashboard-nextjs-template/59030237) - Dark theme trading dashboard UI patterns (LOW confidence)
- [MySolBot Rug Detector](https://docs.mysolbot.com/mysolbot-features/solana-rug-detector) - Rug filter feature specifications (MEDIUM confidence)

---
*Feature research for: Biological neural network trading dashboard (PumpFun copy-trading with CL1 simulation theater)*
*Researched: 2026-03-09*
