import { describe, expect, it } from 'vitest';
import { ElementalCoreSystem, ELEMENTAL_CORE_ORDER } from './ElementalCoreSystem';

describe('ElementalCoreSystem', () => {
    it('provides exactly five switchable cores with an initial rank', () => {
        const cores = new ElementalCoreSystem();
        expect(ELEMENTAL_CORE_ORDER).toEqual(['cryo', 'fire', 'corrosion', 'kinetic', 'plasma']);
        expect(cores.getAllProfiles()).toHaveLength(5);
        expect(cores.getAllProfiles().every((core) => core.rank === 1)).toBe(true);
    });

    it('charges credits only for valid upgrades and caps each core at rank five', () => {
        const cores = new ElementalCoreSystem();
        expect(cores.upgrade('fire', 0)).toBeNull();

        let credits = 1_000_000;
        for (let upgrade = 0; upgrade < 4; upgrade++) {
            const spent = cores.upgrade('fire', credits);
            expect(spent).not.toBeNull();
            credits -= spent ?? 0;
        }
        expect(cores.getRank('fire')).toBe(5);
        expect(cores.getNextCost('fire')).toBeNull();
    });

    it('persists both the selected core and its upgrade ranks', () => {
        const source = new ElementalCoreSystem();
        source.selectCore('plasma');
        source.upgrade('plasma', 999_999);
        source.upgrade('cryo', 999_999);

        const restored = new ElementalCoreSystem();
        restored.loadSaveState(source.getSaveState());
        expect(restored.getActiveCore()).toBe('plasma');
        expect(restored.getRank('plasma')).toBe(2);
        expect(restored.getRank('cryo')).toBe(2);
    });
});
