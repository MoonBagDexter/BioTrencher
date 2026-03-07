/* CL1 Dashboard - WebSocket Client & Message Router */

(function () {
  'use strict';

  var messageQueue = [];
  var bootComplete = false;
  var ws = null;
  var reconnectDelay = 1000;

  // --- WebSocket Connection ---

  function connectWebSocket() {
    var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(protocol + '//' + location.host);

    ws.onopen = function () {
      console.log('[WS] Connected');
      reconnectDelay = 1000;
      updateConnectionDot(true);
    };

    ws.onclose = function () {
      console.log('[WS] Disconnected, reconnecting in ' + reconnectDelay + 'ms');
      updateConnectionDot(false);
      setTimeout(connectWebSocket, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };

    ws.onerror = function () {
      // Error handling done via onclose
    };

    ws.onmessage = function (event) {
      var msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        console.warn('[WS] Invalid message:', event.data);
        return;
      }

      if (!bootComplete) {
        messageQueue.push(msg);
      } else {
        routeMessage(msg);
      }
    };
  }

  // --- Message Router ---

  function routeMessage(msg) {
    switch (msg.type) {
      case 'snapshot':
        console.log('[WS] snapshot', msg.data);
        // Handlers will be added by plans 02/03:
        // if (typeof Positions !== 'undefined') Positions.handleSnapshot(msg.data);
        break;

      case 'position:opened':
      case 'position:updated':
      case 'position:closed':
        console.log('[WS]', msg.type, msg.data);
        // if (typeof Positions !== 'undefined') Positions.handleMessage(msg);
        // if (typeof NeuronGrid !== 'undefined') NeuronGrid.handleMessage(msg);
        // if (typeof Terminal !== 'undefined') Terminal.handleMessage(msg);
        break;

      case 'signal:detected':
      case 'signal:validated':
      case 'signal:rejected':
      case 'trade:executed':
        console.log('[WS]', msg.type, msg.data);
        // if (typeof Terminal !== 'undefined') Terminal.handleMessage(msg);
        // if (typeof NeuronGrid !== 'undefined') NeuronGrid.handleMessage(msg);
        break;

      case 'price:updated':
        console.log('[WS]', msg.type, msg.data);
        // if (typeof Stats !== 'undefined') Stats.handleMessage(msg);
        // if (typeof Positions !== 'undefined') Positions.handlePriceUpdate(msg.data);
        break;

      default:
        console.log('[WS] Unknown message type:', msg.type, msg.data);
    }
  }

  function drainQueue() {
    for (var i = 0; i < messageQueue.length; i++) {
      routeMessage(messageQueue[i]);
    }
    messageQueue.length = 0;
  }

  // --- Connection Status Indicator ---

  function updateConnectionDot(connected) {
    var dot = document.getElementById('ws-dot');
    if (!dot) return;
    if (connected) {
      dot.classList.add('connected');
    } else {
      dot.classList.remove('connected');
    }
  }

  // --- Init ---

  document.addEventListener('DOMContentLoaded', function () {
    var dashboard = document.getElementById('dashboard');

    Boot.onComplete = function () {
      bootComplete = true;
      if (dashboard) {
        dashboard.classList.remove('hidden');
      }
      drainQueue();
    };

    Boot.play();
    connectWebSocket();
  });
})();
