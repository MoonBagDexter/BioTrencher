# BioTrencher

## What This Is

BioTrencher is a public-facing trading dashboard that presents itself as a biological neural network (Cortical Labs CL1) autonomously trading PumpFun memecoins on Solana. In reality, the trading alpha comes from copy-trading a curated list of profitable bot wallets, while the CL1 biological computing stats are simulated theater. The project is designed for viral social proof — real on-chain trades anyone can verify, wrapped in a "biological AI" narrative.

## Core Value

Real, provable on-chain profitable trades that look like they're being made by a biological neural network — maximum shock value with maximum verifiability.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Wallet monitoring via Helius webhooks (static list of profitable bot wallets)
- [ ] Copy-trade execution on PumpFun (pre-migration) and Jupiter (post-migration)
- [ ] Rug protection filters (dev supply % concentration check)
- [ ] Hybrid sell strategy (copy wallet sells + take profit % + stop loss % + time-based exit)
- [ ] SAFE mode (paper trading with fully live-looking dashboard, zero SOL spent)
- [ ] LIVE mode (real trades, 0.05-0.1 SOL per trade, 3-5 max concurrent positions)
- [ ] CL1 full theater simulation (reactive stats tied to market data + fake BIOS console log)
- [ ] Dashboard: top status bar (neurons, electrodes, BIOS version, coherence, entropy, firing rate, win rate, etc.)
- [ ] Dashboard: neuron activity grid (animated visual showing simulated brain activity)
- [ ] Dashboard: positions panel (active coins with entry price, current PNL, CL1 confidence bar)
- [ ] Dashboard: terminal console (scrolling log of neural decisions and trade executions)
- [ ] Public dashboard deployed on Railway
- [ ] On-chain provability (real wallet with verifiable transactions on Solscan)

### Out of Scope

- Actual CL1 hardware integration — we're simulating, not using real biological compute
- Multi-chain support — Solana/PumpFun only
- User accounts or multi-user dashboard — single agent, public view
- Telegram/Discord bot notifications — dashboard only
- Advanced portfolio management — simple fixed-size trades

## Context

- **Cortical Labs CL1 references:** The project references CL1 LLM Encoder (github.com/4R7I5T/CL1_LLM_Encoder), Cortical Labs docs (docs.corticallabs.com), CL SDK (github.com/Cortical-Labs/cl-sdk), and CL API docs (github.com/Cortical-Labs/cl-api-doc). These inform the terminology, stats, and UI language used in the simulation — we won't integrate with actual CL1 hardware.
- **PumpFun ecosystem:** Coins on PumpFun have mint/freeze authority revoked by default, so the main rug vector is dev supply concentration. Pre-migration coins trade on PumpFun's bonding curve; post-migration coins trade on Raydium via Jupiter.
- **Wallet list:** User provides a static list of known profitable bot wallet addresses. These are the signal source but are never exposed in the UI.
- **Goal is viral content:** The dashboard needs to look incredible in a screenshot/screen recording for Twitter. Every pixel should reinforce the "biological AI trading agent" narrative.
- **Selective trading:** Not every signal is taken. The agent is conservative (3-5 positions, rug filters) to show the tech "works" without getting rinsed.

## Constraints

- **Hosting:** Railway for deployment
- **Trade size:** 0.05-0.1 SOL per trade in LIVE mode
- **Max positions:** 3-5 concurrent
- **Wallet monitoring:** Helius webhooks for real-time transaction detection
- **Swap routing:** PumpFun bonding curve for pre-migration, Jupiter aggregator for post-migration
- **Buy speed:** Instant execution after signal passes filters
- **Rug filter:** Reject coins where dev/top wallet holds excessive supply

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Simulate CL1 rather than integrate real hardware | Project is for shock value / viral tweet, not real biological compute research | — Pending |
| Static wallet list over dynamic discovery | User already has curated list of profitable bots, no need for discovery | — Pending |
| Paper trading SAFE mode before LIVE | Test full system risk-free, dashboard looks real either way | — Pending |
| Helius webhooks over RPC polling | Real-time detection needed for instant copy-trading | — Pending |
| PumpFun + Jupiter hybrid swap | Covers both pre and post-migration coins | — Pending |
| Fixed trade size over % portfolio | Simpler, predictable risk per trade | — Pending |
| Railway hosting | User preference | — Pending |

---
*Last updated: 2026-03-09 after initialization*
