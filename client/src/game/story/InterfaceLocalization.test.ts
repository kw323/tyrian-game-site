import { describe, expect, it } from 'vitest';
import { getInterfaceText } from './InterfaceLocalization';

describe('InterfaceLocalization', () => {
    it('provides command navigation and graphics labels for every supported language', () => {
        for (const language of ['he', 'en', 'ja', 'zh'] as const) {
            const text = getInterfaceText(language);
            expect(text.sections.game.length).toBeGreaterThan(0);
            expect(text.sections.settings.length).toBeGreaterThan(0);
            expect(text.graphics.length).toBeGreaterThan(0);
            expect(text.quality.performance.label.length).toBeGreaterThan(0);
            expect(text.quality.standard.label.length).toBeGreaterThan(0);
            expect(text.quality.high.label.length).toBeGreaterThan(0);
        }
    });

    it('uses Hebrew as an actual localized interface, not an English fallback', () => {
        const hebrew = getInterfaceText('he');
        expect(hebrew.sections.settings).toBe('הגדרות');
        expect(hebrew.quality.standard.label).toBe('רגיל');
    });
});
