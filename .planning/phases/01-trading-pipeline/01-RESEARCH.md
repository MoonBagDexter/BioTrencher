# Phase 1: Trading Pipeline (SAFE Mode) - Research

**Researched:** 2026-03-09
**Domain:** Solana copy-trading pipeline -- webhook monitoring, rug filtering, mock execution, position management, automated exits
**Confidence:** HIGH

## Summary

Phase 1 builds the complete copy-trading pipeline in paper-trading mode. Real Helius webhook signals from tracked wallets flow through rug filters into mock executions with full position tracking and automated exits. Zero SOL is spent -- everything is simulated except signal detection and price feeds.

The standard approach is: (1) Helius raw webhooks for lowest-latency wallet monitoring, (2) manual instruction discriminator matching to identify PumpFun buy/sell operations, (3) `getTokenLargestAccounts` RPC call for rug filtering, (4) strategy pattern to swap between SAFE/LIVE execution, (5) in-memory position state with atomic JSON file persistence, (6) Jupiter Price API v3 for real-time PNL, and (7) typed EventEmitter bus to decouple all components.

**Primary recommendation:** Use raw webhooks (not enhanced) for wallet monitoring -- lower latency, and you need to decode instruction data anyway to extract mint addresses. Build the SAFE executor as the first and only executor in this phase. Wire everything through the event bus from day one.

## Standard Stack

### Core (Phase 1 Specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| helius-sdk | 2.0.5 | Webhook CRUD (create/update/delete) | Official SDK; used only for webhook management, not for receiving data |
| express | ^5.0 | HTTP server for webhook receiver | Receives Helius POST webhooks; serves health check endpoint |
| tiny-typed-emitter | ^2.1 | Typed EventEmitter bus | Zero overhead -- re-exports Node EventEmitter with TypeScript types. 400K weekly downloads. |
| write-file-atomic | ^6.0 | Atomic JSON persistence | Prevents corrupted state files on crash. Queues concurrent writes automatically. |
| pino | ^9.0 | Structured logging | Fast JSON logger. Essential for debugging event chains and trade decisions. |
| node-cron | ^3.0 | Scheduled tasks | Price polling intervals, position health checks, webhook health monitoring |
| dotenv | ^16.0 | Environment config | API keys, wallet list file path, trade parameters |

### Solana Interaction (Read-Only in Phase 1)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @solana/web3.js | 1.98.x (pin exact) | RPC calls for rug filter + price data | `getTokenLargestAccounts`, `getTokenSupply`, account reads |
| @solana/spl-token | latest | Token account helpers | ATA derivation, token balance parsing |
| bs58 | ^6.0 | Base58 encoding | Decode instruction data from raw webhook payloads |

### Not Needed in Phase 1

| Library | Why Deferred |
|---------|-------------|
| @pump-fun/pump-sdk | No real trades in SAFE mode; mock executor returns simulated results |
| @pump-fun/pump-swap-sdk | Same -- deferred to Phase 3 (LIVE mode) |
| @jup-ag/api | Swap execution deferred; only Price API v3 needed (direct HTTP fetch, no SDK) |
| @coral-xyz/anchor | Not needed for decoding -- use raw discriminator matching instead |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tiny-typed-emitter | typed-emitter (types only) | typed-emitter is zero-code (types only on top of Node EventEmitter). Either works; tiny-typed-emitter has slightly nicer API. |
| write-file-atomic | steno (lowdb) | steno is faster for repeated writes but write-file-atomic is simpler drop-in for fs.writeFile |
| Raw webhooks | Enhanced webhooks | Enhanced provides parsed swap data but higher latency and may not parse PumpFun correctly (UNKNOWN type risk). Raw gives full control. |
| Jupiter Price API v3 | Birdeye API / DexScreener | Jupiter is free with API key, no additional service dependency. Birdeye requires paid plan for reliable access. |
| JSON file persistence | better-sqlite3 | For 5 concurrent positions, SQLite is overkill. JSON file with atomic writes is sufficient and zero-config. |

