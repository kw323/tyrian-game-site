import { describe, expect, it } from 'vitest';
import { ENVIRONMENTAL_SINGULARITY_STAGES, usesEnvironmentalSingularity } from './EnvironmentalHazardSystem';

describe('Environmental singularity hazards', () => {
    it('activates the ten planned late-campaign singularity stages', () => {
        expect([...ENVIRONMENTAL_SINGULARITY_STAGES]).toEqual([70, 75, 80, 85, 90, 93, 95, 98, 99, 100]);
        ENVIRONMENTAL_SINGULARITY_STAGES.forEach((stage) => {
            expect(usesEnvironmentalSingularity(stage, 'patrol')).toBe(stage % 5 === 0);
        });
        expect(usesEnvironmentalSingularity(93, 'singularity')).toBe(true);
        expect(usesEnvironmentalSingularity(98, 'singularity')).toBe(true);
    });

    it('does not intrude on the asteroid escape chapter or the final boss stage', () => {
        expect(usesEnvironmentalSingularity(50, 'singularity')).toBe(false);
        expect(usesEnvironmentalSingularity(59, 'singularity')).toBe(false);
        expect(usesEnvironmentalSingularity(101, 'patrol')).toBe(false);
    });
});
