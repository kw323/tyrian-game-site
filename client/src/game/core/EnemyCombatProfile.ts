export type CombatFaction = 'raiders' | 'military' | 'aliens';
export type CombatEnemyType = 'scout' | 'drone' | 'tank' | 'orbiter' | 'sentinel' | 'evasive_hunter';
export type EnemyMotionStyle =
    | 'raider_scout'
    | 'raider_drone'
    | 'raider_tank'
    | 'military_scout'
    | 'military_drone'
    | 'military_tank'
    | 'military_sentinel'
    | 'alien_scout'
    | 'alien_drone'
    | 'alien_orbiter'
    | 'alien_sentinel'
    | 'hunter';
export type EnemyShotPattern =
    | 'single'
    | 'cross'
    | 'heavy_fan'
    | 'aim_burst'
    | 'laser_sweep'
    | 'plasma_pair'
    | 'plasma_arc'
    | 'plasma_crown'
    | 'hunter_burst';

export interface EnemyCombatProfile {
    motion: EnemyMotionStyle;
    shotPattern: EnemyShotPattern;
    moveMultiplier: number;
    shootCooldown: number;
    projectileSpeedMultiplier: number;
}

export interface FactionWaveProfile {
    spawnRate: number;
    standardCount: number;
    chainMin: number;
    chainMax: number;
    swarmMin: number;
    swarmMax: number;
    ambushMin: number;
    ambushMax: number;
    singleMin: number;
    singleMax: number;
}

const profiles: Record<CombatFaction, Partial<Record<CombatEnemyType, EnemyCombatProfile>>> = {
    raiders: {
        scout: { motion: 'raider_scout', shotPattern: 'single', moveMultiplier: 1.35, shootCooldown: 4.0, projectileSpeedMultiplier: 1.08 },
        drone: { motion: 'raider_drone', shotPattern: 'cross', moveMultiplier: 1.25, shootCooldown: 2.7, projectileSpeedMultiplier: 1.05 },
        tank: { motion: 'raider_tank', shotPattern: 'heavy_fan', moveMultiplier: 0.72, shootCooldown: 3.6, projectileSpeedMultiplier: 0.92 },
        evasive_hunter: { motion: 'hunter', shotPattern: 'hunter_burst', moveMultiplier: 1.30, shootCooldown: 1.9, projectileSpeedMultiplier: 1.12 },
    },
    military: {
        scout: { motion: 'military_scout', shotPattern: 'single', moveMultiplier: 0.95, shootCooldown: 1.65, projectileSpeedMultiplier: 1.02 },
        drone: { motion: 'military_drone', shotPattern: 'aim_burst', moveMultiplier: 0.92, shootCooldown: 1.25, projectileSpeedMultiplier: 1.0 },
        tank: { motion: 'military_tank', shotPattern: 'heavy_fan', moveMultiplier: 0.65, shootCooldown: 2.0, projectileSpeedMultiplier: 0.86 },
        sentinel: { motion: 'military_sentinel', shotPattern: 'laser_sweep', moveMultiplier: 0.82, shootCooldown: 1.45, projectileSpeedMultiplier: 1.08 },
        evasive_hunter: { motion: 'hunter', shotPattern: 'hunter_burst', moveMultiplier: 1.12, shootCooldown: 2.0, projectileSpeedMultiplier: 1.08 },
    },
    aliens: {
        scout: { motion: 'alien_scout', shotPattern: 'single', moveMultiplier: 1.0, shootCooldown: 2.25, projectileSpeedMultiplier: 0.86 },
        drone: { motion: 'alien_drone', shotPattern: 'plasma_pair', moveMultiplier: 1.03, shootCooldown: 1.85, projectileSpeedMultiplier: 0.88 },
        orbiter: { motion: 'alien_orbiter', shotPattern: 'plasma_arc', moveMultiplier: 0.96, shootCooldown: 1.55, projectileSpeedMultiplier: 0.84 },
        sentinel: { motion: 'alien_sentinel', shotPattern: 'plasma_crown', moveMultiplier: 0.90, shootCooldown: 1.75, projectileSpeedMultiplier: 0.80 },
        evasive_hunter: { motion: 'hunter', shotPattern: 'hunter_burst', moveMultiplier: 1.18, shootCooldown: 2.05, projectileSpeedMultiplier: 1.0 },
    },
};

const waveProfiles: Record<CombatFaction, FactionWaveProfile> = {
    raiders: { spawnRate: 1.22, standardCount: 3, chainMin: 6, chainMax: 9, swarmMin: 10, swarmMax: 14, ambushMin: 8, ambushMax: 12, singleMin: 4, singleMax: 7 },
    military: { spawnRate: 1.80, standardCount: 2, chainMin: 4, chainMax: 6, swarmMin: 6, swarmMax: 9, ambushMin: 4, ambushMax: 6, singleMin: 3, singleMax: 5 },
    aliens: { spawnRate: 1.55, standardCount: 2, chainMin: 4, chainMax: 6, swarmMin: 7, swarmMax: 10, ambushMin: 5, ambushMax: 7, singleMin: 3, singleMax: 6 },
};

const fallback: EnemyCombatProfile = {
    motion: 'raider_scout',
    shotPattern: 'single',
    moveMultiplier: 1,
    shootCooldown: 2.5,
    projectileSpeedMultiplier: 1,
};

export function getEnemyCombatProfile(faction: CombatFaction, enemyType: CombatEnemyType): EnemyCombatProfile {
    return profiles[faction][enemyType] ?? fallback;
}

export function getFactionWaveProfile(faction: CombatFaction): FactionWaveProfile {
    return waveProfiles[faction];
}
