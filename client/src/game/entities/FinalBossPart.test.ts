import { describe, expect, it } from 'vitest';
import { DifficultySystem } from '../core/DifficultySystem';
import { FinalBossAssembly } from './FinalBossPart';

describe('FinalBossAssembly presentation', () => {
    it('places the final boss as a centred connected flagship across the combat arena', () => {
        const assembly = new FinalBossAssembly(DifficultySystem.get('normal'));
        const parts = assembly.createParts();
        const core = parts.find((part) => part.partId === 'core')!;
        const leftBattery = parts.find((part) => part.partId === 'rear-port')!;
        const rightBattery = parts.find((part) => part.partId === 'rear-starboard')!;

        expect(parts).toHaveLength(5);
        expect(core.x + core.width / 2).toBeCloseTo(600, 0);
        expect(leftBattery.x + leftBattery.width).toBeGreaterThan(core.x);
        expect(rightBattery.x).toBeLessThan(core.x + core.width);
    });
});
