import crypto from 'node:crypto';
import { bus } from '../core/events.js';
import type { ValidatedSignal, TradeResult, Config, Position, ExitReason } from '../core/types.js';
import { logger } from '../utils/logger.js';
import type { PositionManager } from './position-manager.js';

// CL1-style narration for skipped signals
const SKIP_NARRATIONS = [
  'neural coherence insufficient... pattern rejected',
  'synaptic threshold not met... signal dampened',
  'cortical bandwidth saturated... input filtered',
  'limbic resonance out of phase... impulse suppressed',
  'axonal pathway congested... stimulus deferred',
] as const;

function randomNarration(): string {
  return SKIP_NARRATIONS[Math.floor(Math.random() * SKIP_NARRATIONS.length)];
}

function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// Injectable price getter -- Plan 04 (price monitor) will set this
let priceGetter: ((mint: string) => Promise<number>) | null = null;

export function setPriceGetter(fn: (mint: string) => Promise<number>): void {
  priceGetter = fn;
}

export interface ExecutionStrategy {
  executeBuy(signal: ValidatedSignal): Promise<TradeResult>;
  executeSell(position: Position, reason: ExitReason): Promise<TradeResult>;
}

export class SafeExecutor implements ExecutionStrategy {
  private readonly buyAmountSol: number;

  constructor(config: Pick<Config, 'buyAmountSol'>) {
    this.buyAmountSol = config.buyAmountSol;
  }

  async executeBuy(signal: ValidatedSignal): Promise<TradeResult> {
    // Use injected price getter if available, otherwise fallback to small random price
    const entryPrice = priceGetter
      ? await priceGetter(signal.mint)
      : 0.000005 + Math.random() * 0.00001; // ~0.000005-0.000015 SOL range

    const tokensReceived = this.buyAmountSol / entryPrice;
    const signature = `SAFE_BUY_${Date.now()}_${randomHex(8)}`;

    return {
      signature,
      mint: signal.mint,
      solAmount: this.buyAmountSol,
      tokensReceived,
      entryPrice,
      mode: 'SAFE',
      timestamp: Date.now(),
    };
  }

  async executeSell(position: Position, reason: ExitReason): Promise<TradeResult> {
    const exitPrice = position.currentPrice;
    const solReceived = position.tokensHeld * exitPrice;
    const signature = `SAFE_SELL_${Date.now()}_${randomHex(8)}`;

    return {
      signature,
      mint: position.mint,
      solAmount: solReceived,
      tokensReceived: 0,
      exitPrice,
      mode: 'SAFE',
      reason,
      timestamp: Date.now(),
    };
  }
}

export function initTradeExecutor(config: Config, positionManager: PositionManager): void {
  const executor = new SafeExecutor(config);
  const log = logger.child({ module: 'trade-executor' });

  bus.on('signal:validated', async (signal: ValidatedSignal) => {
    const check = positionManager.canOpenPosition(signal.mint);

    if (!check.allowed) {
      bus.emit('signal:skipped', signal, check.reason!);
      log.info(
        { mint: signal.mint, reason: check.reason },
        `[CL1] ${randomNarration()}`
      );
      return;
    }

    try {
      const result = await executor.executeBuy(signal);
      log.info(
        { mint: result.mint, sol: result.solAmount, tokens: result.tokensReceived, sig: result.signature },
        'SAFE trade executed'
      );
      bus.emit('trade:executed', result);
    } catch (err) {
      log.error({ err, mint: signal.mint }, 'Trade execution failed');
    }
  });
}