**Installation:**
```bash
# Phase 1 dependencies
npm install express helius-sdk tiny-typed-emitter write-file-atomic pino dotenv node-cron
npm install @solana/web3.js @solana/spl-token bs58

# Dev dependencies
npm install -D typescript @types/node @types/express tsx
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 Only)
```
src/
  server/
    index.ts              # Express app bootstrap, webhook endpoint
    config.ts             # Load .env, wallet list, trade params
  core/
    events.ts             # Typed EventEmitter (central bus)
    types.ts              # Signal, Position, TradeResult, ExitReason types
  pipeline/
    signal-detector.ts    # Decode raw webhook -> identify buy/sell + mint
    rug-filter.ts         # getTokenLargestAccounts -> pass/reject
    trade-executor.ts     # Strategy interface + SafeExecutor
    position-manager.ts   # Track positions, check exits, persist state
    price-monitor.ts      # Poll Jupiter Price API v3, update positions
  utils/
    persistence.ts        # Atomic JSON read/write helpers
    logger.ts             # Pino logger setup
data/
  wallets.json            # Tracked wallet addresses (config file)
  positions.json          # Persisted position state
  history.json            # Closed trade history
.env                      # HELIUS_API_KEY, RPC_URL, etc.
```

### Pattern 1: Raw Webhook -> Discriminator Matching

**What:** Receive raw Helius webhook POST, decode base58 instruction data, match PumpFun discriminators to identify buy/sell, extract mint address from account keys.

**When to use:** Always for copy-trade signal detection. Enhanced webhooks may classify PumpFun swaps as UNKNOWN.

**Example:**
```typescript
// PumpFun program ID
const PUMP_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

// Anchor discriminators (first 8 bytes of SHA-256("global:<instruction>"))
const BUY_DISCRIMINATOR  = Buffer.from('66063d1201daebea', 'hex');
const SELL_DISCRIMINATOR = Buffer.from('33e685a4017f83ad', 'hex');

// Account indices in PumpFun buy/sell instructions
const ACCOUNT_INDICES = {
  MINT: 2,        // Token mint address
  USER: 6,        // The wallet performing the action
  BONDING_CURVE: 3, // Bonding curve PDA
};

