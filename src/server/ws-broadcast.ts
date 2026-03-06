import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { bus } from '../core/events.js';
import type { Position } from '../core/types.js';

export function initWebSocketServer(
  server: Server,
  getPositions: () => Position[],
): WebSocketServer {
  const wss = new WebSocketServer({ server });

  function broadcast(type: string, data: unknown): void {
    const message = JSON.stringify({ type, data, ts: Date.now() });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  // Throttle price:updated to max once per 5 seconds
  let lastPriceBroadcast = 0;
  let pendingPriceData: Record<string, number> | null = null;
  let priceTimer: ReturnType<typeof setTimeout> | null = null;

  function broadcastPrice(prices: Map<string, number>): void {
    const now = Date.now();
    const data = Object.fromEntries(prices);

    if (now - lastPriceBroadcast >= 5000) {
      broadcast('price:updated', data);
      lastPriceBroadcast = now;
      pendingPriceData = null;
    } else {
      pendingPriceData = data;
      if (!priceTimer) {
        const delay = 5000 - (now - lastPriceBroadcast);
        priceTimer = setTimeout(() => {
          if (pendingPriceData) {
            broadcast('price:updated', pendingPriceData);
            lastPriceBroadcast = Date.now();
            pendingPriceData = null;
          }
          priceTimer = null;
        }, delay);
      }
    }
  }

  // Bridge pipeline events to WebSocket clients
  bus.on('position:opened', (pos) => broadcast('position:opened', pos));
  bus.on('position:updated', (pos) => broadcast('position:updated', pos));
  bus.on('position:closed', (pos, reason) =>
    broadcast('position:closed', { ...pos, reason }),
  );
  bus.on('signal:detected', (sig) => broadcast('signal:detected', sig));
  bus.on('signal:validated', (sig) => broadcast('signal:validated', sig));
  bus.on('signal:rejected', (sig, reason) =>
    broadcast('signal:rejected', { ...sig, reason }),
  );
  bus.on('trade:executed', (result) => broadcast('trade:executed', result));
  bus.on('price:updated', (prices) => broadcastPrice(prices));

  // Heartbeat to detect dead connections (30s interval)
  const heartbeatInterval = setInterval(() => {
    for (const ws of wss.clients) {
      if ((ws as any).isAlive === false) {
        ws.terminate();
        continue;
      }
      (ws as any).isAlive = false;
      ws.ping();
    }
  }, 30_000);

  wss.on('connection', (ws) => {
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });
    ws.on('error', () => {});

    // Send initial snapshot of open positions
    const positions = getPositions();
    ws.send(
      JSON.stringify({
        type: 'snapshot',
        data: { positions },
        ts: Date.now(),
      }),
    );
  });

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
    if (priceTimer) clearTimeout(priceTimer);
  });

  return wss;
}
