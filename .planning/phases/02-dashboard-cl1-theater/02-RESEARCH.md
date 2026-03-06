# Phase 2: Dashboard + CL1 Theater - Research

**Researched:** 2026-03-09
**Domain:** Real-time dashboard with WebSocket, Canvas animations, CL1 biological theater
**Confidence:** HIGH

## Summary

This phase builds a viral-ready public dashboard as a static HTML/CSS/JS frontend served by the existing Express 5 server, with real-time data pushed via WebSocket using the `ws` library. The frontend is vanilla -- no React, no build tools, no framework. The neuron grid uses HTML5 Canvas with `requestAnimationFrame`. The terminal is a DOM-based scrolling log with CSS styling. All data flows from the existing typed EventEmitter bus through a WebSocket broadcast layer to the browser.

The architecture is straightforward: Express serves static files from a `public/` directory, the `ws` WebSocket server attaches to the same HTTP server, and pipeline events are relayed to all connected clients as JSON messages. The frontend subscribes to these messages and updates Canvas, DOM, and stats accordingly.

**Primary recommendation:** Use vanilla HTML/CSS/JS with the `ws` library (v8.x) attached to the existing Express server. Canvas for the neuron grid, DOM for everything else. No build step, no framework, no bundler.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ws | ^8.19.0 | WebSocket server | 169M weekly downloads, de facto Node.js WebSocket. Attaches to existing HTTP server |
| @types/ws | latest | TypeScript types for ws | Type safety on server side |
| express.static | (built-in) | Serve frontend files | Already using Express 5, no extra dependency |
| HTML5 Canvas | (browser native) | Neuron grid animation | No library needed for 2D grid of colored tiles |
| CSS Grid | (browser native) | Three-column layout | Native browser layout, no framework needed |
| WebSocket | (browser native) | Client-side WS connection | Built into all browsers, no library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Google Fonts (VT323) | - | Monospace terminal font | Terminal panel and BIOS boot sequence |
| CSS custom properties | (native) | Theme/color system | Dark sci-fi theme with neon accents |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla JS | React/Next.js | Massive overkill for a single-page dashboard with no user interaction. Adds build step, bundler, 100KB+ runtime. Vanilla is faster to ship and deploy as static files |
| Canvas API | SVG/DOM grid | Canvas is better for 60fps animation of 100+ tiles. SVG/DOM would cause layout thrashing at scale |
| ws | Socket.IO | Socket.IO adds 50KB+ client bundle, fallback transports we don't need. ws is lighter and WebSocket-only is fine for modern browsers |
| express-ws | ws directly | express-ws monkey-patches Express. Direct ws with noServer/upgrade is cleaner and works with Express 5 |

**Installation:**
```bash
npm install ws @types/ws
```

No client-side installation needed -- all browser-native APIs.

## Architecture Patterns

### Recommended Project Structure
```
src/
  server/
    index.ts          # Express app + WebSocket server setup
    ws-broadcast.ts   # NEW: subscribes to bus events, broadcasts to WS clients
  core/
    events.ts         # Existing typed EventEmitter (add dashboard events)
    types.ts          # Existing types (add dashboard message types)
public/
  index.html          # Single-page dashboard
  css/
    main.css          # Layout, theme, dark mode
    terminal.css      # Terminal panel styles
    neuron-grid.css   # Grid panel styles
    boot.css          # BIOS boot sequence styles
  js/
    app.js            # Main entry, WebSocket connection, message router
    neuron-grid.js    # Canvas rendering for MEA grid
    terminal.js       # Terminal log manager (append, auto-scroll, idle chatter)
    positions.js      # Positions panel renderer
    stats.js          # Biological stats bar manager
    boot.js           # BIOS boot sequence animation
    bio-stats.js      # Stat derivation from real trading data (CL1-01)
    confidence.js     # Neural confidence calculation (CL1-02)
```

