// Ambient Soundscape and Audio Chimes using Web Audio API (Zero external assets, works 100% offline)

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentMode: "rain" | "lofi" | "alpha" | "whitenoise" = "rain";

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playChime(type: "success" | "click" | "levelUp" | "panic") {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;

      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "levelUp") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
        osc.frequency.setValueAtTime(880, now + 0.3); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "panic") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(174.61, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // Audio context may be prevented until user gesture
    }
  }

  public startAmbient(mode: "rain" | "lofi" | "alpha" | "whitenoise", volume = 0.15) {
    try {
      this.initContext();
      if (!this.ctx) return;
      this.stopAmbient();

      this.currentMode = mode;
      this.isPlaying = true;

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      if (mode === "rain") {
        // Pink noise with soft filter
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.1;
        }
      } else if (mode === "alpha") {
        // Binaural 10Hz harmonic vibe
        for (let i = 0; i < bufferSize; i++) {
          const t = i / this.ctx.sampleRate;
          data[i] = Math.sin(2 * Math.PI * 180 * t) * 0.15 + Math.sin(2 * Math.PI * 190 * t) * 0.15;
        }
      } else if (mode === "lofi") {
        // Soft mellow warm frequency
        for (let i = 0; i < bufferSize; i++) {
          const t = i / this.ctx.sampleRate;
          data[i] = (Math.sin(2 * Math.PI * 130.81 * t) + Math.sin(2 * Math.PI * 164.81 * t) * 0.5) * 0.12;
        }
      } else {
        // Gentle white noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.05;
        }
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = mode === "rain" ? "lowpass" : "bandpass";
      filter.frequency.value = mode === "rain" ? 800 : 350;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.noiseNode = noise;
      this.gainNode = gain;
    } catch {
      // Audio context handling
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  public stopAmbient() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch {
        // Already stopped
      }
      this.noiseNode = null;
    }
    this.isPlaying = false;
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public getCurrentMode() {
    return this.currentMode;
  }
}

export const ambientAudio = new AmbientAudioEngine();
