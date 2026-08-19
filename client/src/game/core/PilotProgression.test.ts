import { describe, expect, it } from 'vitest';
import { PilotSkillSystem } from './PilotSkillSystem';
import { calculateStagePerformanceXP } from './StagePerformanceXP';
import type { StageTelemetry } from './StageMasterySystem';

const flawlessTelemetry: StageTelemetry = {
    level: 6,
    enemiesSpawned: 24,
    enemiesDefeated: 24,
    eliminationPercent: 100,
    shieldHits: 0,
    shieldDamageAbsorbed: 0,
    hullDamageTaken: 0,
    totalDamageTaken: 0,
    cleanShieldRun: true,
    weaponClearRun: true
};

describe('Pilot progression', () => {
    it('awards exactly one skill point for each new rank', () => {
        const system = new PilotSkillSystem();
        const result = system.addXP(PilotSkillSystem.XP_FOR_RANK_ONE);

        expect(result).toEqual({ rankedUp: true, ranksGained: 1 });
        expect(system.getRank()).toBe(2);
        expect(system.getSkillPoints()).toBe(1);
    });

    it('uses three branches of five-rank skills and refunds every point on respec', () => {
        const system = new PilotSkillSystem();
        system.addXP(4000);
        const node = system.getNode('aegis_protocol');
        expect(node?.maxLevel).toBe(5);

        expect(system.investPoint('aegis_protocol')).toBe(true);
        expect(system.getBonusMultiplier('aegis_protocol')).toBeCloseTo(1.04, 5);
        const beforeReset = system.getSkillPoints();
        system.resetSkills();
        expect(system.getNode('aegis_protocol')?.level).toBe(0);
        expect(system.getSkillPoints()).toBe(beforeReset + 1);
    });

    it('converts legacy investments and milestone costs into refundable new points', () => {
        const system = new PilotSkillSystem();
        system.loadSaveState({
            rank: 8,
            skillPoints: 2,
            nodes: {
                hull_integrity: { level: 4, milestonesUnlocked: [5] },
                weapon_damage: { level: 3, milestonesUnlocked: [] }
            }
        });

        expect(system.getRank()).toBe(8);
        expect(system.getSkillPoints()).toBe(12); // 2 unspent + 4 + 3 milestone + 3
        expect(system.getNode('hull_integrity')?.level).toBe(0);
    });
});

describe('Stage performance XP', () => {
    it('grants the 210% total payout for a clean sweep without taking damage', () => {
        const result = calculateStagePerformanceXP(flawlessTelemetry, 400, 100);

        expect(result.fullClear).toBe(true);
        expect(result.noHit).toBe(true);
        expect(result.totalBonusPercent).toBe(110);
        expect(result.totalXp).toBe(Math.round(result.baseXp * 2.1));
    });

    it('awards the low-damage bonus without a no-hit bonus when the shield took a small hit', () => {
        const telemetry: StageTelemetry = {
            ...flawlessTelemetry,
            shieldHits: 1,
            shieldDamageAbsorbed: 10,
            totalDamageTaken: 10,
            cleanShieldRun: true
        };
        const result = calculateStagePerformanceXP(telemetry, 400, 100);

        expect(result.noHit).toBe(false);
        expect(result.survivalBonusPercent).toBe(20);
        expect(result.noHitBonusPercent).toBe(0);
        expect(result.superBonusPercent).toBe(0);
    });
});


describe('Pilot combat modifiers', () => {
    it('applies capacitor and efficiency modifiers to the power system', async () => {
        const { PowerSystem } = await import('./PowerSystem');
        const power = new PowerSystem();
        power.setPilotModifiers(1.3, 1.2);

        expect(power.getMaxPower()).toBe(260);
        expect(power.getWeaponCost('heavy', 1)).toBeCloseTo(2 / 1.2, 5);
    });

    it('supports deterministic critical salvos at zero and full chance', async () => {
        const { Player } = await import('../entities/Player');
        const player = new Player(0, 0, 28, 46, 7.5);
        player.setCriticalProfile(1, 1.75);
        expect(player.rollCriticalSalvo()).toBe(true);
        player.setCriticalProfile(0, 1.75);
        expect(player.rollCriticalSalvo()).toBe(false);
    });
});
