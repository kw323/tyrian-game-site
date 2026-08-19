import { SoundSystem } from './SoundSystem';
import { VoiceManifest } from './VoiceManifest';

export class VoicePlaybackManager {
    private static currentAudio: HTMLAudioElement | null = null;
    private static enabled = true;
    private static volume = 1.0;
    private static gestureUnlocked = false;

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

    public static primeFromGesture(): void {
        if (this.gestureUnlocked || typeof window === 'undefined') return;
        const primerLine = VoiceManifest.get('stage-1-contact-0');
        if (!primerLine?.audioUrl) return;

        try {
            const primer = new Audio(this.resolveUrl(primerLine.audioUrl));
            primer.muted = true;
            primer.setAttribute('playsinline', '');
            void primer.play().then(() => {
                primer.pause();
                primer.currentTime = 0;
                this.gestureUnlocked = true;
            }).catch(() => {
                // The real line will retry on the next user gesture.
            });
        } catch (error) {
            console.warn('VoicePlaybackManager gesture warm-up failed:', error);
        }
    }

    private static resolveUrl(audioUrl: string): string {
        if (typeof window === 'undefined') return audioUrl;
        try {
            return new URL(audioUrl, window.location.origin).toString();
        } catch {
            return audioUrl;
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
            const audio = new Audio(this.resolveUrl(mapping.audioUrl));
            audio.preload = 'auto';
            audio.setAttribute('playsinline', '');
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

            void audio.play().catch((error) => {
                SoundSystem.duckMusic(false);
                if (this.currentAudio === audio) this.currentAudio = null;
                console.warn(`Voice playback blocked or unavailable for ${lineId}:`, error);
            });
        } catch (err) {
            SoundSystem.duckMusic(false);
            console.warn('VoicePlaybackManager error:', err);
        }
    }
}
