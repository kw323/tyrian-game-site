import { SoundSystem } from './SoundSystem';
import { VoiceManifest } from './VoiceManifest';

export class VoicePlaybackManager {
    private static currentAudio: HTMLAudioElement | null = null;
    private static enabled = true;
    private static volume = 1.0;

    public static setEnabled(active: boolean): void {
        this.enabled = active;
        if (!active) this.stop();
    }

    public static isEnabled(): boolean {
        return this.enabled;
    }

    public static setVolume(val: number): void {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
    }

    public static stop(): void {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }

    public static playVoiceLine(lineId: string, lang: string = 'en'): void {
        // The voice assets are English by design and remain available in both text modes.
        // `lang` controls subtitles/UI text; it must not disable the English voice-over.
        if (!this.enabled) return;
        const mapping = VoiceManifest.get(lineId);
        if (!mapping || !mapping.audioUrl) return;

        this.stop();

        try {
            const audio = new Audio(mapping.audioUrl);
            audio.volume = this.volume;
            this.currentAudio = audio;

            // Duck music during speech if sound system supports it
            SoundSystem.duckMusic(true);

            audio.onended = () => {
                SoundSystem.duckMusic(false);
                if (this.currentAudio === audio) this.currentAudio = null;
            };

            audio.onerror = () => {
                // Fallback gracefully if audio file is missing during pilot phase
                SoundSystem.duckMusic(false);
                if (this.currentAudio === audio) this.currentAudio = null;
            };

            void audio.play().catch(() => {
                SoundSystem.duckMusic(false);
                if (this.currentAudio === audio) this.currentAudio = null;
            });
        } catch (err) {
            SoundSystem.duckMusic(false);
            console.warn('VoicePlaybackManager error:', err);
        }
    }
}
