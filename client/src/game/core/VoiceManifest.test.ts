import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import voiceLines from '../../../../english_voice_lines.json';
import localizedLines from '../story/locales/dialogue.voice-lines.json';
import { VoiceManifest } from './VoiceManifest';

type VoiceSource = { lineId: string; speaker: string };
type LocalizedLine = { lineId: string; en: string };
const CLIENT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('Voice manifest', () => {
    it('maps every English voice file to the displayed Hebrew-canonical English sentence', () => {
        const source = voiceLines as VoiceSource[];
        const canonicalEnglishById = new Map(
            (localizedLines as LocalizedLine[]).map((line) => [line.lineId, line.en])
        );

        for (const line of source) {
            const mapping = VoiceManifest.get(line.lineId);
            expect(mapping?.text).toBe(canonicalEnglishById.get(line.lineId));
            expect(mapping?.audioUrl).toBe(`/voices/en/${line.speaker}/${line.lineId}.mp3`);

            const voiceFile = resolve(CLIENT_ROOT, 'public', mapping?.audioUrl?.replace(/^\//, '') ?? '');
            expect(existsSync(voiceFile)).toBe(true);
            expect(statSync(voiceFile).size).toBeGreaterThan(1024);
        }
    });
});
