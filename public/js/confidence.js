/* CL1 Dashboard - Neural Confidence Calculation per Position */

var Confidence = (function () {
  'use strict';

  /**
   * Calculate confidence score (0-100) for a position based on:
   * - Price momentum (40%): PNL % mapped to confidence
   * - Time held (30%): peaks at 5-15min, decays after 30min
   * - Volume proxy (30%): firing rate from BioStats
   */
  function calculate(position) {
    if (!position) return 0;

    // --- Price Momentum (40% weight) ---
    var pnlPct = position.pnlPct || 0;
    // Map PNL from [-50%, +200%] to [0, 1]
    var momentum = (pnlPct + 50) / 250;
    momentum = Math.max(0, Math.min(1, momentum));

    // --- Time Held Factor (30% weight) ---
    var now = Date.now();
    var openedAt = position.openedAt || now;
    var heldMinutes = (now - openedAt) / 60000;
    var timeFactor;
    if (heldMinutes <= 10) {
      // Rise from 0 to 1 over 0-10 minutes
      timeFactor = heldMinutes / 10;
    } else if (heldMinutes <= 20) {
      // Hold at 1.0
      timeFactor = 1.0;
    } else if (heldMinutes <= 30) {
      // Decay from 1.0 toward 0.5
      timeFactor = 1.0 - (heldMinutes - 20) / 20;
    } else {
      // After 30min, decay toward 0.3
      timeFactor = Math.max(0.3, 0.5 - (heldMinutes - 30) / 100);
    }
    timeFactor = Math.max(0, Math.min(1, timeFactor));

    // --- Volume Proxy (30% weight) ---
    var firingRate = 0;
    if (typeof BioStats !== 'undefined') {
      var stats = BioStats.getStats();
      firingRate = stats.firingRate || 0;
    }
    // Normalize: firingRate/60 capped at 1.0
    var volumeFactor = Math.min(firingRate / 60, 1.0);

    // --- Combined ---
    var combined = momentum * 0.4 + timeFactor * 0.3 + volumeFactor * 0.3;
    return Math.max(0, Math.min(100, Math.round(combined * 100)));
  }

  return {
    calculate: calculate
  };
})();
