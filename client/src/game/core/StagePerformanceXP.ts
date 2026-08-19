import { StageTelemetry } from './StageMasterySystem';

export interface StagePerformanceXPResult {
    baseXp: number;
    survivalBonusPercent: number;
    eliminationBonusPercent: number;
    noHitBonusPercent: number;
    superBonusPercent: number;
    totalBonusPercent: number;
    totalXp: number;
    damagePercent: number;
    fullClear: boolean;
    noHit: boolean;
}

/** Performance XP is granted only once a mission has succeeded. */
export function calculateStagePerformanceXP(
    telemetry: StageTelemetry,
    maximumHull: number,
    maximumShield: number
): StagePerformanceXPResult {
    const baseXp = 100 + telemetry.level * 8;
    const maximumDurability = Math.max(1, maximumHull + maximumShield);
    const damagePercent = Math.min(100, (telemetry.totalDamageTaken / maximumDurability) * 100);
    const noHit = telemetry.totalDamageTaken <= 0.001;
    const fullClear = telemetry.enemiesSpawned > 0 && telemetry.enemiesDefeated >= telemetry.enemiesSpawned;

    const survivalBonusPercent = noHit ? 0 : damagePercent <= 5 ? 20 : damagePercent <= 20 ? 10 : 0;
    const eliminationBonusPercent = fullClear ? 30 : telemetry.eliminationPercent >= 90 ? 10 : 0;
    const noHitBonusPercent = noHit ? 30 : 0;
    const superBonusPercent = noHit && fullClear ? 50 : 0;
    const totalBonusPercent = survivalBonusPercent + eliminationBonusPercent + noHitBonusPercent + superBonusPercent;
    const totalXp = Math.round(baseXp * (1 + totalBonusPercent / 100));

    return {
        baseXp,
        survivalBonusPercent,
        eliminationBonusPercent,
        noHitBonusPercent,
        superBonusPercent,
        totalBonusPercent,
        totalXp,
        damagePercent,
        fullClear,
        noHit
    };
}
