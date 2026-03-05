import { bus } from '../core/events.js';
import type { Config } from '../core/types.js';
import { logger } from '../utils/logger.js';
import type { PositionManager } from './position-manager.js';
import { setPriceGetter } from './trade-executor.js';

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v3';
const BASE_POLL_INTERVAL_MS = 10_000;
const TIME_CHECK_INTERVAL_MS = 30_000;
const MAX_POLL_INTERVAL_MS = 60_000;
const BACKOFF_THRESHOLD = 3; // consecutive 429s before backing off

const log = logger.child({ module: 'price-monitor' });

async function fetchPrices(
  mints: string[],
  apiKey: string,
): Promise<Map<string, number>> {
  if (mints.length === 0) return new Map();

  const ids = mints.join(',');
  const url = `${JUPITER_PRICE_API}?ids=${ids}`;

  try {
    const res = await fetch(url, {
      headers: { 'x-api-key': apiKey },
    });

    if (res.status === 429) {
      log.warn('Jupiter API rate limited (429)');
      return new Map();
    }

    if (!res.ok) {
      log.error({ status: res.status }, 'Jupiter API request failed');
      return new Map();
    }

    const body = (await res.json()) as {
      data: Record<string, { price: string }>;
    };

    const prices = new Map<string, number>();
    for (const mint of mints) {
      const entry = body.data[mint];
      if (entry?.price) {
        prices.set(mint, Number(entry.price));
      }
    }

    return prices;
  } catch (err) {
    log.error({ err }, 'Jupiter API fetch error');
    return new Map();
  }
}

export function initPriceMonitor(
  positionManager: PositionManager,
  config: Config,
): void {
  let consecutiveRateLimits = 0;
  let currentIntervalMs = BASE_POLL_INTERVAL_MS;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  // Wire price getter into SafeExecutor for mock buys
  setPriceGetter(async (mint: string) => {
    const prices = await fetchPrices([mint], config.jupiterApiKey);
    const price = prices.get(mint);
    if (price !== undefined) return price;
    // Fallback to small random price if Jupiter doesn't have it
    return 0.000005 + Math.random() * 0.00001;
  });

  function startPollLoop(): void {
    if (pollTimer) clearInterval(pollTimer);

    pollTimer = setInterval(async () => {
      const mints = positionManager.getActiveMints();
      if (mints.length === 0) {
        log.debug('No active positions, skipping price poll');
        return;
      }

      const prices = await fetchPrices(mints, config.jupiterApiKey);

      if (prices.size === 0 && mints.length > 0) {
        // Possible rate limit or error
        consecutiveRateLimits++;

        if (consecutiveRateLimits >= BACKOFF_THRESHOLD) {
          const newInterval = Math.min(currentIntervalMs * 2, MAX_POLL_INTERVAL_MS);
          if (newInterval !== currentIntervalMs) {
            currentIntervalMs = newInterval;
            log.warn(
              { intervalMs: currentIntervalMs },
              'Backing off price polling due to consecutive failures',
            );
            startPollLoop(); // restart with new interval
          }
        }
      } else {
        // Successful fetch -- reset backoff
        if (consecutiveRateLimits > 0) {
          consecutiveRateLimits = 0;
          if (currentIntervalMs !== BASE_POLL_INTERVAL_MS) {
            currentIntervalMs = BASE_POLL_INTERVAL_MS;
            log.info('Price polling recovered, reset to base interval');
            startPollLoop();
          }
        }

        if (prices.size > 0) {
          bus.emit('price:updated', prices);
          log.debug({ count: prices.size }, 'Prices updated');
        }
      }
    }, currentIntervalMs);
  }

  // Start price polling
  startPollLoop();
  log.info({ intervalMs: currentIntervalMs }, 'Price monitor started');

  // Independent time-based exit checking
  setInterval(() => {
    positionManager.checkTimeLimitExits();
  }, TIME_CHECK_INTERVAL_MS);

  log.info({ intervalMs: TIME_CHECK_INTERVAL_MS }, 'Time-based exit checker started');
}