### Pattern 1: WebSocket Broadcast Bridge
**What:** A server-side module that subscribes to the existing EventEmitter bus and broadcasts events to all connected WebSocket clients as JSON messages.
**When to use:** Always -- this is the bridge between backend pipeline and frontend.
**Example:**
```typescript
// src/server/ws-broadcast.ts
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { bus } from '../core/events.js';

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  function broadcast(type: string, data: unknown): void {
    const message = JSON.stringify({ type, data, ts: Date.now() });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  // Bridge pipeline events to WebSocket clients
  bus.on('position:opened', (pos) => broadcast('position:opened', pos));
  bus.on('position:updated', (pos) => broadcast('position:updated', pos));
  bus.on('position:closed', (pos, reason) => broadcast('position:closed', { ...pos, reason }));
  bus.on('signal:detected', (sig) => broadcast('signal:detected', sig));
  bus.on('signal:validated', (sig) => broadcast('signal:validated', sig));
  bus.on('signal:rejected', (sig, reason) => broadcast('signal:rejected', { ...sig, reason }));
  bus.on('trade:executed', (result) => broadcast('trade:executed', result));
  bus.on('price:updated', (prices) => broadcast('price:updated', Object.fromEntries(prices)));

  // Heartbeat to detect dead connections
  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if ((ws as any).isAlive === false) { ws.terminate(); continue; }
      (ws as any).isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('connection', (ws) => {
    (ws as any).isAlive = true;
    ws.on('pong', () => { (ws as any).isAlive = true; });
    ws.on('error', () => {});
  });

  wss.on('close', () => clearInterval(interval));

  return wss;
}
```

### Pattern 2: Express createServer Wrapping
**What:** Wrap Express app in `http.createServer()` so both Express routes and WebSocket share the same port.
**When to use:** Required -- ws needs the raw HTTP server to attach to.
**Example:**
```typescript
// Modified src/server/index.ts
import { createServer } from 'http';
import express from 'express';
import { join } from 'path';
import { initWebSocketServer } from './ws-broadcast.js';

const app = express();
app.use(express.json());
app.use(express.static(join(process.cwd(), 'public'))); // Serve dashboard

const server = createServer(app);
initWebSocketServer(server);

// Change app.listen() to server.listen()
server.listen(config.port, () => { ... });
```

### Pattern 3: Client-Side Message Router
**What:** Single WebSocket connection on client that routes messages to specific UI modules.
**When to use:** Always -- keeps client code organized.
**Example:**
```javascript
// public/js/app.js
const ws = new WebSocket(`ws://${location.host}`);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'position:opened':
    case 'position:updated':
    case 'position:closed':
      Positions.handleMessage(msg);
      break;
    case 'signal:detected':
    case 'signal:validated':
    case 'signal:rejected':
    case 'trade:executed':
      Terminal.handleMessage(msg);
      NeuronGrid.handleMessage(msg);
      break;
    case 'price:updated':
      Stats.handleMessage(msg);
      break;
  }
};
```

### Pattern 4: Canvas Neuron Grid with requestAnimationFrame
**What:** A fixed-size canvas drawing a grid of colored tiles, with animations triggered by WebSocket events.
**When to use:** For the MEA neuron visualizer panel.
**Example:**
```javascript
// public/js/neuron-grid.js
const canvas = document.getElementById('neuron-canvas');
const ctx = canvas.getContext('2d');

const GRID_COLS = 8;
const GRID_ROWS = 8;
const tiles = []; // Array of { col, row, color, intensity, targetIntensity }

