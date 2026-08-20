import { describe, expect, it } from 'vitest';
import { getGraphicsQualityProfile, isGraphicsQuality } from './GraphicsSettings';

describe('GraphicsSettings', () => {
    it('recognizes the three supported player-facing quality levels', () => {
        expect(isGraphicsQuality('performance')).toBe(true);
        expect(isGraphicsQuality('standard')).toBe(true);
        expect(isGraphicsQuality('high')).toBe(true);
        expect(isGraphicsQuality('ultra')).toBe(false);
    });

    it('keeps standard as a balanced middle profile', () => {
        const performance = getGraphicsQualityProfile('performance');
        const standard = getGraphicsQualityProfile('standard');
        const high = getGraphicsQualityProfile('high');

        expect(performance.maxParticles).toBeLessThan(standard.maxParticles);
        expect(standard.maxParticles).toBeLessThan(high.maxParticles);
        expect(performance.nebulaCount).toBe(0);
        expect(standard.id).toBe('standard');
    });
});
