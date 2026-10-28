import { StorageManager } from '../../storage/localStorage';

export class AudioManager {
  private static instance: AudioManager | null = null;
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private isMuted: boolean = false;
  private timerId: number | null = null;
  private step: number = 0;
  private masterGain: GainNode | null = null;

  // Catchy Cyber Synthwave Melody Note Frequencies (in Hz)
  private static readonly BASS_NOTES = [
    110.00, 110.00, 130.81, 110.00, // A2, A2, C3, A2
    146.83, 130.81, 110.00, 98.00,   // D3, C3, A2, G2
    110.00, 110.00, 164.81, 146.83, // A2, A2, E3, D3
    130.81, 110.00, 146.83, 164.81  // C3, A2, D3, E3
  ];

  private static readonly LEAD_NOTES = [
    440.00, 0, 523.25, 0, 659.25, 587.33, 523.25, 440.00,
    392.00, 440.00, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25
  ];

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private constructor() {
    try {
      this.isMuted = StorageManager.loadProgress().settings?.muted ?? false;
    } catch {
      this.isMuted = false;
    }
    this.setupGlobalUnlockListeners();
  }

  private setupGlobalUnlockListeners(): void {
    const unlock = () => {
      this.initContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().then(() => {
          if (this.isPlaying && !this.isPaused) {
            // Context resumed successfully
          }
        }).catch(() => {});
      }
    };

    ['pointerdown', 'click', 'touchstart', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlock, { capture: true, passive: true });
      document.addEventListener(evt, unlock, { capture: true, passive: true });
    });
  }

  private initContext(): void {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.2, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public playBGM(): void {
    this.initContext();

    if (this.isPlaying) {
      if (this.isPaused) {
        this.resumeBGM();
      }
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.step = 0;

    // 16th-note synth loop at ~130 BPM (115ms per step)
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }

    this.timerId = window.setInterval(() => {
      if (this.isPaused || this.isMuted || !this.audioCtx) return;
      
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
        return;
      }
      
      if (this.audioCtx.state === 'running') {
        this.playSynthStep();
      }
    }, 115);
  }

  private playSynthStep(): void {
    if (!this.audioCtx || !this.masterGain || this.isMuted) return;

    const now = this.audioCtx.currentTime;

    // 1. Bass synth
    const bassFreq = AudioManager.BASS_NOTES[this.step % AudioManager.BASS_NOTES.length];
    if (bassFreq > 0) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.11);
    }

    // 2. Lead synth
    const leadFreq = AudioManager.LEAD_NOTES[this.step % AudioManager.LEAD_NOTES.length];
    if (leadFreq > 0) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(leadFreq, now);

      gain.gain.setValueAtTime(0.10, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.13);
    }

    // 3. Hi-hat noise/pulse click
    if (this.step % 2 === 1) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.035);
    }

    this.step = (this.step + 1) % 16;
  }

  // Sound Effects (SFX) Synthesizers
  public playCoinSFX(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain || this.audioCtx.state !== 'running') return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playRepelSFX(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain || this.audioCtx.state !== 'running') return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playBombSFX(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain || this.audioCtx.state !== 'running') return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playPowerupSFX(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain || this.audioCtx.state !== 'running') return;

    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.11);
    });
  }

  public playHitSFX(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain || this.audioCtx.state !== 'running') return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playWinSFX(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain || this.audioCtx.state !== 'running') return;

    const now = this.audioCtx.currentTime;
    const chord = [440, 554.37, 659.25, 880]; // A major chord
    chord.forEach((freq) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.52);
    });
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.initContext();
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.2, this.audioCtx.currentTime);
    }
    try {
      const current = StorageManager.loadProgress();
      StorageManager.saveProgress({
        settings: {
          ...current.settings,
          muted: this.isMuted
        }
      });
    } catch {
      // Ignore if localStorage unavailable
    }
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public pauseBGM(): void {
    this.isPaused = true;
  }

  public resumeBGM(): void {
    this.initContext();
    this.isPaused = false;
  }

  public stopBGM(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.step = 0;
  }
}

