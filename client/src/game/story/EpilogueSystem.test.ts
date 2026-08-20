import { describe, expect, it } from 'vitest';
import { getEpilogueInterfaceCopy, getEpilogueScenes } from './EpilogueSystem';

const languages = ['he', 'en', 'ja', 'zh'] as const;
const expectedSceneIds = ['elena', 'sera', 'rahav', 'naomi', 'protagonist', 'ghost'];

describe('EpilogueSystem', () => {
    it('provides the six approved character endings in every supported language', () => {
        for (const language of languages) {
            const scenes = getEpilogueScenes(language);
            expect(scenes).toHaveLength(6);
            expect(scenes.map((scene) => scene.id)).toEqual(expectedSceneIds);
            for (const scene of scenes) {
                expect(scene.characterName.length).toBeGreaterThan(0);
                expect(scene.title.length).toBeGreaterThan(0);
                expect(scene.body).toHaveLength(2);
                expect(scene.body.every((paragraph) => paragraph.length > 0)).toBe(true);
                expect(scene.imageUrl).toMatch(/^\/epilogue\/.+\.png$/);
            }
        }
    });

    it('keeps Hebrew as a true canonical localization and localizes the surrounding interface', () => {
        const hebrewScenes = getEpilogueScenes('he');
        const hebrewCopy = getEpilogueInterfaceCopy('he');
        expect(hebrewScenes[3].characterName).toBe('ד״ר נעמי');
        expect(hebrewScenes[2].body[1]).toContain('מופעל באמצעות טכנולוגיה גנובה');
        expect(hebrewCopy.previous).toBe('הקודם');
        for (const language of languages) {
            const copy = getEpilogueInterfaceCopy(language);
            expect(copy.campaignComplete.length).toBeGreaterThan(0);
            expect(copy.returnToTitle.length).toBeGreaterThan(0);
        }
    });
});
