# Pitfalls Research

**Domain:** Solana PumpFun copy-trading bot with real-time CL1 simulation dashboard
**Researched:** 2026-03-09
**Confidence:** HIGH (verified across multiple sources, Solana ecosystem well-documented)

## Critical Pitfalls

### Pitfall 1: PumpFun Migrated to PumpSwap -- Not Raydium

**What goes wrong:**
The project spec says "Jupiter for post-migration" assuming tokens graduate to Raydium. As of March 2025, PumpFun launched PumpSwap, its own native DEX, and 95%+ of graduated tokens now migrate to PumpSwap instead of Raydium. Bots built to swap via Raydium post-migration will fail to execute on the vast majority of graduated tokens.

**Why it happens:**
Outdated documentation and tutorials still reference the Raydium migration path. The ecosystem shifted rapidly in early 2025.

**How to avoid:**
- Swap on the PumpFun bonding curve for pre-migration tokens (unchanged).
- For post-migration tokens, route through Jupiter aggregator -- Jupiter now indexes PumpSwap pools, so it will find the best route automatically whether the token is on PumpSwap, Raydium, or elsewhere.
- Do NOT hardcode Raydium program IDs as the post-migration DEX. Use Jupiter as the routing layer and let it handle pool discovery.

**Warning signs:**
- Swap transactions failing with "pool not found" on graduated tokens
- Jupiter quotes returning no routes for tokens you know are trading

**Phase to address:**
Phase 1 (core swap infrastructure). This must be correct from day one or no trades execute on graduated tokens.

---

### Pitfall 2: Webhook-to-Execution Latency Kills Copy-Trading Alpha

**What goes wrong:**
The copy-trade signal arrives via Helius webhook, but by the time your bot parses it, builds the transaction, simulates, signs, and submits, the price has already moved. On PumpFun memecoins, prices can double within a single Solana slot (400ms). A 2-5 second delay from signal to execution means buying at a significantly worse price than the copied wallet, erasing any alpha.

**Why it happens:**
Developers build the "happy path" (webhook fires -> parse -> buy) without optimizing the entire pipeline. Common bottlenecks: HTTP webhook delivery latency, RPC calls to fetch token metadata, transaction simulation before sending, public RPC rate limiting during congestion.

**How to avoid:**
- Pre-compute everything possible: cache token accounts, pre-derive PDAs, keep recent blockhash warm (refresh every few seconds).
- Use Jito bundles for transaction submission -- they provide MEV protection (no sandwich attacks) and faster inclusion.
- Set appropriate priority fees (0.003-0.01 SOL) to land transactions quickly.
- Use a dedicated/private RPC endpoint, not a public one. Public endpoints rate-limit and de-prioritize during congestion -- exactly when you need speed most.
- Accept that you will NOT match the copied wallet's entry price. Budget 5-15% slippage as "cost of copy-trading" and factor this into position sizing.

**Warning signs:**
- Paper trading shows consistently worse entry prices than the copied wallet
- Transactions landing 3+ slots after the copied wallet's transaction
- Transaction failures spiking during high-activity periods

**Phase to address:**
Phase 1 (transaction execution engine). Build with Jito bundles and priority fees from the start. Optimize iteratively in later phases.

---

### Pitfall 3: Malicious Dependencies and Supply Chain Attacks on PumpFun Bots

**What goes wrong:**
Your trading wallet gets drained. Not from a hack of your code, but from a malicious npm package or GitHub dependency. The Solana/PumpFun bot ecosystem is riddled with trojanized packages. In 2025: `@solana/web3.js` versions 1.95.6-1.95.7 were backdoored (stole private keys, ~$130k drained). npm packages like `solana-transaction-toolkit` and `solana-stable-web-huks` exfiltrated private keys via Gmail SMTP. Multiple GitHub repos (`pumpfun-pumpswap-sniper-copy-trading-bot`, `pumpfun-bump-script-bot`) contained hidden key exfiltration. ChatGPT recommended a contaminated PumpFun API that stole wallet keys ($2.5k loss).

**Why it happens:**
Developers building PumpFun bots often grab open-source code, install packages quickly, and handle private keys directly in application code. Attackers know this demographic handles real money and targets them specifically.

