import express from 'express';
import { loadConfig } from './config.js';
import { bus } from '../core/events.js';
import { logger } from '../utils/logger.js';
import type { RawWebhookPayload } from '../core/types.js';

const MAX_DEDUP_SIZE = 1000;
const processedSignatures = new Set<string>();

function evictOldest(): void {
  // Set iterates in insertion order; delete the first entry (FIFO)
  const first = processedSignatures.values().next().value;
  if (first !== undefined) {
    processedSignatures.delete(first);
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const app = express();

  app.use(express.json());

  app.post('/webhook', (req, res) => {
    // Respond 200 immediately -- Helius retries on slow responses
    res.status(200).json({ ok: true });

    const transactions: RawWebhookPayload[] = Array.isArray(req.body)
      ? req.body
      : [req.body];

    for (const tx of transactions) {
      const sig = tx?.signature;
      if (!sig) {
        logger.warn('Webhook payload missing signature, skipping');
        continue;
      }

      if (processedSignatures.has(sig)) {
        logger.debug({ sig: sig.slice(0, 12) }, 'Duplicate webhook ignored');
        continue;
      }

      // Evict oldest if at capacity
      if (processedSignatures.size >= MAX_DEDUP_SIZE) {
        evictOldest();
      }

      processedSignatures.add(sig);
      bus.emit('webhook:received', tx);
    }
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: config.mode,
      positions: 0, // wired later
    });
  });

  app.listen(config.port, () => {
    logger.info(
      { port: config.port, mode: config.mode, wallets: config.wallets.length },
      'BioTrencher server started',
    );
  });
}

main().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