function draw(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const tileW = canvas.width / GRID_COLS;
  const tileH = canvas.height / GRID_ROWS;

  for (const tile of tiles) {
    // Lerp intensity toward target for smooth transitions
    tile.intensity += (tile.targetIntensity - tile.intensity) * 0.05;
    ctx.globalAlpha = 0.2 + tile.intensity * 0.8;
    ctx.fillStyle = tile.color;
    ctx.fillRect(tile.col * tileW + 1, tile.row * tileH + 1, tileW - 2, tileH - 2);

    // Draw electrode dot in center
    ctx.globalAlpha = tile.intensity;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(tile.col * tileW + tileW/2, tile.row * tileH + tileH/2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw connection lines between active tiles
  drawConnectionLines(ctx, tiles, tileW, tileH);

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
```

### Pattern 5: Initial State Snapshot on Connect
**What:** When a WebSocket client connects, send the current dashboard state (open positions, recent events) so the UI populates immediately.
**When to use:** Always -- clients connecting after startup need current state, not just future events.
**Example:**
```typescript
wss.on('connection', (ws) => {
  // Send current positions snapshot
  const positions = positionManager.getOpenPositions();
  ws.send(JSON.stringify({ type: 'snapshot', data: { positions } }));
});
```

### Anti-Patterns to Avoid
- **Polling REST endpoints instead of WebSocket:** Adds latency, wastes bandwidth, not real-time
- **Multiple WebSocket connections per panel:** One connection, route messages client-side
- **Putting frontend build tools in the pipeline:** No webpack/vite/esbuild -- just serve static files
- **Animating DOM elements for the grid:** DOM manipulation at 60fps causes layout thrashing; use Canvas
- **Sending raw pipeline internals to the client:** Transform/sanitize server-side before broadcasting

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket server | Custom TCP handling | `ws` library | Handles framing, ping/pong, close codes, binary, compression |
| WebSocket reconnection (client) | Manual retry logic | Simple reconnect wrapper (10 lines) | But do write this yourself -- it's just a setTimeout retry with backoff, no library needed |
| CSS theme system | Inline color strings | CSS custom properties (`--var`) | Single source of truth for colors, easy to tweak palette |
| Terminal auto-scroll | Complex scroll detection | `scrollTop`/`scrollHeight` check + `scrollIntoView` | Browser APIs handle this natively |
| Canvas scaling (HiDPI) | Ignore device pixel ratio | Set `canvas.width = canvas.clientWidth * devicePixelRatio` | Prevents blurry rendering on Retina/HiDPI displays |

**Key insight:** This dashboard has zero user interaction beyond viewing. No forms, no buttons that trigger actions, no state management. This means vanilla JS is not just acceptable -- it's optimal. The complexity is in the visual theater, not in application state.

## Common Pitfalls

### Pitfall 1: Express 5 + createServer integration
**What goes wrong:** Using `app.listen()` directly means you can't attach `ws` to the HTTP server.
**Why it happens:** Express 5 works the same as 4 here, but developers forget that `app.listen()` returns the server and try to create WebSocketServer separately.
**How to avoid:** Always use `const server = createServer(app)` and pass `server` to both `wss` and `server.listen()`.
**Warning signs:** WebSocket connections fail with 404 or upgrade errors.

### Pitfall 2: Canvas blurriness on HiDPI displays
**What goes wrong:** Canvas looks blurry on Retina/4K displays.
**Why it happens:** Canvas pixel buffer doesn't account for `devicePixelRatio`.
**How to avoid:** Set `canvas.width = canvas.clientWidth * devicePixelRatio` and `ctx.scale(devicePixelRatio, devicePixelRatio)`.
**Warning signs:** Grid tiles look soft/fuzzy instead of crisp.

### Pitfall 3: Terminal memory leak from unbounded log entries
**What goes wrong:** Terminal DOM grows indefinitely, browser slows down after hours.
**Why it happens:** Every event appends a DOM element, never removes old ones.
**How to avoid:** Cap terminal entries (e.g., keep last 500 lines, remove oldest when exceeded).
**Warning signs:** Page gets sluggish after running for extended periods.

### Pitfall 4: WebSocket message flood on price updates
**What goes wrong:** Price updates every 10 seconds for all positions flood the WebSocket.
**Why it happens:** `price:updated` fires frequently with the full price map.
**How to avoid:** Batch or throttle price broadcasts (e.g., max once per 5 seconds). Or only send deltas (changed prices).
**Warning signs:** Browser console shows rapid message stream, UI feels jittery.

### Pitfall 5: BIOS boot sequence blocks real data
**What goes wrong:** Boot animation plays but WebSocket events arrive during it and are lost.
**Why it happens:** Boot animation delays UI initialization but WebSocket connects immediately.
**How to avoid:** Queue WebSocket messages during boot sequence, replay them when boot completes.
**Warning signs:** Dashboard shows no positions after boot even though pipeline has active ones.

### Pitfall 6: Canvas animation loop running when tab is hidden
**What goes wrong:** Not actually a performance issue (browsers pause rAF in background tabs), but accumulated time delta causes animation jump when tab regains focus.
**Why it happens:** Delta time between frames is huge when resuming from background.
**How to avoid:** Cap delta time to a maximum (e.g., 100ms) to prevent animation spikes.
**Warning signs:** Tiles flash or jump when switching back to the dashboard tab.

### Pitfall 7: Idle chatter timing conflicts with real events
**What goes wrong:** Ambient "neural chatter" messages appear simultaneously with real trade events, cluttering the terminal.
**Why it happens:** Idle chatter timer fires independently of real events.
**How to avoid:** Reset idle timer on every real event. Only generate chatter after N seconds of no real events.
**Warning signs:** "monitoring coherence..." appears right next to "EXECUTING BUY" making it look fake.

## Code Examples

### WebSocket Client with Reconnection
```javascript
// public/js/app.js
function connectWebSocket() {
  const ws = new WebSocket(`ws://${location.host}`);
  let reconnectDelay = 1000;

  ws.onopen = () => {
    reconnectDelay = 1000; // Reset on successful connect
    console.log('[WS] Connected');
  };

  ws.onclose = () => {
    console.log(`[WS] Disconnected, reconnecting in ${reconnectDelay}ms`);
    setTimeout(connectWebSocket, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    routeMessage(msg);
  };

  return ws;
}
```

### CSS Custom Properties Theme System
```css
/* public/css/main.css */
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-panel: #1a1a2e;
  --border: #2a2a3e;
  --text-primary: #e0e0e8;
  --text-secondary: #8888a0;
  --text-dim: #555570;
  --accent-teal: #00d4aa;
  --accent-blue: #4488ff;
  --accent-pink: #ff4488;
  --accent-olive: #88aa44;
  --accent-red: #ff3333;
  --accent-green: #33ff88;
  --glow-teal: 0 0 8px rgba(0, 212, 170, 0.4);
  --glow-pink: 0 0 8px rgba(255, 68, 136, 0.4);
  --font-mono: 'VT323', 'Courier New', monospace;
  --font-ui: 'Inter', -apple-system, sans-serif;
}
```

### Three-Column CSS Grid Layout
```css
.dashboard {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr; /* neuron | positions | terminal */
  grid-template-rows: auto 1fr;
  gap: 2px;
  height: 100vh;
  background: var(--bg-primary);
}

.status-bar {
  grid-column: 1 / -1; /* spans all columns */
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

/* Mobile: stack columns */
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
    grid-template-rows: auto 300px 1fr 300px;
  }
}
```

### BIOS Boot Sequence
```javascript
// public/js/boot.js
const BOOT_LINES = [
  { text: 'CL1 BIOS v2.4.1 -- Cortical Labs Neural Interface', delay: 200 },
  { text: 'Initializing MEA substrate...', delay: 300 },
  { text: 'Electrode array: 64 channels detected', delay: 150 },
  { text: 'Running POST diagnostics...', delay: 400 },
  { text: '  Memory: 131072 synaptic weights OK', delay: 100 },
  { text: '  Coherence baseline: calibrating...', delay: 300 },
  { text: '  Entropy sensor: nominal', delay: 100 },
  { text: '  Firing rate: 0.00 Hz (standby)', delay: 100 },
  { text: 'Loading neural culture profile...', delay: 500 },
  { text: 'Culture age: 14 DIV -- maturation stage: ACTIVE', delay: 200 },
  { text: 'Connecting to Solana mainnet-beta...', delay: 400 },
  { text: 'Pipeline handshake: OK', delay: 200 },
  { text: 'CL1 online. Autonomous trading mode engaged.', delay: 300 },
];

async function playBootSequence(container) {
  container.style.display = 'flex';
  for (const line of BOOT_LINES) {
    await sleep(line.delay);
    const el = document.createElement('div');
    el.className = 'boot-line';
    el.textContent = line.text;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }
  await sleep(500);
  container.style.display = 'none';
}
```

### Terminal with Auto-Scroll and Idle Chatter
```javascript
// public/js/terminal.js
const MAX_LINES = 500;
const IDLE_TIMEOUT = 8000; // 8s before idle chatter starts
const IDLE_INTERVAL = 3000; // 3s between idle messages

const IDLE_MESSAGES = [
  'monitoring coherence baseline...',
  'scanning mempool activity...',
  'electrode drift: nominal',
  'culture health: stable',
  'entropy within bounds',
  'synaptic noise floor: low',
  'awaiting signal cascade...',
  'baseline oscillation: theta range',
];

let lastEventTime = Date.now();
let userScrolled = false;

function appendLine(text, className) {
  const container = document.getElementById('terminal');
  const line = document.createElement('div');
  line.className = `term-line ${className || ''}`;
  line.textContent = `[${timestamp()}] ${text}`;
  container.appendChild(line);

  // Trim old entries
  while (container.children.length > MAX_LINES) {
    container.removeChild(container.firstChild);
  }

  // Auto-scroll if user hasn't scrolled up
  if (!userScrolled) {
    container.scrollTop = container.scrollHeight;
  }

  lastEventTime = Date.now();
}
```

### Biological Stat Derivation (CL1-01)
```javascript
// public/js/bio-stats.js
// Stats derived from real trading data, not random noise

const stats = {
  neurons: 64,          // Fixed: electrode count
  coherence: 0.72,      // Derived from win rate trend (smoothed)
  entropy: 0.45,        // Derived from price volatility across positions
  firingRate: 0.0,      // Derived from event frequency (events per minute)
  winRate: 0.0,         // Actual win rate from closed positions
};

// Coherence: smoothed win rate (EMA over last 20 trades)
// Rises when winning, drops when losing -- feels like "neural sync"
function updateCoherence(tradeWon) {
  const alpha = 0.1; // smoothing factor
  stats.coherence = stats.coherence * (1 - alpha) + (tradeWon ? 1.0 : 0.3) * alpha;
}

// Entropy: derived from price volatility
// High volatility = high entropy = "neural instability"
function updateEntropy(priceChangePcts) {
  const avgVolatility = priceChangePcts.reduce((a, b) => a + Math.abs(b), 0) / priceChangePcts.length;
  stats.entropy = Math.min(1.0, avgVolatility / 10); // normalize to 0-1
}

// Firing rate: events per minute (rolling 60s window)
const eventTimestamps = [];
function recordEvent() {
  const now = Date.now();
  eventTimestamps.push(now);
  // Trim older than 60s
  while (eventTimestamps.length > 0 && eventTimestamps[0] < now - 60000) {
    eventTimestamps.shift();
  }
  stats.firingRate = eventTimestamps.length; // events in last 60s
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Socket.IO for everything | `ws` for server-to-client push | ws has dominated since 2020 | No need for fallback transports, all browsers support WebSocket |
| jQuery DOM manipulation | Vanilla JS with `querySelector` | ES6+ era | No jQuery dependency needed |
| Separate frontend dev server | Express serves static files | Always valid for monoliths | Single process, single port, simpler deployment |
| CSS floats for layout | CSS Grid | 2017+ full browser support | Native three-column layout with named areas |
| setInterval for animation | requestAnimationFrame | 2012+ | Browser-synchronized, pauses in background tabs |

**Deprecated/outdated:**
- Socket.IO: Overkill when you only need server-to-client WebSocket push
- express-ws: Monkey-patches Express internals, fragile with Express 5
- jQuery: No benefit over vanilla JS for this use case

## Open Questions

1. **Font loading for VT323**
   - What we know: Google Fonts hosts VT323, free monospace terminal font
   - What's unclear: Whether to self-host the font file or use Google Fonts CDN
   - Recommendation: Self-host the woff2 file in `public/fonts/` for reliability and to avoid external dependencies. Download from Google Fonts.

2. **Exact MEA grid dimensions**
   - What we know: CL1 reference screenshots show colored square tiles in a grid
   - What's unclear: Exact grid size (8x8? 10x10? Irregular?)
   - Recommendation: Start with 8x8 (64 electrodes, matching "neurons: 64" stat). Adjust based on visual feel. This is Claude's discretion per CONTEXT.md.

3. **WebSocket message format versioning**
   - What we know: JSON messages with `{ type, data, ts }`
   - What's unclear: Whether to version the protocol for future changes
   - Recommendation: Keep it simple, no versioning for v1. Add a `v` field later if needed.

## Sources

### Primary (HIGH confidence)
- [ws GitHub repository](https://github.com/websockets/ws) -- broadcast pattern, heartbeat, API documentation
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) -- animation loop best practices
- [MDN CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout) -- three-column layout patterns
- Existing codebase: `src/core/events.ts`, `src/core/types.ts`, `src/server/index.ts` -- event types, server structure

### Secondary (MEDIUM confidence)
- [OneUpTime Express WebSocket Guide (Feb 2026)](https://oneuptime.com/blog/post/2026-02-02-express-websockets/view) -- Express 5 + ws integration
- [Better Stack Express WebSocket Guide](https://betterstack.com/community/guides/scaling-nodejs/express-websockets/) -- connection management patterns
- [CSS Grid Admin Dashboard (Max Bock)](https://mxb.dev/blog/css-grid-admin-dashboard/) -- dashboard layout approach

### Tertiary (LOW confidence)
- [DEV Community CRT Terminal](https://dev.to/ekeijl/retro-crt-terminal-screen-in-css-js-4afh) -- CRT/terminal CSS effects (scanlines, flicker)
- [PranxWorld BIOS screens](https://pranxworld.com/blog/startup-screen-shutdown-pranks) -- BIOS POST sequence inspiration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- ws is the de facto WebSocket library, vanilla JS for static dashboard is proven
- Architecture: HIGH -- Express static serving + ws on same port is well-documented and widely used
- Canvas animation: HIGH -- requestAnimationFrame + Canvas 2D for grid rendering is standard
- CL1 theater (boot sequence, bio-stats): MEDIUM -- Custom creative work, no established patterns to follow. Code examples are recommendations based on the requirements.
- Pitfalls: HIGH -- All pitfalls are well-known issues with WebSocket dashboards

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable technologies, 30-day validity)
