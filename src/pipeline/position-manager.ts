import { join } from 'node:path';
import { bus } from '../core/events.js';
import type {
  Config,
  ExitReason,
  Position,
  Signal,
  TradeResult,
} from '../core/types.js';
import { logger } from '../utils/logger.js';
import { readJson, writeJson } from '../utils/persistence.js';

const DATA_DIR = join(process.cwd(), 'data');
const POSITIONS_PATH = join(DATA_DIR, 'positions.json');
const HISTORY_PATH = join(DATA_DIR, 'history.json');

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shortMint(mint: string): string {
  return mint.length > 8 ? `${mint.slice(0, 4)}...${mint.slice(-4)}` : mint;
}

export class PositionManager {
  private positions: Map<string, Position> = new Map();
  private tradedMints: Set<string> = new Set();
  private history: Position[] = [];
  private readonly maxPositions: number;
  private readonly buyAmountSol: number;
  private readonly log = logger.child({ module: 'position-manager' });

  constructor(config: Pick<Config, 'maxPositions' | 'buyAmountSol'>) {
    this.maxPositions = config.maxPositions;
    this.buyAmountSol = config.buyAmountSol;
  }

  async init(): Promise<void> {
    const savedPositions = await readJson<Position[]>(POSITIONS_PATH, []);
    const savedHistory = await readJson<Position[]>(HISTORY_PATH, []);

    for (const pos of savedPositions) {
      this.positions.set(pos.mint, pos);
      this.tradedMints.add(pos.mint);
    }

    this.history = savedHistory;
    for (const pos of savedHistory) {
      this.tradedMints.add(pos.mint);
    }

    this.log.info(
      { open: this.positions.size, historical: this.history.length },
      'Position state loaded'
    );
  }

  canOpenPosition(mint: string): { allowed: boolean; reason?: string } {
    if (this.positions.size >= this.maxPositions) {
      return { allowed: false, reason: `Max ${this.maxPositions} concurrent positions` };
    }
    if (this.tradedMints.has(mint)) {
      return { allowed: false, reason: 'Already traded this mint' };
    }
    return { allowed: true };
  }

  openPosition(result: TradeResult, copiedFrom: string): Position {
    const takeProfitPct = randomInt(100, 200);
    const stopLossPct = -randomInt(30, 50); // negative: -30 to -50
    const timeLimitMs = randomInt(15, 45) * 60 * 1000; // 15-45 min in ms

    const position: Position = {
      id: result.signature,
      mint: result.mint,
      entryPrice: result.entryPrice!,
      tokensHeld: result.tokensReceived,
      solInvested: result.solAmount,
      currentPrice: result.entryPrice!,
      pnlPct: 0,
      exitParams: { takeProfitPct, stopLossPct, timeLimitMs },
      openedAt: Date.now(),
      status: 'open',
      copiedFrom,
    };

    this.positions.set(result.mint, position);
    this.tradedMints.add(result.mint);
    void this.persist();

    bus.emit('position:opened', position);
    this.log.info(
      `Position opened: ${shortMint(result.mint)} | TP: ${takeProfitPct}% | SL: ${stopLossPct}% | Time: ${timeLimitMs / 60000}min`
    );

    return position;
  }

  checkExits(prices: Map<string, number>): void {
    for (const [mint, position] of this.positions) {
      const price = prices.get(mint);
      if (price === undefined) continue;

      position.currentPrice = price;
      position.pnlPct = ((price - position.entryPrice) / position.entryPrice) * 100;

      // Priority order: stop-loss > take-profit > time-limit
      if (position.pnlPct <= position.exitParams.stopLossPct) {
        this.closePosition(mint, 'stop-loss');
      } else if (position.pnlPct >= position.exitParams.takeProfitPct) {
        this.closePosition(mint, 'take-profit');
      } else if (Date.now() - position.openedAt >= position.exitParams.timeLimitMs) {
        this.closePosition(mint, 'time-limit');
      } else {
        bus.emit('position:updated', position);
      }
    }
  }

  checkTimeLimitExits(): void {
    for (const [mint, position] of this.positions) {
      if (Date.now() - position.openedAt >= position.exitParams.timeLimitMs) {
        this.closePosition(mint, 'time-limit');
      }
    }
  }

  handleCopySell(signal: Signal): void {
    if (signal.type === 'SELL' && this.positions.has(signal.mint)) {
      this.closePosition(signal.mint, 'copy-sell');
    }
  }

  closePosition(mint: string, reason: ExitReason): void {
    const position = this.positions.get(mint);
    if (!position) return;

    position.status = 'closed';
    this.positions.delete(mint);
    this.history.push(position);
    void this.persist();

    bus.emit('position:closed', position, reason);
    this.log.info(
      `Position closed: ${shortMint(mint)} | Reason: ${reason} | PNL: ${position.pnlPct.toFixed(1)}%`
    );
  }

  private async persist(): Promise<void> {
    const positionsArray = Array.from(this.positions.values());
    await Promise.all([
      writeJson(POSITIONS_PATH, positionsArray),
      writeJson(HISTORY_PATH, this.history),
    ]);
  }

  getOpenPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getActiveMints(): string[] {
    return Array.from(this.positions.keys());
  }
}

export async function initPositionManager(config: Config): Promise<PositionManager> {
  const pm = new PositionManager(config);
  await pm.init();

  bus.on('trade:executed', (result: TradeResult) => {
    pm.openPosition(result, result.copiedFrom);
  });

  bus.on('signal:detected', (signal: Signal) => {
    pm.handleCopySell(signal);
  });

  bus.on('price:updated', (prices: Map<string, number>) => {
    pm.checkExits(prices);
  });

  return pm;
}
