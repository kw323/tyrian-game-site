import { describe, expect, it } from 'vitest';
import { TacticalAbilitySystem, TacticalAbilityType } from './TacticalAbilitySystem';

const DESTROYER_TIER = TacticalAbilitySystem.REQUIRED_SHIP_TIER;
const UNLIMITED_CREDITS = 20_000_000;

function install(system: TacticalAbilitySystem, type: TacticalAbilityType, upgrades = 1): void {
    for (let index = 0; index < upgrades; index++) {
        expect(system.upgradeAbility(type, UNLIMITED_CREDITS, DESTROYER_TIER)).not.toBeNull();
    }
    expect(system.selectAbility(type, DESTROYER_TIER)).toBe(true);
}

describe('TacticalAbilitySystem balance', () => {
    it('caps Time Lock and Over Power at three seconds while Void Armor caps at five', () => {
        const system = new TacticalAbilitySystem();
        install(system, TacticalAbilityType.TIME_LOCK, 5);
        expect(system.getAbilityLevel(TacticalAbilityType.TIME_LOCK)?.duration).toBe(3);

        install(system, TacticalAbilityType.OVER_POWER, 5);
        expect(system.getAbilityLevel(TacticalAbilityType.OVER_POWER)?.duration).toBe(3);

        install(system, TacticalAbilityType.VOID_ARMOR, 5);
        expect(system.getAbilityLevel(TacticalAbilityType.VOID_ARMOR)?.duration).toBe(5);
        expect(system.getAbilityLevel(TacticalAbilityType.PHASE_CLOAK)).toBeNull();
    });

    it('charges one cartridge passively in twenty seconds and adds only 0.1 percent per kill', () => {
        const system = new TacticalAbilitySystem();
        install(system, TacticalAbilityType.TIME_LOCK);

        expect(system.addKillCharge(100, DESTROYER_TIER)).toBeCloseTo(0.1, 5);
        expect(system.getCharge()).toBeCloseTo(0.1, 5);
        system.addTimeCharge(19.96, DESTROYER_TIER);
        expect(system.isChargeFull()).toBe(false);
        system.addTimeCharge(0.02, DESTROYER_TIER);
        expect(system.getCharge()).toBeCloseTo(100, 5);
        expect(system.getStoredUses()).toBe(1);
    });

    it('stores up to three activations after purchasing expensive reserve cartridges', () => {
        const system = new TacticalAbilitySystem();
        install(system, TacticalAbilityType.OVER_POWER);

        expect(system.purchaseMagazine(UNLIMITED_CREDITS, DESTROYER_TIER)).toEqual({ cost: 2_000_000, capacity: 2 });
        expect(system.purchaseMagazine(UNLIMITED_CREDITS, DESTROYER_TIER)).toEqual({ cost: 4_000_000, capacity: 3 });
        expect(system.getMagazineCapacity()).toBe(3);
        expect(system.purchaseMagazine(UNLIMITED_CREDITS, DESTROYER_TIER)).toBeNull();

        system.addTimeCharge(60, DESTROYER_TIER);
        expect(system.getCharge()).toBe(300);
        expect(system.getStoredUses()).toBe(3);

        expect(system.activate(DESTROYER_TIER)).toBe(true);
        expect(system.getCharge()).toBe(200);
        system.update(2);
        expect(system.isActive()).toBe(false);
        expect(system.getStoredUses()).toBe(2);
    });

    it('preserves the cartridge capacity in a save state', () => {
        const system = new TacticalAbilitySystem();
        install(system, TacticalAbilityType.VOID_ARMOR);
        system.purchaseMagazine(UNLIMITED_CREDITS, DESTROYER_TIER);
        const restored = new TacticalAbilitySystem();
        restored.loadSaveState(system.getSaveState());

        expect(restored.getMagazineCapacity()).toBe(2);
        expect(restored.getCurrentLevel(TacticalAbilityType.VOID_ARMOR)).toBe(1);
        expect(restored.getCurrentAbility()).toBe(TacticalAbilityType.VOID_ARMOR);
    });
});
