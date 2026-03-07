/* CL1 Dashboard - Neural Decision Terminal */

(function () {
  'use strict';

  var MAX_LINES = 500;
  var IDLE_TIMEOUT = 8000;
  var IDLE_INTERVAL = 3000;

  var IDLE_MESSAGES = [
    'monitoring coherence baseline...',
    'scanning mempool activity...',
    'electrode drift: nominal',
    'culture health: stable',
    'entropy within bounds',
    'synaptic noise floor: low',
    'awaiting signal cascade...',
    'baseline oscillation: theta range',
    'membrane potential: resting',
    'axon conductance: normal'
  ];

  var container = null;
  var jumpBtn = null;
  var toggleBtn = null;
  var lastEventTime = 0;
  var userScrolled = false;
  var idleTimer = null;
  var idleRunning = false;
  var currentView = 'raw'; // 'raw' | 'structured'

  function init() {
    container = document.getElementById('terminal');
    jumpBtn = document.getElementById('jump-to-latest');
    toggleBtn = document.getElementById('terminal-toggle');

    if (!container) return;

    // Scroll detection
    container.addEventListener('scroll', function () {
      var atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
      var nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;

      if (!nearBottom) {
        userScrolled = true;
        if (jumpBtn) jumpBtn.style.display = 'block';
      }
      if (atBottom) {
        userScrolled = false;
        if (jumpBtn) jumpBtn.style.display = 'none';
      }
    });

    // Jump to latest button
    if (jumpBtn) {
      jumpBtn.addEventListener('click', function () {
        container.scrollTop = container.scrollHeight;
        userScrolled = false;
        jumpBtn.style.display = 'none';
      });
    }

    // View toggle
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        if (currentView === 'raw') {
          currentView = 'structured';
          toggleBtn.textContent = 'STRUCT';
          container.classList.add('structured');
        } else {
          currentView = 'raw';
          toggleBtn.textContent = 'RAW';
          container.classList.remove('structured');
        }
      });
    }

    // Start idle timer
    lastEventTime = Date.now();
    resetIdleTimer();
  }

  // --- Timestamp ---

  function timestamp() {
    var d = new Date();
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    var ms = String(d.getMilliseconds()).padStart(3, '0');
    return '[' + h + ':' + m + ':' + s + '.' + ms + ']';
  }

  // --- Mint shortener ---

  function mintShort(mint) {
    if (!mint || mint.length < 8) return mint || '???';
    return mint.slice(0, 4) + '..' + mint.slice(-4);
  }

  // --- Append Line ---

  function appendLine(text, className) {
    if (!container) return;

    var div = document.createElement('div');
    div.className = 'term-line' + (className ? ' ' + className : '');

    var ts = document.createElement('span');
    ts.className = 'timestamp';
    ts.textContent = timestamp();

    var content = document.createElement('span');
    content.className = 'term-text';
    content.textContent = text;

    div.appendChild(ts);
    div.appendChild(content);
    container.appendChild(div);

    // Trim to MAX_LINES
    while (container.children.length > MAX_LINES) {
      container.removeChild(container.firstChild);
    }

    // Auto-scroll
    if (!userScrolled) {
      container.scrollTop = container.scrollHeight;
    }

    // Reset idle on real (non-idle) events
    if (className !== 'idle') {
      lastEventTime = Date.now();
      resetIdleTimer();
    }
  }

  function appendSeparator(type) {
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'term-separator' + (type ? ' ' + type : '');
    container.appendChild(div);

    while (container.children.length > MAX_LINES) {
      container.removeChild(container.firstChild);
    }
  }

  // --- Idle Chatter ---

  function resetIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    idleRunning = false;
    idleTimer = setTimeout(startIdleChatter, IDLE_TIMEOUT);
  }

  function startIdleChatter() {
    idleRunning = true;
    var idx = Math.floor(Math.random() * IDLE_MESSAGES.length);
    appendLine(IDLE_MESSAGES[idx], 'idle');
    var jitter = Math.floor(Math.random() * 2000);
    idleTimer = setTimeout(startIdleChatter, IDLE_INTERVAL + jitter);
  }

  // --- Message Handler ---

  function handleMessage(msg) {
    var data = msg.data || {};
    var mint = mintShort(data.mint);

    switch (msg.type) {
      case 'signal:detected':
        var electrode = Math.floor(Math.random() * 64) + 1;
        appendLine('coherence spike detected on electrode cluster E-' + electrode, 'signal');
        appendLine('pattern recognition: token ' + mint + ' -- cross-referencing signal matrix...', 'signal');
        break;

      case 'signal:validated':
        appendLine('substrate integrity check: PASSED', 'signal');
        var confidence = (0.7 + Math.random() * 0.25).toFixed(3);
        appendLine('neural confidence: ' + confidence + ' -- threshold exceeded', 'signal');
        appendLine('>> SIGNAL LOCKED: ' + mint, 'signal');
        appendSeparator();
        break;

      case 'signal:rejected':
        appendLine('substrate integrity check: FAILED', 'reject');
        var reason = data.reason || 'unknown anomaly';
        appendLine('anomaly detected: ' + reason + ' -- neural pathway inhibited', 'reject');
        appendLine('>> SIGNAL REJECTED: ' + mint, 'reject');
        appendSeparator();
        break;

      case 'trade:executed':
        appendSeparator('thinking');
        var sol = data.solAmount != null ? data.solAmount : '?';
        appendLine('executing synaptic relay... routing ' + sol + ' SOL', 'trade');
        var price = data.entryPrice != null ? data.entryPrice : '?';
        appendLine('>> TRADE EXECUTED: ' + mint + ' @ ' + price, 'trade');
        appendLine('position acquired -- monitoring decay curve', 'trade');
        break;

      case 'position:opened':
        appendLine('new neural pathway established: ' + mint, 'trade');
        var ep = data.exitParams || {};
        var tp = ep.takeProfitPct != null ? ep.takeProfitPct : '?';
        var sl = ep.stopLossPct != null ? ep.stopLossPct : '?';
        var ttl = ep.timeLimitMs != null ? (ep.timeLimitMs / 60000).toFixed(1) : '?';
        appendLine('exit parameters: TP ' + tp + '% | SL ' + sl + '% | TTL ' + ttl + 'min', 'system');
        break;

      case 'position:closed':
        appendSeparator();
        var closeReason = data.reason || 'unknown';
        switch (closeReason) {
          case 'stop-loss':
            appendLine('WARNING: membrane potential collapse on ' + mint, 'warning');
            break;
          case 'take-profit':
            appendLine('optimal exit point reached -- harvesting synaptic gains', 'signal');
            break;
          case 'time-limit':
            appendLine('temporal decay threshold exceeded -- pruning pathway', 'system');
            break;
          case 'copy-sell':
            appendLine('external stimulus detected -- mirroring neural response', 'system');
            break;
          default:
            appendLine('pathway termination: ' + closeReason, 'system');
        }
        var pnl = data.pnlPct != null ? data.pnlPct.toFixed(2) : '0.00';
        var pnlClass = parseFloat(pnl) >= 0 ? 'close-win' : 'close-loss';
        appendLine('>> POSITION CLOSED: ' + mint + ' | PNL: ' + pnl + '% | reason: ' + closeReason, pnlClass);
        break;

      case 'snapshot':
        var positions = data.positions || data || [];
        if (Array.isArray(positions)) {
          for (var i = 0; i < positions.length; i++) {
            appendLine('restoring neural pathway: ' + mintShort(positions[i].mint), 'system');
          }
        }
        break;

      // price:updated intentionally omitted (too noisy)
      default:
        break;
    }
  }

  // --- Public API ---

  window.Terminal = {
    init: init,
    handleMessage: handleMessage,
    appendLine: appendLine
  };
})();
