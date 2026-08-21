export class SoundSystem {
    private static ctx: AudioContext | null = null;
    private static musicGain: GainNode | null = null;
    private static musicTrack: HTMLAudioElement | null = null;
    private static musicVoices: OscillatorNode[] = [];
    private static musicTimer: number | null = null;
    private static musicStep = 0;
    private static isMusicPlaying = false;
    private static soundEnabled = true;
    private static musicEnabled = true;
    private static musicBaseVolume = 0.085;
    private static musicDuckAmount = 0.2;
    private static readonly musicBpm = 172; // Faster tempo for Shamisen rhythm

    private static initContext(): void {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx?.state === 'suspended') {
            void this.ctx.resume().catch(() => undefined);
        }
    }

    private static createTone(
        frequency: number,
        duration: number,
        type: OscillatorType,
        volume: number,
        destination: AudioNode,
        startAt: number,
        endFrequency?: number
    ): OscillatorNode | null {
        if (!this.ctx) return null;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, startAt);
        if (endFrequency !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startAt + duration);
        }
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(startAt);
        osc.stop(startAt + duration + 0.02);
        return osc;
    }

    private static playMusicStep(): void {
        if (!this.ctx || !this.musicGain || !this.isMusicPlaying || !this.soundEnabled || !this.musicEnabled || this.ctx.state === 'suspended') return;
        const now = this.ctx.currentTime;
        const step = this.musicStep % 32;

        const shamisenScale = [330, 392, 440, 587.33, 659.25, 880];
        const shamisenNote = shamisenScale[(step * 3) % shamisenScale.length];
        const bassPattern = [110, 0, 110, 165, 110, 0, 196, 0, 110, 0, 110, 220, 146.83, 0, 196, 0];
        
        const bass = bassPattern[step % bassPattern.length];

        if (bass) {
            const voice = this.createTone(bass, 0.18, 'sawtooth', 0.09, this.musicGain, now, bass * 0.5);
            if (voice) this.musicVoices.push(voice);
        }

        if (step % 2 === 0) {
            const pluck = this.createTone(shamisenNote, 0.11, 'triangle', 0.07, this.musicGain, now, shamisenNote * 0.8);
            if (pluck) this.musicVoices.push(pluck);
        }

        if (step % 8 === 0) {
            const taiko = this.createTone(95, 0.22, 'sine', 0.18, this.musicGain, now, 45);
            if (taiko) this.musicVoices.push(taiko);
        } else if (step % 8 === 4) {
            const snare = this.createTone(210, 0.08, 'square', 0.05, this.musicGain, now, 90);
            if (snare) this.musicVoices.push(snare);
        }

        this.musicStep++;
        if (this.musicVoices.length > 64) this.musicVoices.splice(0, 24);
    }

    public static toggleSound(enabled?: boolean): boolean {
        this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
        if (!this.soundEnabled) this.stopMusic();
        return this.soundEnabled;
    }

    public static isSoundEnabled(): boolean {
        return this.soundEnabled;
    }

    public static playShoot(): void {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    public static playExplosion(): void {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.3);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    public static playUpgrade(): void {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const startAt = this.ctx.currentTime + idx * 0.08;
            this.createTone(freq, 0.12, 'sine', 0.15, this.ctx.destination, startAt);
        });
    }

    public static playAbility(ability: string, activating: boolean): void {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;
        const base = ability === 'time_lock' ? 330 : ability === 'void_armor' ? 520 : 220;
        const notes = activating ? [base, base * 1.25, base * 1.5] : [base * 1.5, base * 1.1, base * 0.75];
        notes.forEach((frequency, index) => {
            if (!this.ctx) return;
            const startAt = this.ctx.currentTime + index * 0.055;
            this.createTone(frequency, 0.18, activating ? 'square' : 'triangle', activating ? 0.12 : 0.08, this.ctx.destination, startAt);
        });
    }

    public static playVoiceTone(speaker: string): void {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;
        this.setMusicDucked(true);

        const baseFreq = speaker === 'naomi' ? 520 : speaker === 'sera' ? 440 : 380;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.setValueAtTime(baseFreq * 1.25, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    public static playCriticalComms(speaker: string, kind: 'briefing' | 'intercept' | 'warning' = 'intercept'): void {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;
        this.setMusicDucked(true);
        const base = speaker === 'naomi' ? 520 : speaker === 'sera' ? 440 : speaker === 'elena' ? 380 : speaker === 'ghost' ? 220 : 330;
        const pattern = speaker === 'ghost'
            ? [220, 880, 110, 440, 990]
            : kind === 'warning'
                ? [base * 0.75, base, base * 1.5, base]
                : kind === 'briefing'
                    ? [base, base * 1.25]
                    : [base * 1.5, base * 1.12, base * 0.82];
        pattern.forEach((frequency, index) => {
            if (!this.ctx) return;
            const startAt = this.ctx.currentTime + index * (speaker === 'ghost' ? 0.05 : kind === 'warning' ? 0.07 : 0.09);
            this.createTone(frequency, speaker === 'ghost' ? 0.09 : kind === 'warning' ? 0.16 : 0.12, speaker === 'ghost' ? 'sawtooth' : kind === 'warning' ? 'square' : 'triangle', speaker === 'ghost' ? 0.12 : kind === 'warning' ? 0.1 : 0.075, this.ctx.destination, startAt);
        });
    }

    public static startMusic(): void {
        if (!this.soundEnabled || !this.musicEnabled) return;
        this.initContext();
        if (!this.ctx) return;
        if (this.isMusicPlaying) {
            if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
            return;
        }

        try {
            if (!this.musicTrack) {
                this.musicTrack = new Audio('/audio/music/protect_starship_combat_rune_assault.mp3');
                this.musicTrack.loop = true;
                this.musicTrack.preload = 'auto';
            }
            this.musicTrack.volume = this.musicBaseVolume;
            this.isMusicPlaying = true;
            void this.musicTrack.play().catch(() => {
                // A browser may reject the first attempt before a gesture. The next user
                // key or click invokes startMusic again and retries the same track.
                this.isMusicPlaying = false;
            });
        } catch {
            this.isMusicPlaying = false;
        }
    }

    public static duckMusic(duck: boolean): void {
        const target = duck ? this.musicBaseVolume * this.musicDuckAmount : this.musicBaseVolume;
        if (this.musicTrack) this.musicTrack.volume = target;
        if (!this.musicGain || !this.ctx) return;
        try {
            this.musicGain.gain.setValueAtTime(target, this.ctx.currentTime);
        } catch {
            // Ignore audio context timing conflicts
        }
    }

    public static toggleMusic(enabled?: boolean): boolean {
        this.musicEnabled = enabled !== undefined ? enabled : !this.musicEnabled;
        if (!this.musicEnabled) this.stopMusic();
        return this.musicEnabled;
    }

    public static isMusicEnabled(): boolean {
        return this.musicEnabled;
    }

    public static stopMusic(): void {
        if (this.musicTrack) {
            this.musicTrack.pause();
            this.musicTrack.currentTime = 0;
        }
        if (this.musicTimer !== null) {
            window.clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
        this.musicVoices.forEach((voice) => {
            try { voice.stop(); } catch {}
        });
        this.musicVoices = [];
        if (this.musicGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.musicGain.gain.cancelScheduledValues(now);
            this.musicGain.gain.setTargetAtTime(0.0001, now, 0.04);
        }
        this.musicGain = null;
        this.isMusicPlaying = false;
    }

    public static setMusicDucked(ducked: boolean): void {
        if (!this.isMusicPlaying) return;
        const target = ducked ? this.musicBaseVolume * this.musicDuckAmount : this.musicBaseVolume;
        if (this.musicTrack) this.musicTrack.volume = target;
        if (!this.musicGain || !this.ctx) return;
        const now2 = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now2);
        this.musicGain.gain.setTargetAtTime(target, now2, ducked ? 0.04 : 0.18);
    }
}