function decodeWebhookPayload(rawTx: RawTransaction): Signal | null {
  for (const ix of rawTx.transaction.message.instructions) {
    const programId = rawTx.transaction.message.accountKeys[ix.programIdIndex];
    if (programId !== PUMP_PROGRAM) continue;

    const data = bs58.decode(ix.data);
    const discriminator = data.slice(0, 8);

    let type: 'BUY' | 'SELL' | null = null;
    if (BUY_DISCRIMINATOR.equals(discriminator)) type = 'BUY';
    else if (SELL_DISCRIMINATOR.equals(discriminator)) type = 'SELL';
    if (!type) continue;

    const mint = rawTx.transaction.message.accountKeys[ix.accounts[ACCOUNT_INDICES.MINT]];
    const user = rawTx.transaction.message.accountKeys[ix.accounts[ACCOUNT_INDICES.USER]];

    return { type, mint, user, signature: rawTx.signature, timestamp: Date.now() };
  }
  return null;
}
```
**Source:** [Chainstack PumpFun Bot](https://docs.chainstack.com/docs/solana-creating-a-pumpfun-bot), [QuickNode Copy Trade Guide](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade), [PumpFun discriminators via Dune/Qiita](https://qiita.com/shooter/items/202be328c5315d3f9825)

### Pattern 2: Rug Filter via getTokenLargestAccounts

**What:** Call Solana RPC `getTokenLargestAccounts` to get top 20 holders, then `getTokenSupply` for total supply. Calculate each holder's percentage. Reject if any single wallet holds >5% of supply.

**When to use:** On every validated buy signal, before mock execution.

**Example:**
```typescript
// Source: Solana RPC docs + Chainstack guide
async function checkRugFilter(
  connection: Connection,
  mint: PublicKey
): Promise<{ passed: boolean; reason?: string }> {
  const [largestAccounts, supplyResp] = await Promise.all([
    connection.getTokenLargestAccounts(mint, 'finalized'),
    connection.getTokenSupply(mint, 'finalized'),
  ]);

  const totalSupply = Number(supplyResp.value.uiAmount);
  if (totalSupply === 0) return { passed: false, reason: 'Zero supply' };

  for (const account of largestAccounts.value) {
    const holderPct = (Number(account.uiAmount) / totalSupply) * 100;
    if (holderPct > 5) {
      return {
        passed: false,
        reason: `Wallet holds ${holderPct.toFixed(1)}% of supply (limit: 5%)`,
      };
    }
  }

  return { passed: true };
}
```
**Note:** This checks top 20 holders. The decision says "dev wallet" and "single wallet cap" both at 5%. Since `getTokenLargestAccounts` returns the top 20, we check ALL of them against the 5% threshold -- this covers both dev and non-dev wallets in a single pass.

### Pattern 3: SAFE/LIVE Mode via Strategy Pattern

**What:** TradeExecutor accepts an ExecutionStrategy interface. SafeExecutor returns mock results with simulated prices. LiveExecutor (Phase 3) sends real transactions. Both emit identical events.

**When to use:** From Phase 1 onward. Only SafeExecutor is implemented in Phase 1.

**Example:**
```typescript
interface ExecutionStrategy {
  executeBuy(signal: ValidatedSignal): Promise<TradeResult>;
  executeSell(position: Position, reason: ExitReason): Promise<TradeResult>;
}

class SafeExecutor implements ExecutionStrategy {
  async executeBuy(signal: ValidatedSignal): Promise<TradeResult> {
    // Use current price from price monitor to simulate realistic entry
    const currentPrice = await this.priceMonitor.getPrice(signal.mint);
    const tokensReceived = (0.1 / currentPrice); // 0.1 SOL at current price

    return {
      signature: `SAFE_${Date.now()}_${randomHex(8)}`,
      mint: signal.mint,
      solAmount: 0.1,
      tokensReceived,
      entryPrice: currentPrice,
      mode: 'SAFE',
      timestamp: Date.now(),
    };
  }

  async executeSell(position: Position, reason: ExitReason): Promise<TradeResult> {
    const currentPrice = await this.priceMonitor.getPrice(position.mint);
    const solReceived = position.tokensHeld * currentPrice;

    return {
      signature: `SAFE_SELL_${Date.now()}_${randomHex(8)}`,
      mint: position.mint,
      solAmount: solReceived,
      tokensReceived: 0,
      exitPrice: currentPrice,
      mode: 'SAFE',
      reason,
      timestamp: Date.now(),
    };
  }
}
```

### Pattern 4: Randomized Exit Parameters (CL1 Biological Variation)

**What:** Each position gets randomized TP/SL/time-limit values from configured ranges. This creates variation in exit behavior that looks biological rather than algorithmic.

**When to use:** On every new position creation.

**Recommended ranges (Claude's Discretion):**
```typescript
interface ExitParams {
  takeProfitPct: number;   // 100% to 200% (2x to 3x)
  stopLossPct: number;     // -30% to -50%
  timeLimitMs: number;     // 15 min to 45 min
}

