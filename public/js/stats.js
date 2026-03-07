/* CL1 Dashboard - Status Bar Stat Display Manager */

var Stats = (function () {
  'use strict';

  var els = {};
  var prevValues = {};

  function init() {
    els.neurons = document.getElementById('stat-neurons');
    els.coherence = document.getElementById('stat-coherence');
    els.entropy = document.getElementById('stat-entropy');
    els.firingRate = document.getElementById('stat-firing-rate');
    els.winRate = document.getElementById('stat-win-rate');
    prevValues = { neurons: 0, coherence: 0, entropy: 0, firingRate: 0, winRate: 0 };
    update();
    // Periodic refresh every 1s
    setInterval(update, 1000);
  }

  function update() {
    if (typeof BioStats === 'undefined') return;
    var stats = BioStats.getStats();

    if (els.neurons) {
      els.neurons.textContent = stats.neurons;
    }

    if (els.coherence) {
      var cVal = stats.coherence.toFixed(2);
      els.coherence.textContent = cVal;
      pulseIfChanged('coherence', stats.coherence);
    }

    if (els.entropy) {
      var eVal = stats.entropy.toFixed(2);
      els.entropy.textContent = eVal;
      pulseIfChanged('entropy', stats.entropy);
    }

    if (els.firingRate) {
      els.firingRate.textContent = Math.round(stats.firingRate) + ' Hz';
      pulseIfChanged('firingRate', stats.firingRate);
    }

    if (els.winRate) {
      els.winRate.textContent = Math.round(stats.winRate * 100) + '%';
      pulseIfChanged('winRate', stats.winRate);
    }
  }

  function pulseIfChanged(key, newVal) {
    if (!els[key]) return;
    var prev = prevValues[key] || 0;
    var change = Math.abs(newVal - prev);
    var threshold = Math.max(Math.abs(prev) * 0.05, 0.01);
    if (change > threshold) {
      els[key].classList.add('stat-pulse');
      setTimeout(function () {
        if (els[key]) els[key].classList.remove('stat-pulse');
      }, 400);
    }
    prevValues[key] = newVal;
  }

  return {
    init: init,
    update: update
  };
})();
