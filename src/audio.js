// ============================================
// MANIFESTO — Audio Engine
// Zero-dependency Web Audio API Mechanical Switches
// Synthesizes Thocky, Clicky, and Cyber synth sounds
// ============================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
    this.switchType = 'thock'; // thock | clicky | cyber
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playKeySound(isSpace = false, isError = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    if (isError) {
      this.playErrorSound();
      return;
    }

    switch (this.switchType) {
      case 'clicky':
        this.playClickySound(isSpace);
        break;
      case 'cyber':
        this.playCyberSound(isSpace);
        break;
      case 'thock':
      default:
        this.playThockSound(isSpace);
        break;
    }
  }

  // ---- 🎹 Thock Switch Sound (Holy Panda / Cream) ----
  playThockSound(isSpace) {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sub-thud oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = isSpace ? 110 : 180 + Math.random() * 30;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

    gain.gain.setValueAtTime(this.volume * (isSpace ? 0.7 : 0.5), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    // High snap noise
    const bufferSize = ctx.sampleRate * 0.015;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = isSpace ? 1200 : 2400;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.volume * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
    noise.start(now);
    noise.stop(now + 0.015);
  }

  // ---- ⚡ Clicky Switch Sound (Cherry MX Blue) ----
  playClickySound(isSpace) {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // High metallic click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const freq = isSpace ? 800 : 1600 + Math.random() * 200;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.02);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  // ---- 🌌 Cyber Synth Sound ----
  playCyberSound(isSpace) {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const freq = isSpace ? 300 : 520 + Math.random() * 100;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // ---- ❌ Error Sound ----
  playErrorSound() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // ---- 🔔 Chime Sound (Focus Timer completion) ----
  playChimeSound() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Bell-like harmonics
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const delay = i * 0.12;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.8);
    });
  }

  // ---- 🎉 Success Sound (Goal completion) ----
  playSuccessSound() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.15);
    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const soundEngine = new SoundEngine();

// Convenience exports
export function playChimeSound() { soundEngine.playChimeSound(); }
export function playSuccessSound() { soundEngine.playSuccessSound(); }
