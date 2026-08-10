export function playBeep(freq = 440, type = 'sine', duration = 100) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration/1000);
    setTimeout(() => { osc.stop(); ctx.close(); }, duration);
  } catch(e) {}
}