function generateExitParams(): ExitParams {
  return {
    takeProfitPct: randomBetween(100, 200),  // 2x to 3x target
    stopLossPct: -randomBetween(30, 50),     // -30% to -50%
    timeLimitMs: randomBetween(15, 45) * 60 * 1000, // 15-45 minutes
  };
}
```
**Rationale:** TP of 100-200% means selling at 2x-3x entry. SL of -30% to -50% gives enough room for volatile PumpFun coins without catastrophic loss. Time limit of 15-45 min prevents holding through pump-and-dump cycles while allowing legitimate momentum plays.

### Pattern 5: Copy-Sell Priority Logic (Claude's Discretion)

**What:** When a tracked wallet sells, that takes priority over automated exits. However, automated exits (TP/SL/time) should still fire independently. Copy-sell is just another exit trigger, not a cancellation of automated exits.

**Recommended priority order:**
1. **Stop-loss** -- immediate, protects capital (highest priority)
2. **Copy-sell** -- tracked wallet has information we don't
3. **Take-profit** -- lock in gains
4. **Time limit** -- catch-all fallback

**Implementation:** Position manager checks exit conditions in priority order every price update cycle. First matching condition triggers the exit. Once a position is closed, no further exit checks run.

### Anti-Patterns to Avoid

- **Polling RPC for wallet activity instead of webhooks:** Burns credits, higher latency, misses transactions during gaps.
- **Using enhanced webhooks for PumpFun:** May parse as UNKNOWN type. Raw gives full control at lower latency.
- **Blocking webhook handler during rug filter check:** Respond 200 immediately, process async. Helius retries if you're slow.
- **Re-deriving PDAs on every signal:** Cache bonding curve PDAs for known mints.
- **Storing positions only in memory:** Process crash loses all state. Use atomic JSON write on every position change.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Typed event bus | Custom typed wrapper around EventEmitter | tiny-typed-emitter | Already handles all edge cases, zero overhead |
| Atomic file writes | Manual temp-file + rename | write-file-atomic | Handles race conditions, OS differences, queuing |
| Token price fetching | Direct pool reserve calculations | Jupiter Price API v3 | Jupiter aggregates across all DEXs, handles edge cases |
| Webhook CRUD | Direct Helius REST API calls | helius-sdk | SDK handles auth, types, error handling |
| Base58 decode | Manual implementation | bs58 | Standard Solana ecosystem library |
| Structured logging | console.log with JSON.stringify | pino | 5x faster than winston, built-in JSON serialization |

**Key insight:** Phase 1 has zero on-chain write operations. Every Solana interaction is read-only (RPC queries for rug filter, price data). This dramatically simplifies the implementation -- no transaction building, no signing, no confirmation polling, no priority fees.

## Common Pitfalls

### Pitfall 1: Webhook Handler Blocking

**What goes wrong:** Rug filter makes 2 RPC calls (getTokenLargestAccounts + getTokenSupply). If the webhook handler waits for these before responding, Helius times out and retries, causing duplicate signals.
**Why it happens:** Natural tendency to process synchronously in the request handler.
**How to avoid:** Respond 200 immediately in the Express handler, then emit the signal to the event bus for async processing. Deduplicate incoming webhooks by transaction signature.
**Warning signs:** Duplicate position entries, Helius dashboard showing webhook delivery failures.

### Pitfall 2: No Idempotency on Webhook Processing

**What goes wrong:** Helius retries webhook delivery on timeout/error. Bot processes the same buy signal twice, opening duplicate positions.
**Why it happens:** Not deduplicating by transaction signature.
**How to avoid:** Maintain a Set of recently-processed transaction signatures (last 1000). Skip any webhook with a signature already in the set.

### Pitfall 3: First-Buy-Only Rule Not Enforced

**What goes wrong:** Tracked wallet buys more of a coin the bot already holds (or already exited). Bot opens a second position on the same mint.
**Why it happens:** Only checking active positions, not trade history.
**How to avoid:** Maintain a Set of all mints ever traded (active + closed). Reject any buy signal for a mint already in the set.

### Pitfall 4: Price Monitor Polling Too Aggressively

**What goes wrong:** Jupiter Price API v3 rate limits the bot (HTTP 429), causing stale PNL and missed exit triggers.
**Why it happens:** Polling every 1 second for 5 positions = 5 requests/second. Rate limits kick in.
**How to avoid:** Batch price requests -- Jupiter supports up to 50 mint IDs in a single request. Poll once every 5-10 seconds with all active mints in one call. Implement exponential backoff on 429 responses.

### Pitfall 5: Exit Conditions Checked Only on Price Update

**What goes wrong:** Time-based exit never triggers during quiet periods when no price updates arrive.
**Why it happens:** Exit condition checking is coupled to price polling.
**How to avoid:** Run a separate interval timer (every 30 seconds) that checks time-based exits independently of price updates. Copy-sell triggers are event-driven (webhook), not poll-driven.

### Pitfall 6: Position State Lost on Restart

**What goes wrong:** Process crashes or restarts. All active positions are lost. Bot doesn't know it has open positions.
**Why it happens:** Positions stored only in memory.
**How to avoid:** Write positions.json atomically on every state change (open, update, close). On startup, load from positions.json. Resume price monitoring and exit checking for all loaded positions.

### Pitfall 7: Wallet Config Not Validated on Startup

**What goes wrong:** wallets.json has invalid Solana addresses. Webhook is created with invalid addresses. No signals ever arrive, with no error message.
**Why it happens:** No validation of wallet addresses at startup.
**How to avoid:** Validate every address in wallets.json is a valid base58-encoded Solana public key on startup. Fail fast with a clear error.

## Code Examples

### Typed Event Bus Setup
```typescript
// core/events.ts
import { TypedEmitter } from 'tiny-typed-emitter';

