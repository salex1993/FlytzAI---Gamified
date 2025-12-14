
// Synthesized Sound Effects Engine
// Uses Web Audio API to generate sci-fi UI sounds without external assets

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  private init() {
    if (this.initialized) return;
    
    try {
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContext();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.2; // Slightly higher master, controlled individually
          this.masterGain.connect(this.ctx.destination);
          this.initialized = true;
        }
      }
    } catch (e) {
      console.warn("AudioContext not supported");
    }
  }

  private ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Toggle sound globally
  toggle(state: boolean) {
    this.enabled = state;
  }

  // 1. Subtle "Air" Tick (Hover)
  // Replaced high-pitch blip with a very soft, breathy tick
  playHover() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    // Sine wave for softness
    osc.type = 'sine';
    // Constant low-mid frequency, no sweep
    osc.frequency.setValueAtTime(400, t); 

    // Extremely short envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 0.005); // Very quiet
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // 2. Soft "Tap" (Select/Press)
  // Replaced harsh square click with a muted thud
  playClick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    // Quick drop for a "tap" feel
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 3. Satisfying "Lock-in" (Success/Save)
  // KEPT: A Major Chord, but smoothed the attack slightly to be less jarring
  playSuccess() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Chord: Root, Major 3rd, 5th (A Major)
    const freqs = [440, 554.37, 659.25]; 

    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain!);

      // Triangle gives it that "glassy/crystal" character
      osc.type = 'triangle'; 
      osc.frequency.setValueAtTime(f, t);
      
      // Staggered entry (arpeggio effect)
      const start = t + (i * 0.04);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.1); // Slightly softer peak
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);

      osc.start(start);
      osc.stop(start + 0.9);
    });
  }

  // 4. Ethereal Swell (Terminal Load)
  // Replaced aggressive sawtooth sweep with a gentle sine swell
  playPowerUp() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    // Gentle frequency rise
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.6);

    // Smooth swell in and out
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.3);
    gain.gain.linearRampToValueAtTime(0, t + 0.6);

    osc.start(t);
    osc.stop(t + 0.6);
  }
}

export const audioEffects = new AudioEngine();
