/* CL1 BIOS Boot Sequence */

const Boot = (function () {
  const BOOT_LINES = [
    { text: '', delay: 300 },
    { text: 'CL1 BIOS v2.4.1 -- Cortical Labs Neural Interface', delay: 200 },
    { text: 'Copyright (c) 2026 Cortical Labs Pty Ltd.', delay: 100 },
    { text: '', delay: 200 },
    { text: 'Initializing MEA substrate...', delay: 300 },
    { text: 'Electrode array: 64 channels detected', delay: 150 },
    { text: 'Substrate impedance: nominal (12.4 kOhm avg)', delay: 100 },
    { text: '', delay: 100 },
    { text: 'Running POST diagnostics...', delay: 400 },
    { text: '  Memory: 131072 synaptic weights OK', delay: 100 },
    { text: '  Coherence baseline: calibrating...', delay: 300 },
    { text: '  Coherence baseline: 0.72 (within tolerance)', delay: 150 },
    { text: '  Entropy sensor: nominal', delay: 100 },
    { text: '  Firing rate: 0.00 Hz (standby)', delay: 100 },
    { text: '  Stimulus-response latency: 14ms', delay: 80 },
    { text: '', delay: 100 },
    { text: 'Loading neural culture profile...', delay: 500 },
    { text: 'Culture ID: CL1-2026-ALPHA', delay: 100 },
    { text: 'Culture age: 14 DIV -- maturation stage: ACTIVE', delay: 200 },
    { text: 'Plasticity index: 0.89 (HIGH)', delay: 100 },
    { text: '', delay: 100 },
    { text: 'Connecting to Solana mainnet-beta...', delay: 400 },
    { text: 'RPC handshake: OK', delay: 150 },
    { text: 'Pipeline handshake: OK', delay: 200 },
    { text: 'WebSocket bridge: ACTIVE', delay: 100 },
    { text: '', delay: 200 },
    { text: 'All systems nominal.', delay: 200 },
    { text: 'CL1 online. Autonomous trading mode engaged.', delay: 300 },
    { text: '', delay: 500 },
  ];

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  let onComplete = null;

  async function play() {
    var container = document.getElementById('boot-overlay');
    if (!container) return;

    for (var i = 0; i < BOOT_LINES.length; i++) {
      var line = BOOT_LINES[i];
      await sleep(line.delay);
      var el = document.createElement('div');
      el.className = 'boot-line';
      el.textContent = line.text;
      container.appendChild(el);
      container.scrollTop = container.scrollHeight;
    }

    await sleep(500);
    container.classList.add('hidden');

    if (typeof onComplete === 'function') {
      onComplete();
    }
  }

  return {
    play: play,
    get onComplete() {
      return onComplete;
    },
    set onComplete(fn) {
      onComplete = fn;
    },
  };
})();
