# Requirements: BioTrencher

**Defined:** 2026-03-09
**Core Value:** Real, provable on-chain profitable trades that look like they're being made by a biological neural network

## v1 Requirements

### Trading Engine

- [ ] **TRADE-01**: System monitors static list of wallet addresses via Helius webhooks for new buy transactions
- [ ] **TRADE-02**: When tracked wallet buys a PumpFun coin, system instantly evaluates rug filters before acting
- [ ] **TRADE-03**: System rejects coins where dev/top wallet holds excessive supply concentration
- [ ] **TRADE-04**: System executes buy via PumpFun bonding curve for pre-migration coins
- [ ] **TRADE-05**: System executes buy via PumpSwap/Jupiter for post-migration coins
- [ ] **TRADE-06**: System sells when tracked wallet sells the same coin
- [ ] **TRADE-07**: System auto-sells at configurable take-profit percentage
- [ ] **TRADE-08**: System auto-sells at configurable stop-loss percentage
- [ ] **TRADE-09**: System auto-sells after configurable time limit with no other exit trigger
- [ ] **TRADE-10**: System tracks up to 3-5 concurrent positions with entry price and real-time PNL

### Modes

- [ ] **MODE-01**: SAFE mode runs full pipeline with paper trades (mock execution, real webhook signals, zero SOL)
- [ ] **MODE-02**: LIVE mode executes real trades with 0.05-0.1 SOL per trade
- [ ] **MODE-03**: Dashboard looks identical in both SAFE and LIVE modes
- [ ] **MODE-04**: Wallet address displayed with Solscan verification link in LIVE mode

### Dashboard

- [ ] **DASH-01**: Top status bar showing neurons, electrodes, BIOS version, coherence, entropy, firing rate, win rate, active positions, latency
- [ ] **DASH-02**: 2D animated neuron activity grid with color-coded electrode firing patterns
- [ ] **DASH-03**: Positions panel showing active coins with entry price, current price, unrealized PNL %, token name
- [ ] **DASH-04**: Terminal console with scrolling log of neural decisions and trade executions
- [ ] **DASH-05**: Dark sci-fi theme with neon accents matching CL1/biological computing aesthetic
- [ ] **DASH-06**: Real-time updates via WebSocket connection

### CL1 Simulation

- [ ] **CL1-01**: Biological stats react to real market data (entropy=volatility, firing rate=volume, coherence=profitability)
- [ ] **CL1-02**: Neural confidence bar (0-100%) per open position derived from price momentum + volume + time held
- [ ] **CL1-03**: Terminal logs show neural decision language ("coherence spike... pattern match... confidence 0.847... EXECUTING BUY")
- [ ] **CL1-04**: BIOS boot sequence animation (3-5 seconds) on first page load simulating CL1 hardware initialization

### Deployment

- [ ] **DEPL-01**: Single deployable service on Railway (backend + static frontend)
- [ ] **DEPL-02**: Public URL accessible to anyone for verification

## v2 Requirements

### Polish

- **POLISH-01**: Electrode cluster highlighting on trade events (specific clusters light up when signals fire)
- **POLISH-02**: Culture health indicator (neuron count + culture age with 28-day cycle)
- **POLISH-03**: Sound design (ambient electrode pings, low hum for screen recordings)
- **POLISH-04**: Trade history with neural annotations (past trades showing which clusters fired)

### Growth

- **GROWTH-01**: Twitter/X auto-posting of trades
- **GROWTH-02**: Multiple wallet monitoring strategies (expand beyond initial curated list)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real CL1 hardware integration | $35K per unit, project is simulation theater, not neuroscience |
| 3D electrode visualization | Massive complexity (Three.js/WebGL), 2D grid is more performant and still compelling |
| User accounts / multi-user | Single-agent public dashboard, not a SaaS |
| Telegram/Discord notifications | Dashboard is the product, not bot channels |
| Dynamic wallet discovery | Curated list is the alpha, auto-discovery introduces bad signals |
| TradingView charts | Dilutes biological narrative, this isn't a trading terminal |
| Portfolio rebalancing | Over-engineering for 0.05-0.1 SOL fixed trades |
| Historical backtesting | Meaningless for copy-trading, on-chain history is the backtest |
| Mobile native app | Responsive web sufficient for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TRADE-01 | TBD | Pending |
| TRADE-02 | TBD | Pending |
| TRADE-03 | TBD | Pending |
| TRADE-04 | TBD | Pending |
| TRADE-05 | TBD | Pending |
| TRADE-06 | TBD | Pending |
| TRADE-07 | TBD | Pending |
| TRADE-08 | TBD | Pending |
| TRADE-09 | TBD | Pending |
| TRADE-10 | TBD | Pending |
| MODE-01 | TBD | Pending |
| MODE-02 | TBD | Pending |
| MODE-03 | TBD | Pending |
| MODE-04 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| DASH-04 | TBD | Pending |
| DASH-05 | TBD | Pending |
| DASH-06 | TBD | Pending |
| CL1-01 | TBD | Pending |
| CL1-02 | TBD | Pending |
| CL1-03 | TBD | Pending |
| CL1-04 | TBD | Pending |
| DEPL-01 | TBD | Pending |
| DEPL-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after initial definition*
