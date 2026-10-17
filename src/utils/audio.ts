export interface AudioAnalysis {
  bass: number; // 0-1
  mid: number; // 0-1
  treble: number; // 0-1
  overall: number; // 0-1
  isBeat: boolean;
  frequencyData: Uint8Array;
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
  private lastBeatTime: number = 0;
  private energyHistory: number[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.analyser) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  public async startMicrophone(): Promise<boolean> {
    this.initContext();
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
    if (!this.ctx || !this.analyser) return;

    if (this.audioElement !== element) {
      this.audioElement = element;
      try {
        if (!this.audioSource) {
          this.audioSource = this.ctx.createMediaElementSource(element);
          this.audioSource.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);
        }
      } catch (err) {
        // Element may already be connected
      }
    }
  }

  public bindDisplayAudio(stream: MediaStream) {
    this.initContext();
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
  }

  public getAnalysis(sensitivity: number = 50): AudioAnalysis {
    const defaultRes: AudioAnalysis = {
      bass: 0,
      mid: 0,
      treble: 0,
      overall: 0,
      isBeat: false,
      frequencyData: new Uint8Array(128),
    };

    if (!this.analyser || !this.dataArray) {
      return defaultRes;
    }

    this.analyser.getByteFrequencyData(this.dataArray as any);

    const length = this.dataArray.length;
    const factor = (sensitivity / 50) * 1.2;

    // Split frequency spectrum into bass (0-15%), mid (15-60%), treble (60-100%)
    let bassSum = 0;
    const bassCount = Math.floor(length * 0.15);
    for (let i = 0; i < bassCount; i++) {
      bassSum += this.dataArray[i];
    }
    const bass = Math.min(1, (bassSum / (bassCount * 255)) * factor);

    let midSum = 0;
    const midStart = bassCount;
    const midEnd = Math.floor(length * 0.6);
    const midCount = midEnd - midStart;
    for (let i = midStart; i < midEnd; i++) {
      midSum += this.dataArray[i];
    }
    const mid = Math.min(1, (midSum / (midCount * 255)) * factor);

    let trebleSum = 0;
    const trebleCount = length - midEnd;
    for (let i = midEnd; i < length; i++) {
      trebleSum += this.dataArray[i];
    }
    const treble = Math.min(1, (trebleSum / (trebleCount * 255)) * factor);

    const overall = (bass * 0.5 + mid * 0.35 + treble * 0.15);

    // Peak Beat detector
    const now = performance.now();
    let isBeat = false;
    this.energyHistory.push(bass);
    if (this.energyHistory.length > 30) {
      this.energyHistory.shift();
    }
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    if (bass > avgEnergy * 1.35 && bass > 0.3 && now - this.lastBeatTime > 220) {
      isBeat = true;
      this.lastBeatTime = now;
    }

    return {
      bass,
      mid,
      treble,
      overall,
      isBeat,
      frequencyData: this.dataArray,
    };
  }
}

export const audioManager = new AudioManager();