**How to avoid:**
- Pin ALL dependency versions exactly. No `^` or `~` ranges. Use lockfiles religiously.
- Audit every dependency before installation. Especially anything with "pumpfun", "solana-bot", or "sniper" in the name.
- Never use `@solana/web3.js` without verifying the version. Use only well-known, verified versions.
- Keep the trading wallet private key in an environment variable, never in code or config files.
- Use a dedicated hot wallet with ONLY the SOL needed for trading (0.5-1 SOL max). Never connect a wallet with significant holdings.
- Run `npm audit` regularly. Set up automated vulnerability scanning.

**Warning signs:**
- Unexpected outbound network requests in your application
- Dependencies with very few downloads or recent publish dates
- Any package requesting or accessing private key material outside your explicit wallet code

**Phase to address:**
Phase 0 (project setup). Lock dependencies before writing any code. Establish security practices as the foundation.

---

### Pitfall 4: Rug Detection Based Only on Dev Supply % Is Insufficient

**What goes wrong:**
Your rug filter checks whether the dev wallet holds too much supply, but the token still rugs. Why? PumpFun rugs in 2025-2026 use bundled transactions: the dev creates the token and simultaneously buys across 10-50 fake wallets. No single wallet holds a suspicious amount, but collectively they control 30-70% of supply. When the dev is ready to exit, a single bundled transaction consolidates and sells everything atomically -- impossible for your bot to react to.

**Why it happens:**
99% of PumpFun tokens are scams. Scammers have evolved past simple "dev holds 80%" rugs. Volume bots create fake trading activity. Bundled buys distribute supply across wallets that look independent.

**How to avoid:**
- Check top N holder concentration, not just the deployer wallet. If the top 10 wallets hold >40% of supply, that's a red flag even if no single wallet is suspicious.
- Check for bundled transactions at token creation. If the token's first transaction includes multiple buys from different wallets, it's likely a coordinated launch.
- Look for volume bot patterns: repeated buys/sells of identical small amounts (e.g., 0.01 SOL).
- Use services like Flintr or Birdeye for additional rug signals if budget allows.
- Accept that no filter is perfect. The 3-5 concurrent position limit and small trade sizes (0.05-0.1 SOL) are your real risk management.

**Warning signs:**
- Tokens passing your rug filter but dumping within minutes
- Token holder distribution looks "too perfect" (many wallets with similar amounts)
- High trading volume but from very few unique wallets

**Phase to address:**
Phase 2 (rug protection refinement). Start with basic dev supply check in Phase 1, but plan to iterate. The basic filter will catch obvious rugs but miss sophisticated ones.

---

### Pitfall 5: Webhook Delivery Is Not Guaranteed -- Silent Failures Kill Your Bot

