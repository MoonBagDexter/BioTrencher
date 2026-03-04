import bs58 from 'bs58';
import { bus } from '../core/events.js';
import type { RawWebhookPayload, Signal } from '../core/types.js';
import { logger } from '../utils/logger.js';

// --- PumpFun constants ---
const PUMP_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const PUMP_BUY_DISCRIMINATOR = Buffer.from('66063d1201daebea', 'hex');
const PUMP_SELL_DISCRIMINATOR = Buffer.from('33e685a4017f83ad', 'hex');
// PumpFun account indices within instruction accounts array
const PUMP_MINT_INDEX = 2;
const PUMP_USER_INDEX = 6;

// --- PumpSwap constants (post-migration buys, per TRADE-05 decision) ---
// WARNING: PumpSwap discriminators unverified -- PumpSwap signals may be missed.
// The program ID is confirmed, but the instruction layout and account indices
// need verification against the actual PumpSwap IDL or on-chain transactions.
// TODO: Verify PumpSwap buy discriminator and account indices against live transactions.
const PUMPSWAP_PROGRAM = 'PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP';
// Anchor pattern: first 8 bytes of SHA-256("global:buy")
const PUMPSWAP_BUY_DISCRIMINATOR = Buffer.from('66063d1201daebea', 'hex');
// PumpSwap account indices -- assumed similar structure, needs verification
const PUMPSWAP_MINT_INDEX = 2;
const PUMPSWAP_USER_INDEX = 6;

const log = logger.child({ module: 'signal-detector' });

function decodeSignal(payload: RawWebhookPayload): Signal | null {
  const { accountKeys, instructions } = payload.transaction.message;

  for (const ix of instructions) {
    const programId = accountKeys[ix.programIdIndex];
    if (!programId) continue;

    let data: Buffer;
    try {
      data = Buffer.from(bs58.decode(ix.data));
    } catch {
      continue; // malformed base58, skip instruction
    }

    if (data.length < 8) continue;

    const discriminator = data.subarray(0, 8);

    // --- PumpFun ---
    if (programId === PUMP_PROGRAM) {
      let type: 'BUY' | 'SELL' | null = null;
      if (PUMP_BUY_DISCRIMINATOR.equals(discriminator)) type = 'BUY';
      else if (PUMP_SELL_DISCRIMINATOR.equals(discriminator)) type = 'SELL';
      if (!type) continue;

      const mint = accountKeys[ix.accounts[PUMP_MINT_INDEX]];
      const user = accountKeys[ix.accounts[PUMP_USER_INDEX]];
      if (!mint || !user) continue;

      return {
        type,
        source: 'pumpfun',
        mint,
        user,
        signature: payload.signature,
        timestamp: Date.now(),
      };
    }

    // --- PumpSwap (only BUY detection needed for copy-buy) ---
    if (programId === PUMPSWAP_PROGRAM) {
      if (!PUMPSWAP_BUY_DISCRIMINATOR.equals(discriminator)) continue;

      const mint = accountKeys[ix.accounts[PUMPSWAP_MINT_INDEX]];
      const user = accountKeys[ix.accounts[PUMPSWAP_USER_INDEX]];
      if (!mint || !user) continue;

      return {
        type: 'BUY',
        source: 'pumpswap',
        mint,
        user,
        signature: payload.signature,
        timestamp: Date.now(),
      };
    }
  }

  // No matching PumpFun/PumpSwap instruction found -- silently ignore
  return null;
}

export function initSignalDetector(): void {
  log.warn('PumpSwap discriminators unverified -- PumpSwap signals may be missed');

  bus.on('webhook:received', (payload: RawWebhookPayload) => {
    try {
      const signal = decodeSignal(payload);
      if (!signal) return;

      log.info(
        {
          source: signal.source,
          type: signal.type,
          mint: signal.mint.slice(0, 8),
          user: signal.user.slice(0, 8),
          sig: signal.signature.slice(0, 12),
        },
        'Signal detected',
      );

      bus.emit('signal:detected', signal);
    } catch (err) {
      log.error({ err, sig: payload.signature?.slice(0, 12) }, 'Failed to decode webhook payload');
    }
  });
}
