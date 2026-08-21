export type EnvironmentalMissionType = 'patrol' | 'defense' | 'escort' | 'bounty' | 'recovery' | 'singularity' | string;

/**
 * Environmental singularities are a late-campaign hazard. They begin only after
 * the asteroid escape chapter and appear on every fifth late stage plus every
 * late singularity operation. Keeping the rule pure makes the spawn contract
 * testable and prevents a briefing label from drifting away from gameplay.
 */
export function usesEnvironmentalSingularity(stage: number, missionType?: EnvironmentalMissionType): boolean {
    return stage >= 70 && (stage % 5 === 0 || missionType === 'singularity');
}

export const ENVIRONMENTAL_SINGULARITY_STAGES = [70, 75, 80, 85, 90, 93, 95, 98, 99, 100] as const;
