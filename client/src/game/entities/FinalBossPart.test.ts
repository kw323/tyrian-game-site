import { describe, expect, it } from 'vitest';
import { DifficultySystem } from '../core/DifficultySystem';
import { FinalBossAssembly } from './FinalBossPart';

describe('FinalBossAssembly presentation', () => {
    it('places the final boss as a centred connected flagship across the combat arena', () => {
        const assembly = new FinalBossAssembly(DifficultySystem.get('normal'));
        const parts = assembly.createParts();
        const core = parts.find((part) => part.partId === 'core')!;
        const leftWing = parts.find((part) => part.partId === 'left-wing')!;
        const rightWing = parts.find((part) => part.partId === 'right-wing')!;

        expect(core.x + core.width / 2).toBeCloseTo(600, 0);
        expect(leftWing.x + leftWing.width).toBeGreaterThan(core.x);
        expect(rightWing.x).toBeLessThan(core.x + core.width);
    });
});
