export interface ShipDefenseProfile {
    /** Durable, non-regenerating structure of the craft. */
    hullHealth: number;
    /** Regenerating Aegis layer; deliberately smaller than the hull. */
    shieldCapacity: number;
    /** Shield points restored per second after the recovery delay. */
    shieldRegenRate: number;
}

/**
 * Baseline combat endurance by hull class.
 *
 * Hull is the primary survival resource.  The Aegis shield absorbs initial
 * damage, but cannot replace the hull because overflow damage now carries
 * through and shield recovery pauses after a hit.
 */
const SHIP_DEFENSE_PROFILES: readonly ShipDefenseProfile[] = [
    { hullHealth: 220, shieldCapacity: 65, shieldRegenRate: 4.0 },  // Mk.1 Scout Vanguard
    { hullHealth: 300, shieldCapacity: 80, shieldRegenRate: 4.5 },  // Mk.2 Interceptor
    { hullHealth: 400, shieldCapacity: 100, shieldRegenRate: 5.0 }, // Mk.3 Corvette
    { hullHealth: 520, shieldCapacity: 120, shieldRegenRate: 5.5 }, // Mk.4 Destroyer
    { hullHealth: 660, shieldCapacity: 145, shieldRegenRate: 6.0 }, // Mk.5 Dreadnought
    { hullHealth: 820, shieldCapacity: 170, shieldRegenRate: 6.5 }  // Mk.6 Archon Flagship
];

export const SHIELD_UPGRADE_CAPACITY = 12;
export const SHIELD_UPGRADE_REGEN = 0.35;
export const AEGIS_MASTERY_CAPACITY = 20;
export const AEGIS_MASTERY_REGEN = 0.5;

export function getShipDefenseProfile(shipId: number): ShipDefenseProfile {
    const safeId = Math.max(0, Math.min(SHIP_DEFENSE_PROFILES.length - 1, Math.floor(shipId)));
    return SHIP_DEFENSE_PROFILES[safeId];
}