interface PipelineEvents {
  'webhook:received': (payload: RawWebhookPayload) => void;
  'signal:detected': (signal: Signal) => void;
  'signal:rejected': (signal: Signal, reason: string) => void;
  'signal:skipped': (signal: Signal, reason: string) => void;
  'trade:executed': (result: TradeResult) => void;
  'position:opened': (position: Position) => void;
  'position:updated': (position: Position) => void;
  'position:closed': (position: Position, reason: ExitReason) => void;
  'price:updated': (prices: Map<string, number>) => void;
}

export const bus = new TypedEmitter<PipelineEvents>();
bus.setMaxListeners(20); // Prevent warning with multiple subscribers
```

### Webhook Receiver with Idempotency
```typescript
// server/index.ts
import express from 'express';

const app = express();
app.use(express.json());

const processedSignatures = new Set<string>();
const MAX_SIGNATURE_CACHE = 1000;

app.post('/webhook', (req, res) => {
  // Respond immediately -- never block
  res.status(200).send('OK');

  const events: RawWebhookPayload[] = req.body;
  for (const event of events) {
    const sig = event.signature;

    // Idempotency check
    if (processedSignatures.has(sig)) continue;
    processedSignatures.add(sig);

    // Evict old signatures to prevent memory leak
    if (processedSignatures.size > MAX_SIGNATURE_CACHE) {
      const first = processedSignatures.values().next().value;
      processedSignatures.delete(first);
    }

    bus.emit('webhook:received', event);
  }
});
```

### Position Manager Core
```typescript
// pipeline/position-manager.ts
class PositionManager {
  private positions = new Map<string, Position>();
  private tradedMints = new Set<string>(); // All-time: active + closed

  canOpenPosition(mint: string): { allowed: boolean; reason?: string } {
    if (this.positions.size >= 5) {
      return { allowed: false, reason: 'Max 5 concurrent positions' };
    }
    if (this.tradedMints.has(mint)) {
      return { allowed: false, reason: 'Already traded this mint' };
    }
    return { allowed: true };
  }

