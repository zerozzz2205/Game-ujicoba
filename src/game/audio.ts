// Procedural Web Audio API Synth Engine for YukiPlow: Cozy Winter Express

const PENTATONIC_RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3];

class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastSnowChimeAt = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(val: boolean): boolean {
    this.muted = val;
    if (val && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    } else if (!val && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.muted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.muted);
  }

  // Light event: pitch-varied pentatonic snow-plow chime + soft powder crunch
  public playSnowClear(comboCount: number, multiplier: number, isDeep = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastSnowChimeAt < 0.045) return;
    this.lastSnowChimeAt = now;

    const degree = comboCount % PENTATONIC_RATIOS.length;
    const baseFreq = isDeep ? 293.66 : 392.0; // D4 or G4
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.08; // ±4%
    const multLift = 1 + (multiplier - 1) * 0.06;
    const freq = baseFreq * PENTATONIC_RATIOS[degree] * multLift * pitchJitter;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isDeep ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isDeep ? 0.11 : 0.085, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + (isDeep ? 0.16 : 0.12));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (isDeep ? 0.17 : 0.13));
  }

  // Combo tier-up arpeggio fanfare
  public playComboTierUp(multiplier: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    const pitchScale = 1 + (multiplier - 2) * 0.07;

    notes.forEach((n, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.048;
      osc.frequency.setValueAtTime(n * pitchScale, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  // Coin / Hot Cocoa pickup bell
  public playPickup(kind: 'coin' | 'cocoa'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = kind === 'coin' ? [987.77, 1318.51] : [587.33, 880.0, 1174.66];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(f * (1 + (Math.random() - 0.5) * 0.04), t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  // Boost ignition synth burst
  public playBoostBurst(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.18);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Upgrade purchase warm anime synth chord
  public playUpgradePurchase(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = [440, 554.37, 659.25, 880]; // A major 7 warm chord
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.04;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0009, t + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.34);
    });
  }

  // Hazard windup telegraph cue (rising alert synth)
  public playHazardTelegraph(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.28);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.065, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  // Heavy event: bash critter / knockback or player bump
  public playHeavyImpact(isPlayerHurt: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isPlayerHurt ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isPlayerHurt ? 180 : 240, now);
    osc.frequency.exponentialRampToValueAtTime(isPlayerHurt ? 52 : 95, now + 0.24);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Stage Clear / Defeat melody
  public playOutcomeSting(victory: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const seq = victory
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [392.0, 349.23, 329.63, 261.63];
    seq.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = victory ? 'triangle' : 'sine';
      const t = now + idx * 0.09;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }
}

export const synthAudio = new SynthAudioEngine();
