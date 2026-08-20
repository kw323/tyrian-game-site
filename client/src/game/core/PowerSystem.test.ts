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
        expect(power.getWeaponCost('laser', 24)).toBe(40);
        expect(power.getWeaponCost('arc', 24)).toBe(28.5);
        expect(power.getWeaponCost('void_lance', 24)).toBe(73);
    });

    it('makes Rank-25 laser fire create a controlled 2.5-second burst at maximum generator output', () => {
        const weapons = new WeaponUpgradeSystem();
        const power = new PowerSystem();
        power.generatorLevel = 49;
        const rank = weapons.getWeaponLevels(WeaponType.LASER)[24];
        const drainWithMastery = power.getWeaponCost(WeaponType.LASER, 24) * rank.fireRate * MASTERY_RATE_MULTIPLIER;
        const burstSeconds = power.getMaxPower() / (drainWithMastery - MAX_GENERATOR_OUTPUT);

        expect(power.getMaxPower()).toBe(849);
        expect(burstSeconds).toBeGreaterThan(2.3);
        expect(burstSeconds).toBeLessThan(2.7);

        const midRankLaser = weapons.getWeaponLevels(WeaponType.LASER)[18];
        const midRankDraw = power.getWeaponCost(WeaponType.LASER, 18) * midRankLaser.fireRate * MASTERY_RATE_MULTIPLIER;
        expect(midRankDraw).toBeLessThan(MAX_GENERATOR_OUTPUT);
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

        power.generatePower(2);
        expect(power.getReactorRecoveryPercent()).toBeLessThan(1);
        expect(power.isReactorRecovering()).toBe(true);

        power.generatePower(1);
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