  openPosition(result: TradeResult): Position {
    const exitParams = generateExitParams(); // Randomized per trade
    const position: Position = {
      id: result.signature,
      mint: result.mint,
      entryPrice: result.entryPrice,
      tokensHeld: result.tokensReceived,
      solInvested: result.solAmount,
      currentPrice: result.entryPrice,
      pnlPct: 0,
      exitParams,
      openedAt: Date.now(),
      status: 'open',
    };

    this.positions.set(result.mint, position);
    this.tradedMints.add(result.mint);
    this.persist();
    return position;
  }

  checkExits(prices: Map<string, number>): ExitTrigger[] {
    const triggers: ExitTrigger[] = [];
    const now = Date.now();

    for (const [mint, pos] of this.positions) {
      const price = prices.get(mint);
      if (!price) continue;

      // Update PNL
      pos.currentPrice = price;
      pos.pnlPct = ((price - pos.entryPrice) / pos.entryPrice) * 100;

      // Check exits in priority order
      if (pos.pnlPct <= pos.exitParams.stopLossPct) {
        triggers.push({ mint, reason: 'stop-loss', position: pos });
      } else if (pos.pnlPct >= pos.exitParams.takeProfitPct) {
        triggers.push({ mint, reason: 'take-profit', position: pos });
      } else if (now - pos.openedAt >= pos.exitParams.timeLimitMs) {
        triggers.push({ mint, reason: 'time-limit', position: pos });
      }
    }

    return triggers;
  }
}
```

### Jupiter Price API v3 Polling
```typescript
// pipeline/price-monitor.ts
const JUPITER_PRICE_URL = 'https://api.jup.ag/price/v3';

async function fetchPrices(mints: string[]): Promise<Map<string, number>> {
  if (mints.length === 0) return new Map();

  const response = await fetch(
    `${JUPITER_PRICE_URL}?ids=${mints.join(',')}`,
    { headers: { 'x-api-key': process.env.JUPITER_API_KEY ?? '' } }
  );

  if (response.status === 429) {
    // Rate limited -- back off and return empty
    return new Map();
  }

  const data = await response.json();
  const prices = new Map<string, number>();

  for (const [mint, info] of Object.entries(data.data ?? {})) {
    if ((info as any)?.price) {
      prices.set(mint, Number((info as any).price));
    }
  }

  return prices;
}
```

### Helius Webhook Setup (One-Time)
```typescript
// scripts/setup-webhook.ts
import { createHelius, WebhookType } from 'helius-sdk';

