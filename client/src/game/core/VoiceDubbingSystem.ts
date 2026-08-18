export type VoiceSpeaker = 'elena' | 'naomi' | 'ghost' | 'sera' | 'pilot' | 'archon';

export interface VoiceProfile {
    name: string;
    pitch: number;
    rate: number;
    description: string;
}

export class VoiceDubbingSystem {
    private static enabled = true;
    private static volume = 1.0;
    private static currentUtterance: SpeechSynthesisUtterance | null = null;

    private static profiles: Record<VoiceSpeaker, VoiceProfile> = {
        elena: { name: 'Microsoft Zira / UK Female', pitch: 1.05, rate: 0.98, description: 'Firm, authoritative military commander' },
        naomi: { name: 'Microsoft Hazel / US Female', pitch: 1.2, rate: 1.02, description: 'Sarcastic, brilliant weapons engineer' },
        ghost: { name: 'Microsoft David / Deep Male', pitch: 0.72, rate: 0.92, description: 'Encrypted, low-pitch underground broker' },
        sera: { name: 'Microsoft Susan / Sharp Female', pitch: 0.96, rate: 1.04, description: 'Competitive rival pilot, direct and sharp' },
        pilot: { name: 'Microsoft Mark / Calm Male', pitch: 0.9, rate: 1.0, description: 'Experimental pilot, stoic and grounded' },
        archon: { name: 'Microsoft George / Distorted', pitch: 0.6, rate: 0.85, description: 'Supreme alien overseer, deep resonance' }
    };

    public static setEnabled(active: boolean): void {
        this.enabled = active;
        if (!active) this.stop();
    }

    public static isEnabled(): boolean {
        return this.enabled;
    }

    public static setVolume(val: number): void {
        this.volume = Math.max(0, Math.min(1, val));
    }

    public static stop(): void {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        this.currentUtterance = null;
    }

    public static speak(speaker: VoiceSpeaker, text: string, lang: 'he' | 'en' = 'en'): void {
        if (!this.enabled || !text || text.trim().length === 0) return;
        if (!('speechSynthesis' in window)) return;

        // Only voice English automatically, or fallback gracefully
        if (lang === 'he') {
            // Optional Hebrew speech if supported by browser speech synthesis
            return;
        }

        try {
            window.speechSynthesis.cancel();
            const profile = this.profiles[speaker] || this.profiles.pilot;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = profile.pitch;
            utterance.rate = profile.rate;
            utterance.volume = this.volume;
            utterance.lang = 'en-US';

            // Try to pick an appropriate voice based on speaker gender/tone hints
            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                const preferred = voices.find(v => {
                    const name = v.name.toLowerCase();
                    if (speaker === 'elena' || speaker === 'naomi' || speaker === 'sera') {
                        return v.lang.startsWith('en') && (name.includes('female') || name.includes('zira') || name.includes('hazel') || name.includes('susan') || name.includes('catherine') || name.includes('aria'));
                    } else {
                        return v.lang.startsWith('en') && (name.includes('male') || name.includes('david') || name.includes('mark') || name.includes('george') || name.includes('james'));
                    }
                });
                if (preferred) utterance.voice = preferred;
            }

            this.currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.warn('VoiceDubbingSystem speech error:', err);
        }
    }
}
