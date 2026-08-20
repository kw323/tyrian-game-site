import { describe, expect, it } from 'vitest';
import { getNaomiTutorialStorageKey, getNaomiUpgradeTutorial, NaomiTutorialTopic } from './NaomiUpgradeTutorials';

const topics: NaomiTutorialTopic[] = [
    'weapon',
    'elemental_core',
    'generator',
    'shield',
    'engine',
    'ship',
    'time_lock',
    'void_armor',
    'over_power',
    'phase_cloak',
    'tactical_magazine'
];

describe('NaomiUpgradeTutorials', () => {
    it('provides a non-empty first-time briefing in every supported language', () => {
        for (const language of ['he', 'en', 'ja', 'zh'] as const) {
            for (const topic of topics) {
                const tutorial = getNaomiUpgradeTutorial(topic, language, 'E');
                expect(tutorial.title.length).toBeGreaterThan(0);
                expect(tutorial.message.length).toBeGreaterThan(20);
            }
        }
    });

    it('inserts the player tactical binding into ability tutorials', () => {
        expect(getNaomiUpgradeTutorial('time_lock', 'he', 'Q').message).toContain('Q');
        expect(getNaomiUpgradeTutorial('over_power', 'en', 'R').message).toContain('R');
    });

    it('uses a stable one-time storage key for each subject', () => {
        expect(getNaomiTutorialStorageKey('generator')).toBe('tyrian_naomi_upgrade_tutorial_v1_generator');
        expect(getNaomiTutorialStorageKey('generator')).not.toBe(getNaomiTutorialStorageKey('shield'));
    });
});
