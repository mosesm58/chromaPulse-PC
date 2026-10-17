export interface AudioAnalysis {
  bass: number; // 0-1
  mid: number; // 0-1
  treble: number; // 0-1
  overall: number; // 0-1
  isBeat: boolean;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private displaySource: MediaStreamAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private waveformArray: Uint8Array | null = null;
  private lastBeatTime: number = 0;
  private energyHistory: number[] = [];
  private previousBassLevel: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (!this.analyser) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.18;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.waveformArray = new Uint8Array(this.analyser.fftSize);
    }
  }

  public async prepare(): Promise<boolean> {
    this.initContext();
    if (!this.ctx) return false;
    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return this.ctx.state === 'running';
    } catch (error) {
      console.warn('Audio context could not be resumed:', error);
      return false;
    }
  }

  public async startMicrophone(): Promise<boolean> {
    await this.prepare();
    if (!this.ctx || !this.analyser) return false;

    try {
      this.stop();
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser);
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      return false;
    }
  }

  public bindAudioElement(element: HTMLAudioElement) {
    this.initContext();
    void this.prepare();
    if (!this.ctx || !this.analyser) return;

    if (this.audioElement !== element) {
      this.audioElement = element;
      try {
        if (!this.audioSource) {
          this.audioSource = this.ctx.createMediaElementSource(element);
          this.audioSource.connect(this.analyser);
          // Keep local/demo playback audible without routing captured system
          // audio back to the speakers through the analyser graph.
          this.audioSource.connect(this.ctx.destination);
        }
      } catch (err) {
        // Element may already be connected
      }
    }
  }

  public async bindDisplayAudio(stream: MediaStream): Promise<boolean> {
    await this.prepare();
    if (!this.ctx || !this.analyser || !stream.getAudioTracks().length) return false;
    this.displaySource?.disconnect();
    this.displaySource = this.ctx.createMediaStreamSource(stream);
    this.displaySource.connect(this.analyser);
    return true;
  }

  public stop() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    this.displaySource?.disconnect();
    this.displaySource = null;
    this.energyHistory = [];
    this.previousBassLevel = 0;
    this.lastBeatTime = 0;
  }

  public getAnalysis(sensitivity: number = 50): AudioAnalysis {
    const defaultRes: AudioAnalysis = {
      bass: 0,
      mid: 0,
      treble: 0,
      overall: 0,
      isBeat: false,
      frequencyData: new Uint8Array(128),
      waveformData: new Uint8Array(256).fill(128),
    };

    if (!this.analyser || !this.dataArray || !this.waveformArray) {
      return defaultRes;
    }

    this.analyser.getByteFrequencyData(this.dataArray as any);
    this.analyser.getByteTimeDomainData(this.waveformArray as any);

    const length = this.dataArray.length;
    const binHz = (this.ctx?.sampleRate || 48000) / (this.analyser.fftSize || 2048);
    const bandLevel = (minHz: number, maxHz: number, exponent: number) => {
      const first = Math.max(1, Math.floor(minHz / binHz));
      const last = Math.min(length, Math.ceil(maxHz / binHz));
      let sum = 0;
      for (let i = first; i < last; i++) sum += this.dataArray![i];
      const count = Math.max(1, last - first);
      return Math.min(1, Math.pow(sum / (count * 255), exponent));
    };

    // Use actual frequency ranges so bass, mids, and treble map consistently across devices.
    const bass = bandLevel(35, 180, 0.68);
    const mid = bandLevel(250, 4000, 0.72);
    const treble = bandLevel(4000, Math.min(16000, (this.ctx?.sampleRate || 48000) / 2), 0.72);

    const overall = (bass * 0.5 + mid * 0.35 + treble * 0.15);

    // Peak Beat detector
    const now = performance.now();
    let isBeat = false;
    const history = [...this.energyHistory].sort((a, b) => a - b);
    const baseline = history.length ? history[Math.floor((history.length - 1) * 0.25)] : 0;
    const bassRise = bass - this.previousBassLevel;
    const sensitivity01 = Math.max(0, Math.min(1, (sensitivity - 10) / 90));
    const thresholdFloor = 0.07 - sensitivity01 * 0.052;
    const baselineMultiplier = 1.58 - sensitivity01 * 0.52;
    const riseThreshold = 0.028 - sensitivity01 * 0.024;
    const refractoryMs = 270 - sensitivity01 * 80;
    if (
      bass >= Math.max(thresholdFloor, baseline * baselineMultiplier)
      && bassRise >= riseThreshold
      && now - this.lastBeatTime > refractoryMs
    ) {
      isBeat = true;
      this.lastBeatTime = now;
    }
    this.energyHistory.push(bass);
    if (this.energyHistory.length > 60) this.energyHistory.shift();
    this.previousBassLevel = bass;

    return {
      bass,
      mid,
      treble,
      overall,
      isBeat,
      frequencyData: this.dataArray,
      waveformData: this.waveformArray,
    };
  }
}

export const audioManager = new AudioManager();
