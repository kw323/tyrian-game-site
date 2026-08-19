import { describe, expect, it } from 'vitest';
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

    it('does not change the speaker order or dialogue count when language changes', () => {
        const englishFinale = CampaignSystem.getStageBriefing(101, 'en');
        const japaneseFinale = CampaignSystem.getStageBriefing(101, 'ja');
        const chineseFinale = CampaignSystem.getStageBriefing(101, 'zh');

        expect(japaneseFinale.dialogueSequence?.map((line) => line.speaker)).toEqual(englishFinale.dialogueSequence?.map((line) => line.speaker));
        expect(chineseFinale.dialogueSequence?.map((line) => line.speaker)).toEqual(englishFinale.dialogueSequence?.map((line) => line.speaker));
    });
});
