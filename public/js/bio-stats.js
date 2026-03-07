/* CL1 Dashboard - Biological Stats Derivation from Trading Data */

var BioStats = (function () {
  'use strict';

  var state = {
    neurons: 64,
    coherence: 0.72,
    entropy: 0.45,
    firingRate: 0,
    winRate: 0
  };

  var closedWins = 0;
  var closedTotal = 0;
  var eventTimestamps = [];
  var previousPrices = {};

  function recordEvent() {
    var now = Date.now();
    eventTimestamps.push(now);
    // Trim older than 60s
    var cutoff = now - 60000;
    while (eventTimestamps.length > 0 && eventTimestamps[0] < cutoff) {
      eventTimestamps.shift();
    }
    state.firingRate = eventTimestamps.length;
  }

  function updateCoherence(tradeWon) {
    var alpha = 0.1;
    var target = tradeWon ? 1.0 : 0.0;
    state.coherence = state.coherence * (1 - alpha) + target * alpha;
    state.coherence = Math.max(0, Math.min(1, state.coherence));
  }

  function updateEntropy(priceChangePcts) {
    if (!priceChangePcts || priceChangePcts.length === 0) return;
    var sum = 0;
    for (var i = 0; i < priceChangePcts.length; i++) {
      sum += Math.abs(priceChangePcts[i]);
    }
    var avg = sum / priceChangePcts.length;
    // Normalize: 0-10% average change maps to 0-1
    var normalized = Math.min(avg / 10, 1);
    // EMA smooth
    state.entropy = state.entropy * 0.9 + normalized * 0.1;
    state.entropy = Math.max(0, Math.min(1, state.entropy));
  }

  function updateWinRate(won) {
    closedTotal++;
    if (won) closedWins++;
    state.winRate = closedTotal > 0 ? closedWins / closedTotal : 0;
  }

  function getStats() {
    return {
      neurons: state.neurons,
      coherence: state.coherence,
      entropy: state.entropy,
      firingRate: state.firingRate,
      winRate: state.winRate
    };
  }

  function handleMessage(msg) {
    recordEvent();

    switch (msg.type) {
      case 'position:closed':
        if (msg.data) {
          var won = (msg.data.pnlPct || 0) > 0;
          updateCoherence(won);
          updateWinRate(won);
        }
        break;

      case 'price:updated':
        if (msg.data && msg.data.prices) {
          var changes = [];
          var prices = msg.data.prices;
          for (var mint in prices) {
            if (prices.hasOwnProperty(mint) && previousPrices[mint]) {
              var prev = previousPrices[mint];
              var curr = prices[mint];
              if (prev > 0) {
                changes.push(((curr - prev) / prev) * 100);
              }
            }
            previousPrices[mint] = prices[mint];
          }
          if (changes.length > 0) {
            updateEntropy(changes);
          }
        }
        break;
    }

    // Notify Stats to update after any change
    if (typeof Stats !== 'undefined' && Stats.update) {
      Stats.update();
    }
  }

  // Slow drift: tiny random walk to feel alive
  setInterval(function () {
    state.coherence += (Math.random() - 0.5) * 0.01;
    state.coherence = Math.max(0, Math.min(1, state.coherence));
    state.entropy += (Math.random() - 0.5) * 0.016;
    state.entropy = Math.max(0, Math.min(1, state.entropy));

    if (typeof Stats !== 'undefined' && Stats.update) {
      Stats.update();
    }
  }, 2000);

  return {
    handleMessage: handleMessage,
    getStats: getStats,
    recordEvent: recordEvent,
    updateCoherence: updateCoherence,
    updateEntropy: updateEntropy,
    updateWinRate: updateWinRate
  };
})();