async function setupWebhook() {
  const helius = createHelius({ apiKey: process.env.HELIUS_API_KEY! });

  const wallets = JSON.parse(fs.readFileSync('./data/wallets.json', 'utf-8'));

  const webhook = await helius.webhooks.createWebhook({
    accountAddresses: wallets,
    webhookURL: `${process.env.WEBHOOK_BASE_URL}/webhook`,
    webhookType: WebhookType.RAW,
    transactionTypes: ['ANY'],
  });

  console.log('Webhook created:', webhook.webhookID);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PumpFun tokens graduate to Raydium | Tokens graduate to PumpSwap | March 2025 | Must use PumpSwap SDK for post-graduation trades (Phase 3) |
| Jupiter Price API v1/v2 | Jupiter Price API v3 | Late 2025 | v2 endpoints deprecated; v3 requires API key via `x-api-key` header |
| helius-sdk v1 (uses web3.js) | helius-sdk v2 (uses @solana/kit internally) | 2025 | Internal rewrite; webhook API surface largely unchanged |
| framer-motion | motion (package rename) | Late 2024 | Not relevant for Phase 1, but noted for Phase 2 |

**Deprecated/outdated:**
- Jupiter Price API v2 (`lite-api.jup.ag/price/v2`) -- being deprecated, use v3 (`api.jup.ag/price/v3`)
- Helius SDK v1 -- replaced by v2 with @solana/kit internals
- `@solana/web3.js` 1.95.6-1.95.7 -- compromised, use 1.95.8+ or latest 1.x

## Open Questions

1. **Jupiter Price API key availability**
   - What we know: v3 requires an API key via `x-api-key` header, obtained from Jupiter Portal
   - What's unclear: Whether free tier rate limits are sufficient for polling 5 positions every 5-10 seconds
   - Recommendation: Sign up for Jupiter Portal API key early. If rate limited, fall back to fetching price from on-chain pool reserves directly (more complex but no rate limit)

2. **Helius SDK v2 createWebhook API surface**
   - What we know: v2 uses `createHelius()` factory function instead of `new Helius()`. Webhook namespace is `helius.webhooks.*`
   - What's unclear: Exact TypeScript types for raw webhook payload in v2
   - Recommendation: Use the SDK for webhook CRUD only. Receive raw POST bodies directly via Express and type them manually based on Solana transaction format.

3. **PumpFun account indices for buy/sell instructions**
   - What we know: Mint is at index 2, user at index 6 (from QuickNode guide)
   - What's unclear: Whether these indices have changed in recent PumpFun program updates
   - Recommendation: Validate against a known PumpFun transaction on Solana Explorer before hardcoding. Build the decoder to fail loudly if account count doesn't match expectations.

4. **Railway webhook URL stability**
   - What we know: Railway provides a public URL, but redeployments may change the URL
   - What's unclear: Whether custom domains are needed for stable webhook URLs
   - Recommendation: Use Railway's custom domain feature or update the webhook URL after each deploy via the Helius SDK. Build a startup script that re-registers/updates the webhook URL.

## Sources

### Primary (HIGH confidence)
- [Helius Webhooks Documentation](https://www.helius.dev/docs/webhooks) -- Webhook types, setup, raw vs enhanced
- [Helius Webhooks FAQ](https://www.helius.dev/docs/faqs/webhooks) -- Latency, costs, delivery guarantees
- [Helius SDK GitHub](https://github.com/helius-labs/helius-sdk) -- v2 API surface, createHelius factory
- [Jupiter Price API v3 Docs](https://dev.jup.ag/docs/price/v3) -- Endpoint, auth, rate limits
- [Solana getTokenLargestAccounts RPC](https://docs.chainstack.com/docs/solana-gettokenlargestaccounts-rpc-method) -- Top 20 holders query
- [QuickNode PumpFun Copy Trade Guide](https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade) -- Discriminator matching, account indices, copy trade flow

### Secondary (MEDIUM confidence)
- [Chainstack PumpFun Bot](https://docs.chainstack.com/docs/solana-creating-a-pumpfun-bot) -- Instruction discriminator calculation, bonding curve state
- [PumpFun-PumpSwap SDK](https://github.com/Erbsensuppee/pumpfun-pumpswap-sdk) -- Auto bonding curve switching pattern
- [PumpFun instruction discriminators](https://qiita.com/shooter/items/202be328c5315d3f9825) -- Buy: 66063d1201daebea, Sell: 33e685a4017f83ad
- [write-file-atomic npm](https://www.npmjs.com/package/write-file-atomic) -- Atomic JSON persistence pattern

### Tertiary (LOW confidence)
- PumpFun account indices (mint=2, user=6) -- from QuickNode guide, should be validated against live transactions
- Jupiter Price API v3 free tier rate limits -- not explicitly documented, needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are well-established with official docs
- Architecture (event bus, strategy pattern): HIGH -- standard patterns verified across multiple copy-trade implementations
- Webhook handling: HIGH -- Helius docs are comprehensive, raw vs enhanced tradeoff is clear
- Rug filter: HIGH -- getTokenLargestAccounts is a standard Solana RPC call
- PumpFun discriminators: MEDIUM -- verified from multiple sources but account indices need live validation
- Price monitoring: MEDIUM -- Jupiter v3 is current but rate limits need testing
- Exit strategy randomization: MEDIUM -- ranges are reasonable but untested against real PumpFun volatility

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days -- Solana ecosystem moves fast but core patterns are stable)
