export type RuntimeWeaponType = 'straight' | 'spread' | 'homing' | 'heavy' | 'laser' | 'arc' | 'void_lance';

export interface WeaponRuntimeProfile {
    projectileCount: number;
    spreadAngle?: number;
    missileSpeed?: number;
    missileTurnSpeed?: number;
    heavyShellSize?: number;
    heavyFragmentCount?: number;
    heavyFragmentSpeed?: number;
    heavyCascadePellets?: number;
    laserSecondaryBeamCount?: number;
    laserSecondaryAngle?: number;
    laserPrimaryWidth?: number;
    laserSecondaryWidth?: number;
    laserPrimaryTargets?: number;
    laserSecondaryTargets?: number;
    voidFieldRadius?: number;
    voidFieldDuration?: number;
    voidSuctionStrength?: number;
    voidProjectileSpeed?: number;
    voidProjectileCaptureRadius?: number;
    arcChainJumps?: number;
    arcChainRange?: number;
    arcProjectileSpeed?: number;
}

/**
 * Every Split Bomb opens as a four-corner burst: forward-left, forward-right,
 * back-left and back-right. Extra high-rank fragments fill shallow diagonal lanes,
 * but no fragment travels straight on the parent shell's axis.
 */
export function getHeavyFragmentAngles(fragmentCount: number, parentAngle = 0): number[] {
    const count = Math.max(1, Math.floor(fragmentCount));
    const fourCorners = [-0.68, 0.68, Math.PI - 0.68, Math.PI + 0.68];
    const extraDiagonals = [-0.28, 0.28, Math.PI - 0.28, Math.PI + 0.28];
    const offsets = [...fourCorners, ...extraDiagonals];

    return Array.from({ length: count }, (_, index) => parentAngle + offsets[index % offsets.length]);
}

const clampLevel = (level: number): number => Math.max(0, Math.min(24, Math.floor(level)));
const formatNumber = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(1);

/**
 * The single source of truth for every rank's visible weapon pattern.
 * Values use the internal zero-based level while player-facing ranks are level + 1.
 */
export function getWeaponRuntimeProfile(type: RuntimeWeaponType, requestedLevel: number): WeaponRuntimeProfile {
    const level = clampLevel(requestedLevel);
    const rank = level + 1;

    switch (type) {
        case 'straight':
            return { projectileCount: 1 + Math.floor(level / 2) };
        case 'spread':
            return {
                projectileCount: 1 + Math.floor(level / 2),
                spreadAngle: Math.min(0.95, 0.42 + level * 0.022)
            };
        case 'homing':
            return {
                projectileCount: rank >= 21 ? 5 : rank >= 15 ? 4 : rank >= 9 ? 3 : rank >= 4 ? 2 : 1,
                missileSpeed: 11 + level * 0.18,
                missileTurnSpeed: 2.6 + level * 0.09
            };
        case 'heavy':
            return {
                projectileCount: rank >= 21 ? 3 : rank >= 11 ? 2 : 1,
                heavyShellSize: 14 + level * 0.22,
                heavyFragmentCount: rank >= 21 ? 6 : rank >= 15 ? 5 : 4,
                heavyFragmentSpeed: 11 + level * 0.08,
                heavyCascadePellets: rank >= 16 ? 3 : rank >= 8 ? 2 : 0
            };
        case 'laser': {
            const primaryTargets = Math.min(6, 1 + Math.floor(rank / 3));
            const secondaryBeams = rank >= 19 ? 4 : rank >= 7 ? 2 : 0;
            return {
                projectileCount: 1 + secondaryBeams,
                laserSecondaryBeamCount: secondaryBeams,
                laserSecondaryAngle: Math.min(0.24, 0.12 + level * 0.006),
                laserPrimaryWidth: 5 + rank * 0.95,
                laserSecondaryWidth: Math.max(2.5, 2.5 + rank * 0.4),
                laserPrimaryTargets: primaryTargets,
                laserSecondaryTargets: Math.max(1, Math.floor(primaryTargets * 0.6))
            };
        }
        case 'arc':
            return {
                projectileCount: 1,
                arcChainJumps: rank >= 22 ? 6 : rank >= 17 ? 5 : rank >= 12 ? 4 : rank >= 7 ? 3 : 2,
                arcChainRange: 158 + level * 4,
                arcProjectileSpeed: 13 + level * 0.08
            };
        case 'void_lance':
            return {
                projectileCount: rank >= 22 ? 4 : rank >= 14 ? 3 : rank >= 7 ? 2 : 1,
                // A slow-moving singularity stays in the combat space long enough to
                // control lanes. Higher ranks widen and intensify its event horizon.
                voidProjectileSpeed: 7.4 - level * 0.05,
                voidFieldRadius: 44 + level * 5,
                voidFieldDuration: 1.65 + level * 0.05,
                voidSuctionStrength: 1.2 + level * 0.14,
                voidProjectileCaptureRadius: 11 + level * 0.7
            };
    }
}

/** Uses the same runtime profile shown during firing, so copy cannot drift from gameplay. */
export function getWeaponUpgradeDescription(
    type: RuntimeWeaponType,
    level: number,
    damage: number,
    fireRate: number
): string {
    const rank = clampLevel(level) + 1;
    const profile = getWeaponRuntimeProfile(type, level);
    const baseStats = `${damage} DMG • ${formatNumber(fireRate)}/s`;

    switch (type) {
        case 'straight':
            return `Rank ${rank}: ${profile.projectileCount} parallel bolts • ${baseStats}`;
        case 'spread':
            return `Rank ${rank}: ${profile.projectileCount}-pellet fan • ±${profile.spreadAngle?.toFixed(2)} rad • ${baseStats}`;
        case 'homing':
            return `Rank ${rank}: ${profile.projectileCount} seekers • speed ${profile.missileSpeed?.toFixed(1)} • tracking ${profile.missileTurnSpeed?.toFixed(1)} • ${baseStats}`;
        case 'heavy':
            return `Rank ${rank}: ${profile.projectileCount} shell${profile.projectileCount === 1 ? '' : 's'} • ${profile.heavyFragmentCount} fragments${profile.heavyCascadePellets ? ` • ${profile.heavyCascadePellets}-pellet cascade` : ''} • ${baseStats}`;
        case 'laser':
            return `Rank ${rank}: ${profile.projectileCount} beam${profile.projectileCount === 1 ? '' : 's'} • width ${profile.laserPrimaryWidth?.toFixed(1)} • pierces ${profile.laserPrimaryTargets} • ${baseStats}`;
        case 'arc':
            return `Rank ${rank}: fixed lightning • ${profile.arcChainJumps} jumps • each jump deals 50% less • range ${profile.arcChainRange} • ${baseStats}`;
        case 'void_lance':
            return `Rank ${rank}: ${profile.projectileCount} slow singularit${profile.projectileCount === 1 ? 'y' : 'ies'} • radius ${profile.voidFieldRadius} • ${profile.voidFieldDuration?.toFixed(2)}s • pull ${profile.voidSuctionStrength?.toFixed(2)} • ${baseStats}`;
    }
}
