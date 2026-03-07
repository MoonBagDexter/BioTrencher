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
        if (typeof Positions !== 'undefined') Positions.handleMessage(msg);
        if (typeof Terminal !== 'undefined') Terminal.handleMessage(msg);
        if (typeof NeuronGrid !== 'undefined') NeuronGrid.handleMessage(msg);
        break;

      case 'signal:detected':
      case 'signal:validated':
      case 'signal:rejected':
        if (typeof Terminal !== 'undefined') Terminal.handleMessage(msg);
        if (typeof NeuronGrid !== 'undefined') NeuronGrid.handleMessage(msg);
        if (typeof BioStats !== 'undefined') BioStats.handleMessage(msg);
        break;

      case 'trade:executed':
        if (typeof Terminal !== 'undefined') Terminal.handleMessage(msg);
        if (typeof NeuronGrid !== 'undefined') NeuronGrid.handleMessage(msg);
        if (typeof BioStats !== 'undefined') BioStats.handleMessage(msg);
        break;

      case 'position:opened':
      case 'position:updated':
        if (typeof Positions !== 'undefined') Positions.handleMessage(msg);
        if (typeof BioStats !== 'undefined') BioStats.handleMessage(msg);
        break;

      case 'position:closed':
        if (typeof Positions !== 'undefined') Positions.handleMessage(msg);
        if (typeof Terminal !== 'undefined') Terminal.handleMessage(msg);
        if (typeof NeuronGrid !== 'undefined') NeuronGrid.handleMessage(msg);
        if (typeof BioStats !== 'undefined') BioStats.handleMessage(msg);
        break;

      case 'price:updated':
        if (typeof Positions !== 'undefined') Positions.handleMessage(msg);
        if (typeof BioStats !== 'undefined') BioStats.handleMessage(msg);
        if (typeof NeuronGrid !== 'undefined') NeuronGrid.handleMessage(msg);
        if (typeof Stats !== 'undefined') Stats.update();
        break;

      default:
        break;
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

    // Initialize all panel modules
    if (typeof NeuronGrid !== 'undefined') NeuronGrid.init();
    if (typeof Stats !== 'undefined') Stats.init();
    if (typeof Positions !== 'undefined') Positions.init();
    if (typeof Terminal !== 'undefined') Terminal.init();

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
