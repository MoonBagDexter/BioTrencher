/* CL1 Dashboard - Positions Panel DOM Renderer with Confidence Bars */

var Positions = (function () {
  'use strict';

  var container = null;
  var positionsMap = {};
  var confidenceInterval = null;

  function init() {
    container = document.getElementById('positions-list');
    render();
    // Recalculate confidence every 2s
    confidenceInterval = setInterval(function () {
      render();
    }, 2000);
  }

  function handleMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'snapshot':
        positionsMap = {};
        if (msg.data && msg.data.positions) {
          var positions = msg.data.positions;
          for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            if (p.status === 'open') {
              positionsMap[p.mint] = p;
            }
          }
        }
        render();
        break;

      case 'position:opened':
        if (msg.data) {
          positionsMap[msg.data.mint] = msg.data;
          render();
        }
        break;

      case 'position:updated':
        if (msg.data && positionsMap[msg.data.mint]) {
          // Merge update into existing
          var existing = positionsMap[msg.data.mint];
          for (var key in msg.data) {
            if (msg.data.hasOwnProperty(key)) {
              existing[key] = msg.data[key];
            }
          }
          render();
        }
        break;

      case 'position:closed':
        if (msg.data && msg.data.mint) {
          // Fade out animation
          var card = container && container.querySelector('[data-mint="' + msg.data.mint + '"]');
          if (card) {
            card.style.opacity = '0';
            setTimeout(function () {
              delete positionsMap[msg.data.mint];
              render();
            }, 300);
          } else {
            delete positionsMap[msg.data.mint];
            render();
          }
        }
        break;

      case 'price:updated':
        // Update current prices from price broadcast
        if (msg.data && msg.data.prices) {
          var changed = false;
          for (var mint in msg.data.prices) {
            if (msg.data.prices.hasOwnProperty(mint) && positionsMap[mint]) {
              var pos = positionsMap[mint];
              pos.currentPrice = msg.data.prices[mint];
              if (pos.entryPrice > 0) {
                pos.pnlPct = ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
              }
              changed = true;
            }
          }
          if (changed) render();
        }
        break;
    }
  }

  function shortenMint(mint) {
    if (!mint || mint.length < 8) return mint || '???';
    return mint.slice(0, 4) + '...' + mint.slice(-4);
  }

  function formatPrice(price) {
    if (!price || price === 0) return '0';
    if (price < 0.0001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  }

  function getConfidenceColor(confidence) {
    // Gradient: red (0%) -> yellow (50%) -> teal (100%)
    if (confidence <= 50) {
      var ratio = confidence / 50;
      var r = Math.round(255);
      var g = Math.round(ratio * 200);
      var b = Math.round(50 - ratio * 50);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } else {
      var ratio2 = (confidence - 50) / 50;
      var r2 = Math.round(255 * (1 - ratio2));
      var g2 = Math.round(200 + ratio2 * 12);
      var b2 = Math.round(ratio2 * 170);
      return 'rgb(' + r2 + ',' + g2 + ',' + b2 + ')';
    }
  }

  function render() {
    if (!container) return;

    var mints = Object.keys(positionsMap);

    if (mints.length === 0) {
      container.innerHTML = '<div class="positions-empty">No active positions -- awaiting signal cascade...</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < mints.length; i++) {
      var mint = mints[i];
      var pos = positionsMap[mint];
      var pnl = pos.pnlPct || 0;
      var pnlClass = pnl >= 0 ? 'positive' : 'negative';
      var pnlSign = pnl >= 0 ? '+' : '';
      var confidence = typeof Confidence !== 'undefined' ? Confidence.calculate(pos) : 50;
      var confColor = getConfidenceColor(confidence);
      var highConf = confidence > 75 ? ' high-confidence' : '';

      html += '<div class="position-card" data-mint="' + mint + '">';
      html += '  <div class="mint">' + shortenMint(mint) + '</div>';
      html += '  <div class="price-row">';
      html += '    <span>Entry: ' + formatPrice(pos.entryPrice) + ' SOL</span>';
      html += '    <span>Now: ' + formatPrice(pos.currentPrice) + ' SOL</span>';
      html += '    <span class="pnl ' + pnlClass + '">' + pnlSign + pnl.toFixed(1) + '%</span>';
      html += '  </div>';
      html += '  <div class="confidence-bar">';
      html += '    <div class="confidence-fill' + highConf + '" style="width:' + confidence + '%;background:' + confColor + '">';
      html += '      ' + confidence + '%';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    }

    container.innerHTML = html;
  }

  return {
    init: init,
    handleMessage: handleMessage
  };
})();
