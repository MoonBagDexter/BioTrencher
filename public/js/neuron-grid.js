/* CL1 Dashboard - MEA Neuron Grid Canvas Visualization */

var NeuronGrid = (function () {
  'use strict';

  var canvas = null;
  var ctx = null;
  var tiles = [];
  var GRID_SIZE = 8;
  var TOTAL_TILES = GRID_SIZE * GRID_SIZE;
  var lastTime = 0;
  var ambientTimer = 0;
  var running = false;

  // Tile type distribution
  var TYPE_COLORS = {
    autonomous: '#00d4aa',
    stimulated: '#88aa44',
    accent: '#ff4488'
  };

  function init() {
    canvas = document.getElementById('neuron-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    buildTiles();
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(tick);
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);
  }

  function buildTiles() {
    tiles = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var roll = Math.random();
        var type = roll < 0.7 ? 'autonomous' : (roll < 0.9 ? 'stimulated' : 'accent');
        tiles.push({
          col: c,
          row: r,
          baseColor: TYPE_COLORS[type],
          intensity: 0.2 + Math.random() * 0.3,
          targetIntensity: 0.2 + Math.random() * 0.3,
          type: type
        });
      }
    }
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return { r: r, g: g, b: b };
  }

  function tick(now) {
    if (!running) return;
    var dt = now - lastTime;
    if (dt > 100) dt = 100; // cap delta to prevent tab-switch jumps
    lastTime = now;

    update(dt);
    draw();
    requestAnimationFrame(tick);
  }

  function update(dt) {
    var lerpRate = 0.05;

    // Lerp intensities
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      t.intensity += (t.targetIntensity - t.intensity) * lerpRate;
    }

    // Ambient drift: every ~2s bump 3-5 random tiles
    ambientTimer += dt;
    if (ambientTimer > 2000) {
      ambientTimer = 0;
      var count = 3 + Math.floor(Math.random() * 3);
      for (var j = 0; j < count; j++) {
        var idx = Math.floor(Math.random() * TOTAL_TILES);
        tiles[idx].targetIntensity = 0.3 + Math.random() * 0.3;
      }
    }

    // Slowly decay tiles back to low baseline
    for (var k = 0; k < tiles.length; k++) {
      if (tiles[k].targetIntensity > 0.25) {
        tiles[k].targetIntensity -= 0.001 * (dt / 16);
      }
    }
  }

  function draw() {
    if (!canvas || !ctx) return;
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    var padX = 12;
    var padY = 12;
    var gap = 3;
    var tileW = (w - padX * 2 - gap * (GRID_SIZE - 1)) / GRID_SIZE;
    var tileH = (h - padY * 2 - gap * (GRID_SIZE - 1)) / GRID_SIZE;

    // Draw connection lines between active tiles
    ctx.lineWidth = 1;
    for (var i = 0; i < tiles.length; i++) {
      if (tiles[i].intensity < 0.5) continue;
      for (var j = i + 1; j < tiles.length; j++) {
        if (tiles[j].intensity < 0.5) continue;
        var dc = Math.abs(tiles[i].col - tiles[j].col);
        var dr = Math.abs(tiles[i].row - tiles[j].row);
        if (dc <= 2 && dr <= 2 && (dc + dr) > 0) {
          var x1 = padX + tiles[i].col * (tileW + gap) + tileW / 2;
          var y1 = padY + tiles[i].row * (tileH + gap) + tileH / 2;
          var x2 = padX + tiles[j].col * (tileW + gap) + tileW / 2;
          var y2 = padY + tiles[j].row * (tileH + gap) + tileH / 2;
          ctx.strokeStyle = 'rgba(0, 212, 170, 0.15)';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Draw tiles
    for (var t = 0; t < tiles.length; t++) {
      var tile = tiles[t];
      var x = padX + tile.col * (tileW + gap);
      var y = padY + tile.row * (tileH + gap);
      var rgb = hexToRgb(tile.baseColor);

      // Filled rect with alpha based on intensity
      ctx.globalAlpha = 0.15 + tile.intensity * 0.85;
      ctx.fillStyle = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
      ctx.fillRect(x, y, tileW, tileH);

      // Electrode dot at center
      ctx.globalAlpha = tile.intensity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + tileW / 2, y + tileH / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function handleMessage(msg) {
    if (!tiles.length) return;
    var type = msg.type;

    switch (type) {
      case 'signal:detected':
      case 'signal:validated':
        // Burst pattern: 8-12 random tiles flash teal
        burstTiles(8 + Math.floor(Math.random() * 5), 1.0, 'autonomous');
        break;

      case 'signal:rejected':
        // Flash 4-6 tiles pink/red
        burstTiles(4 + Math.floor(Math.random() * 3), 1.0, 'accent');
        break;

      case 'trade:executed':
        // Wave from center outward
        waveFromCenter();
        break;

      case 'position:closed':
        // Brief all-dim then recovery
        dimAndRecover();
        break;

      case 'price:updated':
        // Subtle pulse on 2-3 tiles
        burstTiles(2 + Math.floor(Math.random() * 2), 0.6, null);
        break;
    }
  }

  function burstTiles(count, intensity, forceType) {
    for (var i = 0; i < count; i++) {
      var idx = Math.floor(Math.random() * TOTAL_TILES);
      tiles[idx].targetIntensity = intensity;
      if (forceType) {
        tiles[idx].baseColor = TYPE_COLORS[forceType] || TYPE_COLORS.autonomous;
      }
    }
  }

  function waveFromCenter() {
    var center = 3.5;
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      var dist = Math.sqrt(Math.pow(t.col - center, 2) + Math.pow(t.row - center, 2));
      var delay = dist * 80;
      (function (tile, d) {
        setTimeout(function () {
          tile.targetIntensity = 1.0;
        }, d);
      })(t, delay);
    }
  }

  function dimAndRecover() {
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].targetIntensity = 0.1;
    }
    // Recover after 500ms
    setTimeout(function () {
      for (var i = 0; i < tiles.length; i++) {
        tiles[i].targetIntensity = 0.2 + Math.random() * 0.2;
      }
    }, 500);
  }

  return {
    init: init,
    handleMessage: handleMessage
  };
})();
