import { describe, expect, it } from 'vitest';
import { WeaponType, WeaponUpgradeSystem } from './WeaponUpgradeSystem';
import { PowerSystem } from './PowerSystem';

const MASTERY_RATE_MULTIPLIER = 1.08;
const MAX_GENERATOR_OUTPUT = 15 + 49 * 8.5;

describe('PowerSystem high-rank balance', () => {
    it('uses the calibrated Rank-25 power costs', () => {
        const power = new PowerSystem();
        expect(power.getWeaponCost('straight', 24)).toBe(8);
        expect(power.getWeaponCost('spread', 24)).toBe(17);
        expect(power.getWeaponCost('homing', 24)).toBe(26);
        expect(power.getWeaponCost('heavy', 24)).toBe(51);
        expect(power.getWeaponCost('laser', 24)).toBe(27);
        expect(power.getWeaponCost('void_lance', 24)).toBe(73);
    });

    it('keeps Rank-25 special weapons near a 2.5-second burst at maximum generator output', () => {
        const weapons = new WeaponUpgradeSystem();
        const power = new PowerSystem();
        const specialWeapons = [WeaponType.SPREAD, WeaponType.HOMING, WeaponType.HEAVY, WeaponType.LASER, WeaponType.VOID_LANCE];

        for (const type of specialWeapons) {
            const rank = weapons.getWeaponLevels(type)[24];
            const drainWithMastery = power.getWeaponCost(type, 24) * rank.fireRate * MASTERY_RATE_MULTIPLIER;
            const burstSeconds = 200 / (drainWithMastery - MAX_GENERATOR_OUTPUT);
            expect(burstSeconds).toBeGreaterThan(2.2);
            expect(burstSeconds).toBeLessThan(2.6);
        }

        const straight = weapons.getWeaponLevels(WeaponType.STRAIGHT)[24];
        const straightDraw = power.getWeaponCost('straight', 24) * straight.fireRate * MASTERY_RATE_MULTIPLIER;
        expect(straightDraw).toBeLessThan(MAX_GENERATOR_OUTPUT);
    });

    it('locks weapons after a full drain and unlocks only after a complete recharge', () => {
        const power = new PowerSystem();
        power.generatorLevel = 49;
        power.currentPower = 8;
        power.consumePower(8);

        expect(power.isReactorRecovering()).toBe(true);
        expect(power.canShoot('straight', 0)).toBe(false);

        power.generatePower(0.5);
        expect(power.getReactorRecoveryPercent()).toBeGreaterThan(0);
        expect(power.getReactorRecoveryPercent()).toBeLessThan(1);
        expect(power.isReactorRecovering()).toBe(true);
        expect(power.canShoot('straight', 0)).toBe(false);

        power.generatePower(0.5);
        expect(power.getReactorRecoveryPercent()).toBe(1);
        expect(power.isReactorRecovering()).toBe(false);
        expect(power.canShoot('straight', 0)).toBe(true);
    });

    it('bypasses the recovery lock when an unlimited-power effect forces the reactor online', () => {
        const power = new PowerSystem();
        power.currentPower = 5;
        power.consumePower(5);
        expect(power.isReactorRecovering()).toBe(true);

        power.forceReactorOnline();
        expect(power.isReactorRecovering()).toBe(false);
        expect(power.getReactorRecoveryPercent()).toBe(1);
    });
});
