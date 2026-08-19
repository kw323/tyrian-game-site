import { describe, expect, it } from 'vitest';
import voiceLines from '../../../../english_voice_lines.json';
import localizedLines from './locales/dialogue.voice-lines.json';
import { CampaignSystem } from './CampaignSystem';

const HEBREW_CHARACTERS = /[\u0590-\u05FF]/;
const JAPANESE_CHARACTERS = /[\u3040-\u30FF\u3400-\u9FFF]/;
const CHINESE_CHARACTERS = /[\u3400-\u9FFF]/;

describe('Campaign briefing localization', () => {
    it('provides a complete English briefing without mixed Hebrew dialogue', () => {
        const opening = CampaignSystem.getStageBriefing(1, 'en');
        const finale = CampaignSystem.getStageBriefing(101, 'en');

        expect(opening.title).toContain('Stage');
        expect(opening.contact.name).toBe('Commander Elena Vail');
        expect(opening.contact.message).not.toMatch(HEBREW_CHARACTERS);
        expect(finale.dialogueSequence).toHaveLength(5);
        expect(finale.dialogueSequence?.every((line) => Boolean(line.voiceLineId))).toBe(true);
        expect(finale.afterAction?.message).not.toMatch(HEBREW_CHARACTERS);
    });

    it('provides a complete Japanese briefing with localized dialogue from the opening stage to the finale', () => {
        const opening = CampaignSystem.getStageBriefing(1, 'ja');
        const finale = CampaignSystem.getStageBriefing(101, 'ja');

        expect(opening.title).toMatch(JAPANESE_CHARACTERS);
        expect(opening.contact.name).toBe('エレナ・ヴェール司令官');
        expect(opening.contact.message).toMatch(JAPANESE_CHARACTERS);
        expect(opening.contact.message).not.toMatch(HEBREW_CHARACTERS);
        expect(finale.dialogueSequence).toHaveLength(5);
        expect(finale.afterAction?.message).toMatch(JAPANESE_CHARACTERS);
    });

    it('provides a complete Simplified Chinese briefing with localized dialogue from the opening stage to the finale', () => {
        const opening = CampaignSystem.getStageBriefing(1, 'zh');
        const finale = CampaignSystem.getStageBriefing(101, 'zh');

        expect(opening.title).toMatch(CHINESE_CHARACTERS);
        expect(opening.contact.name).toBe('埃琳娜·维尔指挥官');
        expect(opening.contact.message).toMatch(CHINESE_CHARACTERS);
        expect(opening.contact.message).not.toMatch(HEBREW_CHARACTERS);
        expect(finale.dialogueSequence).toHaveLength(5);
        expect(finale.afterAction?.message).toMatch(CHINESE_CHARACTERS);
    });

    it('exposes every authored opening exchange line with stable voice IDs in all four languages', () => {
        const hebrew = CampaignSystem.getStageBriefing(1, 'he');
        const english = CampaignSystem.getStageBriefing(1, 'en');
        const japanese = CampaignSystem.getStageBriefing(1, 'ja');
        const chinese = CampaignSystem.getStageBriefing(1, 'zh');

        expect(english.dialogueSequence).toHaveLength(3);
        expect(english.dialogueSequence?.map((line) => line.voiceLineId)).toEqual([
            'stage-1-contact-0', 'stage-1-after-1', 'stage-1-after-2'
        ]);
        expect(hebrew.dialogueSequence?.map((line) => line.speaker)).toEqual(english.dialogueSequence?.map((line) => line.speaker));
        expect(japanese.dialogueSequence?.every((line) => JAPANESE_CHARACTERS.test(line.message))).toBe(true);
        expect(chinese.dialogueSequence?.every((line) => CHINESE_CHARACTERS.test(line.message))).toBe(true);
    });

    it('keeps every stage briefing populated in all four supported languages', () => {
        for (let stage = 1; stage <= CampaignSystem.TOTAL_STAGES; stage++) {
            const hebrew = CampaignSystem.getStageBriefing(stage, 'he');
            const english = CampaignSystem.getStageBriefing(stage, 'en');
            const japanese = CampaignSystem.getStageBriefing(stage, 'ja');
            const chinese = CampaignSystem.getStageBriefing(stage, 'zh');

            expect(hebrew.contact.message).toBeTruthy();
            expect(english.contact.message).not.toMatch(HEBREW_CHARACTERS);
            expect(japanese.contact.message).toMatch(JAPANESE_CHARACTERS);
            expect(chinese.contact.message).toMatch(CHINESE_CHARACTERS);
            expect(japanese.dialogueSequence).toHaveLength(hebrew.dialogueSequence?.length ?? 0);
            expect(chinese.dialogueSequence).toHaveLength(hebrew.dialogueSequence?.length ?? 0);
        }
    });

    it('contains a complete Hebrew-canonical localization for every authored voice line', () => {
        const canonicalSource = voiceLines as Array<{ lineId: string }>;
        const translations = localizedLines as Array<{ lineId: string; en: string; ja: string; zh: string }>;
        const translationsById = new Map(translations.map((line) => [line.lineId, line]));

        expect(translations).toHaveLength(canonicalSource.length);
        expect(new Set(translations.map((line) => line.lineId)).size).toBe(canonicalSource.length);
        for (const sourceLine of canonicalSource) {
            const translated = translationsById.get(sourceLine.lineId);
            expect(translated).toBeDefined();
            expect(translated?.en.trim()).toBeTruthy();
            expect(translated?.ja.trim()).toBeTruthy();
            expect(translated?.zh.trim()).toBeTruthy();
        }
    });

    it('does not change the speaker order or dialogue count when language changes', () => {
        const englishFinale = CampaignSystem.getStageBriefing(101, 'en');
        const japaneseFinale = CampaignSystem.getStageBriefing(101, 'ja');
        const chineseFinale = CampaignSystem.getStageBriefing(101, 'zh');

        expect(japaneseFinale.dialogueSequence?.map((line) => line.speaker)).toEqual(englishFinale.dialogueSequence?.map((line) => line.speaker));
        expect(chineseFinale.dialogueSequence?.map((line) => line.speaker)).toEqual(englishFinale.dialogueSequence?.map((line) => line.speaker));
    });
});
