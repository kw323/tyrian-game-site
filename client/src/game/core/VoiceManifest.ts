import linesData from '../../../../english_voice_lines.json';
import localizedLines from '../story/locales/dialogue.voice-lines.json';

export interface VoiceLineMapping {
    lineId: string;
    speaker: 'elena' | 'naomi' | 'ghost' | 'sera' | 'pilot' | 'archon';
    text: string;
    audioUrl?: string;
}

export class VoiceManifest {
    private static lines: Map<string, VoiceLineMapping> = new Map();
    private static initialized = false;

    private static init(): void {
        if (this.initialized) return;
        this.initialized = true;
        try {
            const rawList = linesData as Array<{ lineId: string; speaker: any; text: string }>;
            const localizedByLineId = new Map(
                (localizedLines as Array<{ lineId: string; en?: string }>).map((line) => [line.lineId, line.en])
            );
            rawList.forEach(item => {
                this.lines.set(item.lineId, {
                    lineId: item.lineId,
                    speaker: item.speaker || 'elena',
                    text: localizedByLineId.get(item.lineId) || item.text,
                    audioUrl: `/voices/en/${item.speaker || 'elena'}/${item.lineId}.mp3`
                });
            });
        } catch (e) {
            console.warn('VoiceManifest init warning:', e);
        }
    }

    public static get(lineId: string): VoiceLineMapping | undefined {
        this.init();
        return this.lines.get(lineId);
    }
}
