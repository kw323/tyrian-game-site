import { describe, expect, it } from 'vitest';
import { Boss } from '../entities/Boss';
import { FinalBossAssembly } from '../entities/FinalBossPart';
import { SeraAllyShipEntity } from '../entities/SeraAllyShipEntity';
import type { DifficultyProfile } from './DifficultySystem';

const difficulty: DifficultyProfile = {
    id: 'test',
    label: 'Test',
    bossMultiplier: 1,
    shieldMultiplier: 1,
    fireRateMultiplier: 1,
    damageMultiplier: 1,
    rewardMultiplier: 1,
};

describe('Endgame combat overhaul', () => {
    it('cycles regular bosses through distinct combat profiles and hull phases', () => {
        const duelist = new Boss(400, 120, 3);
        const siege = new Boss(400, 120, 6);
        const controller = new Boss(400, 120, 9);
        expect(duelist.getCombatProfile()).toBe('duelist');
        expect(siege.getCombatProfile()).toBe('siege');
        expect(controller.getCombatProfile()).toBe('controller');

        duelist.shield = 0;
        duelist.takeDamage(duelist.maxHealth * 0.4);
        duelist.update(0.016);
        expect(duelist.getCombatPhase()).toBe(1);
        duelist.takeDamage(duelist.maxHealth * 0.4);
        duelist.update(0.016);
        expect(duelist.getCombatPhase()).toBe(2);
    });

    it('unlocks Archon in the authored forward batteries, rear batteries, then command core sequence', () => {
        const assembly = new FinalBossAssembly(difficulty);
        const parts = assembly.createParts();
        const core = parts.find((part) => part.role === 'core')!;
        const frontSystems = parts.filter((part) => part.role === 'front_cannon');
        const rearSystems = parts.filter((part) => part.role === 'rear_battery');

        expect(parts).toHaveLength(5);
        expect(assembly.getPhase()).toBe(1);
        expect(assembly.isPartEnabled(core)).toBe(false);
        expect(assembly.isPartEnabled(rearSystems[0])).toBe(false);
        expect(assembly.isPartEnabled(frontSystems[0])).toBe(true);
        const coreHealth = core.health;
        core.takeDamage(1000000);
        expect(core.health).toBe(coreHealth);

        frontSystems.forEach((part) => {
            part.shield = 0;
            part.takeDamage(part.health + 1);
        });
        expect(assembly.getPhase()).toBe(2);
        expect(assembly.isPartEnabled(rearSystems[0])).toBe(true);
        expect(assembly.isPartEnabled(core)).toBe(false);

        rearSystems.forEach((part) => {
            part.shield = 0;
            part.takeDamage(part.health + 1);
        });
        expect(assembly.getPhase()).toBe(3);
        expect(assembly.isReactorExposed()).toBe(true);

        core.shield = 0;
        core.takeDamage(core.health + 1);
        expect(assembly.isMeltdownActive()).toBe(true);
        assembly.update(6.5);
        expect(assembly.isDefeated()).toBe(true);
    });

    it('gives Sera an aggressive boss-focus state and Over Power burst', () => {
        const sera = new SeraAllyShipEntity(420, 620, {
            shipTier: 3,
            shipName: 'Battleship',
            weaponType: 'laser',
            weaponLevel: 12,
            weaponDamage: 40,
            weaponFireRate: 12,
            weaponCost: 5,
            maxShield: 180,
            shieldRegenRate: 12,
            generatorLevel: 28,
            generatorOutput: 253,
            maxPower: 200,
            ability: 'over_power',
            abilityLevel: 5,
            abilityDuration: 5,
            pilotInvestmentBudget: 0,
        });
        sera.setCombatSnapshot([{ x: 400, y: 170, priority: 'boss', healthRatio: 1 }], []);
        expect(sera.getCombatState()).toBe('BOSS FOCUS');
        sera.update(3);
        expect(sera.isOverPowered()).toBe(true);
        expect(sera.shoot().length).toBeGreaterThan(0);
    });
});
