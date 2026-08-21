import { describe, expect, it } from 'vitest';
import { RuneSystem } from './RuneSystem';

describe('RuneSystem', () => {
    it('only drops tier-one runes and allows three distinct loadout slots', () => {
        const system = new RuneSystem();
        const assault = system.addDropRune('assault');
        const guard = system.addDropRune('guard');
        const thrust = system.addDropRune('thrust');

        expect(assault.tier).toBe(1);
        expect(system.setLoadoutSlot(0, assault.id)).toBe(true);
        expect(system.setLoadoutSlot(1, guard.id)).toBe(true);
        expect(system.setLoadoutSlot(2, thrust.id)).toBe(true);
        expect(system.getLoadout().map((rune) => rune?.runeId)).toEqual(['assault', 'guard', 'thrust']);
        expect(system.setLoadoutSlot(2, assault.id)).toBe(true);
        expect(system.getLoadout().map((rune) => rune?.runeId)).toEqual([undefined, 'guard', 'assault']);
    });

    it('fuses three matching copies only when enough credits are available', () => {
        const system = new RuneSystem();
        const copies = [system.addDropRune('radius'), system.addDropRune('radius'), system.addDropRune('radius')];

        expect(system.fuseRunes(copies.map((rune) => rune.id), 1_999)).toMatchObject({ success: false, reason: 'credits', cost: 2_000 });
        const result = system.fuseRunes(copies.map((rune) => rune.id), 2_000);
        expect(result.success).toBe(true);
        expect(result.cost).toBe(2_000);
        expect(result.rune).toMatchObject({ runeId: 'radius', tier: 2 });
        expect(system.getInventory()).toHaveLength(1);
    });

    it('provides bounded tactical profiles without turning guidance into homing', () => {
        const system = new RuneSystem();
        const timeField = system.addDropRune('time_field');
        const guidance = system.addDropRune('guidance');
        const timeProfile = system.getCombatProfile(timeField);
        const guidanceProfile = system.getCombatProfile(guidance);

        expect(timeProfile.enemyBulletSpeedMultiplier).toBeCloseTo(0.92, 5);
        expect(guidanceProfile.guidanceAngleRadians).toBeGreaterThan(0);
        expect(guidanceProfile.guidanceAngleRadians).toBeLessThan(Math.PI / 4);
    });
});
