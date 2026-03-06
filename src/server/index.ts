import express from 'express';
import { createServer } from 'http';
import { join } from 'path';
import { Connection } from '@solana/web3.js';
import { loadConfig } from './config.js';
import { bus } from '../core/events.js';
import { logger } from '../utils/logger.js';
import type { RawWebhookPayload } from '../core/types.js';
import { initSignalDetector } from '../pipeline/signal-detector.js';
import { initRugFilter } from '../pipeline/rug-filter.js';
import { initTradeExecutor } from '../pipeline/trade-executor.js';
import { initPositionManager } from '../pipeline/position-manager.js';
import { initPriceMonitor } from '../pipeline/price-monitor.js';
import { initWebSocketServer } from './ws-broadcast.js';

const MAX_DEDUP_SIZE = 1000;
const processedSignatures = new Set<string>();

function evictOldest(): void {
  const first = processedSignatures.values().next().value;
  if (first !== undefined) {
    processedSignatures.delete(first);
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const connection = new Connection(config.rpcUrl);

  // Initialize pipeline modules in dependency order
  const positionManager = await initPositionManager(config);
  initSignalDetector();
  initRugFilter(connection);
  initTradeExecutor(config, positionManager);
  initPriceMonitor(positionManager, config);

  const app = express();

  app.use(express.json());
  app.use(express.static(join(process.cwd(), 'public')));

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
      positions: positionManager.getOpenPositions().length,
    });
  });

  const server = createServer(app);
  initWebSocketServer(server, () => positionManager.getOpenPositions());

  server.listen(config.port, () => {
    const openPositions = positionManager.getOpenPositions().length;
    logger.info(
      [
        '[BioTrencher] Pipeline active',
        `  Mode: ${config.mode}`,
        `  Wallets: ${config.wallets.length} tracked`,
        `  Max positions: ${config.maxPositions}`,
        `  Open positions: ${openPositions} (restored from state)`,
        `  Dashboard: http://localhost:${config.port}`,
      ].join('\n'),
    );
  });

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down...');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
