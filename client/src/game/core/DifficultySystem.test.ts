import { describe, expect, it } from 'vitest';
import { DifficultySystem } from './DifficultySystem';

describe('DifficultySystem progression', () => {
    it('keeps hostile pressure non-decreasing from Recruit through Nightmare', () => {
        const profiles = DifficultySystem.PROFILES;
        for (let index = 1; index < profiles.length; index++) {
            const previous = profiles[index - 1];
            const current = profiles[index];
            expect(current.healthMultiplier).toBeGreaterThanOrEqual(previous.healthMultiplier);
            expect(current.shieldMultiplier).toBeGreaterThanOrEqual(previous.shieldMultiplier);
            expect(current.damageMultiplier).toBeGreaterThanOrEqual(previous.damageMultiplier);
            expect(current.speedMultiplier).toBeGreaterThanOrEqual(previous.speedMultiplier);
            expect(current.fireRateMultiplier).toBeGreaterThanOrEqual(previous.fireRateMultiplier);
            expect(current.bossMultiplier).toBeGreaterThanOrEqual(previous.bossMultiplier);
        }
    });

    it('uses Pilot as the neutral standard baseline', () => {
        const pilot = DifficultySystem.get('pilot');
        expect(pilot.healthMultiplier).toBe(1);
        expect(pilot.shieldMultiplier).toBe(1);
        expect(pilot.damageMultiplier).toBe(1);
        expect(pilot.speedMultiplier).toBe(1);
        expect(pilot.fireRateMultiplier).toBe(1);
        expect(pilot.bossMultiplier).toBe(1);
    });
});
