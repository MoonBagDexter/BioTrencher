# Requirements: BioTrencher

**Defined:** 2026-03-09
**Core Value:** Real, provable on-chain profitable trades that look like they're being made by a biological neural network

## v1 Requirements

### Trading Engine

- [x] **TRADE-01**: System monitors static list of wallet addresses via Helius webhooks for new buy transactions
- [x] **TRADE-02**: When tracked wallet buys a PumpFun coin, system instantly evaluates rug filters before acting
- [x] **TRADE-03**: System rejects coins where dev/top wallet holds excessive supply concentration
- [x] **TRADE-04**: System executes buy via PumpFun bonding curve for pre-migration coins
- [x] **TRADE-05**: System executes buy via PumpSwap/Jupiter for post-migration coins
- [x] **TRADE-06**: System sells when tracked wallet sells the same coin
- [x] **TRADE-07**: System auto-sells at configurable take-profit percentage
- [x] **TRADE-08**: System auto-sells at configurable stop-loss percentage
- [x] **TRADE-09**: System auto-sells after configurable time limit with no other exit trigger
- [x] **TRADE-10**: System tracks up to 3-5 concurrent positions with entry price and real-time PNL

### Modes

- [x] **MODE-01**: SAFE mode runs full pipeline with paper trades (mock execution, real webhook signals, zero SOL)
- [ ] **MODE-02**: LIVE mode executes real trades with 0.05-0.1 SOL per trade
- [x] **MODE-03**: Dashboard looks identical in both SAFE and LIVE modes
- [ ] **MODE-04**: Wallet address displayed with Solscan verification link in LIVE mode

### Dashboard

- [x] **DASH-01**: Top status bar showing neurons, electrodes, BIOS version, coherence, entropy, firing rate, win rate, active positions, latency
- [x] **DASH-02**: 2D animated neuron activity grid with color-coded electrode firing patterns
- [x] **DASH-03**: Positions panel showing active coins with entry price, current price, unrealized PNL %, token name
- [x] **DASH-04**: Terminal console with scrolling log of neural decisions and trade executions
- [x] **DASH-05**: Dark sci-fi theme with neon accents matching CL1/biological computing aesthetic
- [x] **DASH-06**: Real-time updates via WebSocket connection

### CL1 Simulation

- [x] **CL1-01**: Biological stats react to real market data (entropy=volatility, firing rate=volume, coherence=profitability)
- [x] **CL1-02**: Neural confidence bar (0-100%) per open position derived from price momentum + volume + time held
- [x] **CL1-03**: Terminal logs show neural decision language ("coherence spike... pattern match... confidence 0.847... EXECUTING BUY")
- [x] **CL1-04**: BIOS boot sequence animation (3-5 seconds) on first page load simulating CL1 hardware initialization

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
| TRADE-01 | Phase 1 | Complete |
| TRADE-02 | Phase 1 | Complete |
| TRADE-03 | Phase 1 | Complete |
| TRADE-04 | Phase 1 | Complete |
| TRADE-05 | Phase 1 | Complete |
| TRADE-06 | Phase 1 | Complete |
| TRADE-07 | Phase 1 | Complete |
| TRADE-08 | Phase 1 | Complete |
| TRADE-09 | Phase 1 | Complete |
| TRADE-10 | Phase 1 | Complete |
| MODE-01 | Phase 1 | Complete |
| MODE-02 | Phase 3 | Pending |
| MODE-03 | Phase 2 | Complete |
| MODE-04 | Phase 3 | Pending |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 2 | Complete |
| DASH-04 | Phase 2 | Complete |
| DASH-05 | Phase 2 | Complete |
| DASH-06 | Phase 2 | Complete |
| CL1-01 | Phase 2 | Complete |
| CL1-02 | Phase 2 | Complete |
| CL1-03 | Phase 2 | Complete |
| CL1-04 | Phase 2 | Complete |
| DEPL-01 | Phase 3 | Pending |
| DEPL-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after Phase 1 completion*