**What goes wrong:**
Helius webhooks stop delivering events and your bot sits idle, missing profitable trades. Helius claims 99.99% uptime, but webhooks can still fail silently: your server might not respond in time (Helius retries, but there's a limit), network issues between Helius and your Railway deployment, duplicate events arrive and your bot double-buys, or Helius sends retries and your bot treats them as new signals.

**Why it happens:**
Webhooks are fire-and-forget HTTP requests. Unlike WebSocket connections where you can detect disconnection, a webhook that stops firing looks identical to "no activity on the monitored wallets." You don't know what you don't know.

**How to avoid:**
- Implement a heartbeat/health check: periodically verify your webhook registration is active via the Helius API.
- Track the last-received webhook timestamp. If no webhooks arrive for N minutes during market hours, alert and investigate.
- Idempotency: deduplicate incoming webhooks by transaction signature. Helius may retry delivery, sending the same event multiple times.
- Store webhook payloads before processing them. If processing fails, you can retry from your own queue.
- Consider a fallback: periodically poll the monitored wallets' recent transactions via RPC as a safety net to catch anything the webhook missed.

**Warning signs:**
- Long gaps between webhook deliveries during active trading hours
- Checking Solscan and seeing monitored wallet transactions your bot never received
- Duplicate position entries from retried webhooks

**Phase to address:**
Phase 1 (webhook infrastructure). Build with idempotency and health monitoring from day one. Add polling fallback in Phase 2.

---

### Pitfall 6: Paper Trading Mode That Doesn't Reflect Reality

**What goes wrong:**
SAFE mode shows "profitable" paper trades, but when you switch to LIVE mode the results are dramatically worse. Paper trading doesn't account for: slippage (your buy WOULD have moved the price), transaction failure rates (30-50% of Solana transactions can fail during congestion), timing (paper trade "executes instantly" but real trades take 1-5 seconds), and priority fee costs eating into profits.

**Why it happens:**
Paper trading typically records the price at the moment the signal fires and assumes instant, free execution. This creates a false sense of profitability that evaporates in live trading.

**How to avoid:**
- Simulate realistic slippage: add 3-10% to the "entry price" in paper trades.
- Simulate transaction failures: randomly reject 20-30% of paper trades to model real network conditions.
- Include fee simulation: priority fees (0.003-0.01 SOL), Jito tips, and platform fees per trade.
- Track the time delta between signal receipt and when you WOULD have submitted. Log this latency.
- Never trust paper trading PnL as predictive of live PnL. It's for testing system flow, not strategy validation.

**Warning signs:**
- Paper trading win rate above 70% (suspiciously good for memecoins)
- Paper trades showing zero slippage
- No transaction failure simulation

**Phase to address:**
Phase 2 (SAFE mode implementation). Design the paper trading engine with realistic friction from the start.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding wallet list in source code | Fast to implement | Can't update wallets without redeploying | MVP only; move to config/env by Phase 2 |
| Using public RPC endpoints | Free, no setup | Rate limited during congestion, missed trades | Paper trading / development only |
| Single-threaded webhook processing | Simpler code | If webhook handler blocks, subsequent events queue up and delay | Never in production; use async processing from start |
| Storing private key in .env file on Railway | Easy deployment | If Railway is compromised or env vars leak, wallet is drained | Acceptable for small hot wallet (0.1-0.5 SOL). Never for significant funds |
| Skipping transaction simulation before send | Faster execution | Failed transactions waste priority fees and Jito tips | Acceptable once you've validated the transaction format is stable |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Helius Webhooks | Assuming events arrive exactly once | Deduplicate by transaction signature; handle retries |
| Helius Webhooks | Not validating webhook authenticity | Verify webhook signatures to prevent spoofed signals |
| Jupiter Swap API | Using stale price quotes | Fetch quote immediately before building the swap transaction; quotes expire quickly |
| Jupiter Swap API | Not setting `dynamicComputeUnitLimit` | Without it, you overpay for compute units on every transaction |
| PumpFun Bonding Curve | Using hardcoded bonding curve constants | Fetch current bonding curve state on-chain before calculating expected output |
| PumpFun Bonding Curve | Ignoring the 1% PumpFun fee on bonding curve trades | Your expected output is 1% less than the raw math suggests |
| Solana web3.js | Letting the library auto-derive WSS endpoint from HTTP | Explicitly configure both HTTP and WSS endpoints; auto-derivation causes 404/503 errors |
| Jito Bundles | Sending bundles without sufficient tip | Minimum tip is 1000 lamports, but competitive scenarios need 10,000-100,000+ lamports |
| Railway Deployment | Not configuring health check endpoints | Railway may restart your service thinking it's unhealthy, killing active positions |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching token metadata on every webhook | Increasing response time as more signals arrive | Cache token metadata (mint, decimals, associated token accounts) | >5 concurrent signals per second |
| Polling RPC for position price updates | High RPC usage, rate limiting, stale prices | Use WebSocket subscriptions for account changes on held positions | >3 concurrent positions with 1s polling |
| Synchronous transaction submission | Bot blocks while waiting for confirmation, misses next signal | Fire-and-forget with async confirmation tracking | Any time two signals arrive within 2 seconds |
| Re-deriving PDAs on every trade | Adds 10-50ms per trade | Pre-compute and cache all PDA derivations at startup | Matters when latency budget is <200ms |
| Dashboard re-rendering entire state on each update | Browser tab becomes sluggish, high CPU | Use granular state updates; only re-render changed components | >10 updates per second to dashboard |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Private key in source code or git history | Wallet drained instantly if repo is public or compromised | Environment variable only; add private key patterns to .gitignore; use git-secrets |
| Using unaudited PumpFun/Solana npm packages | Supply chain attack drains wallet (confirmed real attacks in 2025) | Pin versions, audit packages, use only well-known libraries |
| No spending limits on trading wallet | Bug or exploit drains entire wallet balance | Fund hot wallet with only 1-2x the max position size needed; refill manually |
| Exposing webhook endpoint without authentication | Attacker sends fake webhook payloads triggering unauthorized trades | Validate Helius webhook signatures; rate-limit the endpoint |
| Dashboard exposes wallet address or trade logic | Competitors can front-run or copy your strategy | Display only public transaction hashes; never expose the copied wallet addresses |
| Logging private key or seed phrase | Logs get shipped to monitoring service, leaked | Sanitize all log output; never log key material even in debug mode |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| CL1 stats update faster than trades | Dashboard feels fake -- neural activity with no trading action | Tie neural activity cadence to real market data feed; ramp up activity when trades are evaluated |
| Showing raw SOL PnL without context | Small numbers (0.002 SOL profit) look unimpressive | Show percentage returns and cumulative stats alongside absolute values |
| Terminal console scrolling too fast | Users can't read what's happening | Batch terminal updates; allow pause/scroll; highlight key events (trades, rug detections) |
| Dashboard goes blank during webhook gaps | Looks broken, undermines "always-on AI" narrative | Keep CL1 simulation running independently of trade signals; show "scanning" / "analyzing" states |
| No visual distinction between SAFE and LIVE mode | Viewers can't tell if trades are real | Prominent mode indicator; different color schemes for SAFE vs LIVE |

## "Looks Done But Isn't" Checklist

- [ ] **Copy-trade execution:** Often missing slippage protection -- verify max slippage is set on every swap
- [ ] **Webhook handling:** Often missing idempotency -- verify duplicate webhook payloads don't trigger duplicate buys
- [ ] **Sell execution:** Often missing the "wallet already sold" edge case -- verify you handle partial fills and already-closed positions
- [ ] **Position tracking:** Often missing position state after server restart -- verify positions persist to disk/DB and recover on startup
- [ ] **Rug filter:** Often missing bundled transaction detection -- verify you check holder distribution, not just deployer wallet
- [ ] **Paper trading:** Often missing realistic slippage/failure simulation -- verify paper PnL includes friction costs
- [ ] **Dashboard:** Often missing offline/reconnection state -- verify dashboard recovers gracefully when WebSocket drops
- [ ] **Transaction confirmation:** Often missing timeout handling -- verify stuck transactions are cancelled and retried with higher priority fee
- [ ] **CL1 simulation:** Often missing variance in stats -- verify neural metrics aren't perfectly periodic (looks robotic, not biological)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wallet drained by malicious dependency | HIGH | Create new wallet, audit all dependencies, rotate all secrets, redeploy |
| Missed trades due to webhook failure | LOW | Implement polling fallback; review missed signals in historical data |
| Wrong DEX integration (Raydium instead of PumpSwap) | MEDIUM | Switch to Jupiter routing (handles all DEXs); update swap logic; retest |
| Paper trading giving false confidence | MEDIUM | Add slippage/failure simulation; re-evaluate strategy with realistic friction |
| Rug filter bypassed by bundled supply distribution | LOW | Add holder concentration check; accept some losses as cost of operating in this market |
| Position state lost on server restart | MEDIUM | Implement persistent position storage; add startup recovery logic to reconcile on-chain state |
| Dashboard looks fake/mechanical | LOW | Add stochastic noise to CL1 simulation parameters; tie to real market data variance |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Supply chain attacks (malicious deps) | Phase 0 (project setup) | Lockfile exists; all versions pinned; no suspicious packages |
| Wrong post-migration DEX (Raydium vs PumpSwap) | Phase 1 (swap engine) | Successfully execute swaps on graduated PumpSwap tokens via Jupiter |
| Webhook delivery failures | Phase 1 (webhook infrastructure) | Health monitoring active; idempotency key on all webhook handlers |
| Execution latency too slow | Phase 1 (transaction engine) | Measure signal-to-execution latency; target <2s median |
| Basic rug filter insufficient | Phase 1 (initial), Phase 2 (refined) | Track rug rate on passed tokens; iterate filter based on data |
| Paper trading unrealistic | Phase 2 (SAFE mode) | Paper PnL includes simulated slippage, fees, and failures |
| Webhook silent failures | Phase 2 (reliability) | Fallback polling active; monitoring for gaps in webhook delivery |
| Dashboard looks mechanical/fake | Phase 3 (CL1 polish) | CL1 stats show natural variance; activity correlates with market conditions |
| Position state lost on restart | Phase 1 (position management) | Positions survive process restart; reconcile with on-chain state |
| Dashboard performance degradation | Phase 3 (dashboard optimization) | Dashboard stays responsive with 5 concurrent positions and 10+ updates/sec |

## Sources

- [Solana Trading Bots Guide 2026 - RPC Fast](https://rpcfast.com/blog/solana-trading-bot-guide)
- [Engineering Solana Trading Bots: 2026 Infrastructure Guide - Dysnix](https://dysnix.com/blog/solana-trading-bot-guide)
- [Why Your Solana Trading Bot Is Probably Too Slow - Yavorovych](https://yavorovych.medium.com/why-your-solana-trading-bot-is-probably-too-slow-and-how-i-fix-it-07fc6feb1759)
- [Low-Latency Copy-Trading Bot Case Study - RPC Fast](https://rpcfast.com/blog/copy-trading-bot-case-study)
- [9 Critical Copy-Trading Mistakes - OdinBot](https://docs.odinbot.io/tracking-academy/trading-strategies/the-9-critical-copy-trading-mistakes-to-avoid-vic)
- [Pump.fun Launches PumpSwap, Ending Raydium Migrations - CryptoBriefing](https://cryptobriefing.com/launch-pumpswap-dex-pump-fun/)
- [Analyzing Slippage: PumpFun Trading Dynamics - Bitquery](https://bitquery.io/blog/analyzing-slippage-pumpfun-trading-dynamics)
- [Anatomy of a Rug Pull on Pump.fun - Flintr](https://www.flintr.io/articles/anatomy-of-a-rug-pull-identify-scams-on-pumpfun)
- [98% of Tokens on Pump.fun Are Scams - CryptoPotato](https://cryptopotato.com/98-of-tokens-on-pump-fun-are-rug-pulls-or-fraud-report/)
- [Malicious Solana Trading Bot Analysis - SlowMist](https://slowmist.medium.com/threat-intelligence-an-analysis-of-a-malicious-solana-open-source-trading-bot-ab580fd3cc89)
- [Malicious npm Packages Stealing Solana Keys - HackerNews](https://thehackernews.com/2025/01/hackers-deploy-malicious-npm-packages.html)
- [Solana SDK Backdoor - CSO Online](https://www.csoonline.com/article/3617893/solana-sdk-backdoored-for-stealing-secrets-private-keys.html)
- [AI Poisoning Attack on Solana Wallet - CryptoRank](https://cryptorank.io/news/feed/b57d8-solana-wallet-exploit-ai-poisoning-attack)
- [Transaction Latency on Solana: Priority Fees and Jito Tips - Chorus One](https://chorus.one/reports-research/transaction-latency-on-solana-do-swqos-priority-fees-and-jito-tips-make-your-transactions-land-faster)
- [Jito Low Latency Transaction Send - Jito Docs](https://docs.jito.wtf/lowlatencytxnsend/)
- [Helius Webhooks Documentation](https://www.helius.dev/docs/webhooks)
- [Helius Enhanced WebSockets](https://www.helius.dev/blog/introducing-next-generation-enhanced-websockets)
- [Solana WebSocket Guide - Helius Docs](https://www.helius.dev/docs/rpc/websocket)
- [Common Solana Web3.js Errors - Chainstack](https://support.chainstack.com/hc/en-us/articles/28313590006553-Common-errors-with-Solana-Web3JS)
- [PumpFun to PumpSwap Migration Tracking - Bitquery](https://docs.bitquery.io/docs/blockchain/Solana/Pumpfun/pump-fun-to-pump-swap/)

---
*Pitfalls research for: Solana PumpFun copy-trading bot with CL1 simulation dashboard*
*Researched: 2026-03-09*
