import { Connection, PublicKey } from '@solana/web3.js';
import { bus } from '../core/events.js';
import type { Signal } from '../core/types.js';
import { logger } from '../utils/logger.js';

// Rug filter threshold: reject if ANY single holder has more than 5% of supply.
// This covers both dev wallet concentration and single-whale risk.
// getTokenLargestAccounts returns the top 20 holders, which is sufficient
// coverage for early-stage PumpFun tokens where supply is concentrated.
const MAX_HOLDER_PCT = 5;

const log = logger.child({ module: 'rug-filter' });

export function initRugFilter(connection: Connection): void {
  bus.on('signal:detected', async (signal: Signal) => {
    // SELL signals bypass rug filter entirely.
    // They represent tracked wallets selling, which triggers copy-sell exit logic.
    // Position manager subscribes to signal:detected directly for SELL-type signals.
    if (signal.type === 'SELL') return;

    const mintPubkey = new PublicKey(signal.mint);

    try {
      const [holdersResp, supplyResp] = await Promise.all([
        connection.getTokenLargestAccounts(mintPubkey),
        connection.getTokenSupply(mintPubkey),
      ]);

      const totalSupply = Number(supplyResp.value.amount);
      if (totalSupply === 0) {
        bus.emit('signal:rejected', signal, 'Token supply is 0');
        log.info({ mint: signal.mint.slice(0, 8) }, 'Rug check rejected: zero supply');
        return;
      }

      for (const holder of holdersResp.value) {
        const holderAmount = Number(holder.amount);
        const pct = (holderAmount / totalSupply) * 100;

        if (pct > MAX_HOLDER_PCT) {
          const reason = `Wallet holds ${pct.toFixed(1)}% of supply (limit: ${MAX_HOLDER_PCT}%)`;
          bus.emit('signal:rejected', signal, reason);
          log.info(
            { mint: signal.mint.slice(0, 8), pct: pct.toFixed(1) },
            `Rug check rejected: ${reason}`,
          );
          return;
        }
      }

      // All top-20 holders are below threshold -- signal validated
      bus.emit('signal:validated', { ...signal, rugCheckPassed: true as const });
      log.info({ mint: signal.mint.slice(0, 8) }, 'Rug check passed');
    } catch (err) {
      // Fail closed: reject on RPC error rather than letting a potentially rugged token through
      const reason = 'RPC error during rug check';
      bus.emit('signal:rejected', signal, reason);
      log.error({ err, mint: signal.mint.slice(0, 8) }, reason);
    }
  });
}
