/**
 * Procedural 8-bit / 16-bit Retro Chiptune Sound Synthesizer
 * Enhanced with Smash Bros combat audio, glove punches, items, class abilities,
 * master dynamic compressor limiter (zero clipping), and throttled clean KO sounds.
 */

class RetroAudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private currentTrack: 'menu' | 'battle' | 'none' = 'none';
  private lastSoundTimes: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('click', unlockAudio, { passive: true });
    }
  }

  public initContext() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();

          // Master Dynamic Limiter & Compressor to eliminate distortion/crackling
          this.compressor = this.ctx.createDynamicsCompressor();
          this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
          this.compressor.knee.setValueAtTime(25, this.ctx.currentTime);
          this.compressor.ratio.setValueAtTime(10, this.ctx.currentTime);
          this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
          this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

          // Dedicated SFX and Music Buses
          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);

          this.musicGain = this.ctx.createGain();
          this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : 0.75, this.ctx.currentTime);

          this.sfxGain.connect(this.compressor);
          this.musicGain.connect(this.compressor);
          this.compressor.connect(this.masterGain);
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore audio context initialization failures
    }
  }

  private getDestination(): AudioNode | null {
    this.initContext();
    if (!this.ctx) return null;
    return this.sfxGain || this.compressor || this.ctx.destination;
  }

  private getMusicDestination(): AudioNode | null {
    this.initContext();
    if (!this.ctx) return null;
    return this.musicGain || this.compressor || this.ctx.destination;
  }

  private canPlaySound(name: string, cooldownMs: number = 80): boolean {
    const now = Date.now();
    const last = this.lastSoundTimes.get(name) || 0;
    if (now - last < cooldownMs) return false;
    this.lastSoundTimes.set(name, now);
    return true;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.initContext();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(muted ? 0 : 1.0, this.ctx.currentTime);
    }
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    this.initContext();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(muted ? 0 : 0.75, this.ctx.currentTime);
    }
    if (muted) {
      this.stopBGM();
    } else {
      if (this.currentTrack === 'battle') {
        this.startBattleBGM();
      } else {
        this.startMenuBGM();
      }
    }
  }

  // --- SMASH COMBAT & GLOVE SOUNDS ---

  public playSmashPunch(isHeavy: boolean = false) {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('punch', 60)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      // Punch swoosh + chunky impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isHeavy ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(isHeavy ? 180 : 260, t);
      osc.frequency.exponentialRampToValueAtTime(isHeavy ? 35 : 60, t + 0.16);

      gain.gain.setValueAtTime(isHeavy ? 0.28 : 0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.18);

      // Subtle snap noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.12, t);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      noise.connect(nGain);
      nGain.connect(dest);
      noise.start(t);
    } catch {}
  }

  public playHomeRunBat() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('bat', 120)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      // Metallic high-pitched "PING!"
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1760, t); // A6
      osc1.frequency.exponentialRampToValueAtTime(1000, t + 0.35);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2200, t);
      osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.35);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.4);
      osc2.stop(t + 0.4);
    } catch {}
  }

  /**
   * Crisp, Punchy 16-bit Smash Bros Ring Out / Blast KO Sound
   * Designed with a solid low-end boom + explosive burst that NEVER clips or screeches.
   */
  public playSmashKO() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('smash_ko', 250)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;

      // 1. Deep 808-Style Sub Boom
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, t);
      subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.45);

      subGain.gain.setValueAtTime(0.35, t);
      subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start(t);
      subOsc.stop(t + 0.5);

      // 2. Filtered Warm Explosion Crunch (Lowpass filtered noise, never harsh)
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.3), this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.3);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(dest);
      noiseSource.start(t);

      // 3. High Smash Ringout Warp Chirp
      const chirpOsc = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();
      chirpOsc.type = 'triangle';
      chirpOsc.frequency.setValueAtTime(450, t);
      chirpOsc.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
      chirpOsc.frequency.exponentialRampToValueAtTime(180, t + 0.35);

      chirpGain.gain.setValueAtTime(0.18, t);
      chirpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);

      chirpOsc.connect(chirpGain);
      chirpGain.connect(dest);
      chirpOsc.start(t);
      chirpOsc.stop(t + 0.38);
    } catch {}
  }

  /**
   * Distinctive Player Final Elimination Sound (0 Stocks Lost)
   */
  public playPlayerDeath() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('player_death', 500)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;

      // Deep impact boom
      this.playSmashKO();

      // Dramatic Descending Defeat Chord in Minor Key
      const notes = [
        { freq: 440.0, time: 0.08, dur: 0.22 },   // A4
        { freq: 392.0, time: 0.24, dur: 0.22 },   // G4
        { freq: 349.23, time: 0.42, dur: 0.25 },  // F4
        { freq: 220.0, time: 0.65, dur: 0.55 },   // A3 (Low Final)
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.freq, t + n.time);
        osc.frequency.exponentialRampToValueAtTime(n.freq * 0.95, t + n.time + n.dur);

        gain.gain.setValueAtTime(0.16, t + n.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.time + n.dur);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t + n.time);
        osc.stop(t + n.time + n.dur);
      });
    } catch {}
  }

  public playParryClang() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('parry', 80)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.22);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }

  public playWarp() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('warp', 80)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.15);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  public playGravityPulse() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('gravity', 100)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.linearRampToValueAtTime(320, t + 0.2);
      osc.frequency.linearRampToValueAtTime(90, t + 0.35);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch {}
  }

  public playItemPickup() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('item', 60)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.035);
        gain.gain.setValueAtTime(0.14, t + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.035 + 0.1);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t + idx * 0.035);
        osc.stop(t + idx * 0.035 + 0.1);
      });
    } catch {}
  }

  public playDamageHeal() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('heal', 80)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        gain.gain.setValueAtTime(0.15, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.04 + 0.14);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.14);
      });
    } catch {}
  }

  public playCoin() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('coin', 40)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playBigCoin() {
    this.playCoin();
    this.playVictory();
  }

  public playEventAlert() {
    this.playButtonSlam();
  }

  public playButtonSlam() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('button_slam', 80)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(160, t);
      bass.frequency.exponentialRampToValueAtTime(30, t + 0.3);

      bassGain.gain.setValueAtTime(0.28, t);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

      bass.connect(bassGain);
      bassGain.connect(dest);
      bass.start(t);
      bass.stop(t + 0.3);
    } catch {}
  }

  public playJump() {
    try {
      if (this.isMuted) return;
      if (!this.canPlaySound('jump', 60)) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  public playVictory() {
    try {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const dest = this.getDestination();
      if (!dest) return;

      const t = this.ctx.currentTime;
      const notes = [
        { f: 523.25, d: 0.1 },
        { f: 659.25, d: 0.1 },
        { f: 783.99, d: 0.1 },
        { f: 1046.5, d: 0.3 },
      ];

      let offset = 0;
      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, t + offset);
        gain.gain.setValueAtTime(0.15, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + n.d);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t + offset);
        osc.stop(t + offset + n.d);
        offset += n.d;
      });
    } catch {}
  }

  public playDefeat() {
    this.playPlayerDeath();
  }

  public startMenuBGM() {
    this.currentTrack = 'menu';
    if (this.isMusicMuted) return;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const dest = this.getMusicDestination();
    if (!dest) return;

    // Cheerful, nostalgic 8-bit arcade menu theme
    const menuBass = [
      130.81, 0, 130.81, 164.81, 196.0, 0, 164.81, 0,
      146.83, 0, 146.83, 174.61, 220.0, 0, 174.61, 0,
      123.47, 0, 123.47, 146.83, 196.0, 0, 146.83, 0,
      130.81, 0, 130.81, 164.81, 196.0, 0, 261.63, 0,
    ];

    const menuLead = [
      523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 0,
      587.33, 698.46, 880.0, 1174.66, 880.0, 698.46, 587.33, 0,
      493.88, 587.33, 783.99, 987.77, 783.99, 587.33, 493.88, 0,
      523.25, 659.25, 783.99, 1046.5, 1318.51, 1046.5, 783.99, 1046.5,
    ];

    this.bgmStep = 0;
    this.bgmInterval = window.setInterval(() => {
      try {
        if (this.isMusicMuted || !this.ctx) return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
          return;
        }
        const destNode = this.getMusicDestination();
        if (!destNode) return;
        const t = this.ctx.currentTime;
        const bFreq = menuBass[this.bgmStep % menuBass.length];
        const lFreq = menuLead[this.bgmStep % menuLead.length];

        if (bFreq > 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bFreq, t);
          bassGain.gain.setValueAtTime(0.04, t);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
          bassOsc.connect(bassGain);
          bassGain.connect(destNode);
          bassOsc.start(t);
          bassOsc.stop(t + 0.16);
        }

        if (lFreq > 0) {
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();
          leadOsc.type = 'square';
          leadOsc.frequency.setValueAtTime(lFreq, t);
          leadGain.gain.setValueAtTime(0.02, t);
          leadGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
          leadOsc.connect(leadGain);
          leadGain.connect(destNode);
          leadOsc.start(t);
          leadOsc.stop(t + 0.13);
        }

        this.bgmStep++;
      } catch {}
    }, 175);
  }

  public startBattleBGM() {
    this.currentTrack = 'battle';
    if (this.isMusicMuted) return;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const dest = this.getMusicDestination();
    if (!dest) return;

    // Retro Battle Chiptune Arpeggios (Smash Tournament Vibe)
    const bassline = [
      110, 0, 110, 130.81, 146.83, 0, 146.83, 130.81,
      98, 0, 98, 123.47, 130.81, 0, 130.81, 123.47,
    ];

    const leadMelody = [
      440, 523.25, 659.25, 880, 587.33, 659.25, 523.25, 440,
      392, 493.88, 587.33, 783.99, 523.25, 587.33, 493.88, 392,
    ];

    this.bgmStep = 0;
    this.bgmInterval = window.setInterval(() => {
      try {
        if (this.isMusicMuted || !this.ctx) return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
          return;
        }
        const destNode = this.getMusicDestination();
        if (!destNode) return;
        const t = this.ctx.currentTime;
        const bFreq = bassline[this.bgmStep % bassline.length];
        const lFreq = leadMelody[this.bgmStep % leadMelody.length];

        if (bFreq > 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bFreq, t);
          bassGain.gain.setValueAtTime(0.05, t);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
          bassOsc.connect(bassGain);
          bassGain.connect(destNode);
          bassOsc.start(t);
          bassOsc.stop(t + 0.12);
        }

        if (lFreq > 0) {
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();
          leadOsc.type = 'square';
          leadOsc.frequency.setValueAtTime(lFreq, t);
          leadGain.gain.setValueAtTime(0.025, t);
          leadGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
          leadOsc.connect(leadGain);
          leadGain.connect(destNode);
          leadOsc.start(t);
          leadOsc.stop(t + 0.1);
        }

        this.bgmStep++;
      } catch {}
    }, 145);
  }

  public setSoundEnabled(enabled: boolean) {
    this.isMuted = !enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(enabled ? 1.0 : 0, this.ctx.currentTime);
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicMuted = !enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(enabled ? 0.75 : 0, this.ctx.currentTime);
    }
    if (!enabled) {
      this.stopBGM();
    }
  }

  public startBGM() {
    this.startBattleBGM();
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new RetroAudioSystem();
